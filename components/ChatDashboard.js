"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ChatDashboard({ myName, onSelectChat, onOpenGlobal, onSelectGroup, onlineUsers }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({}); // State untuk simpan jumlah chat belum dibaca

  useEffect(() => {
    fetchUsers();
    fetchUnreadMessages();

    // REALTIME: Kalau ada pesan baru masuk, update angkanya
    const channel = supabase.channel("dashboard_unread")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "private_messages", filter: `receiver=eq.${myName}` }, 
            (payload) => {
                // Tambah counter +1 untuk pengirim pesan ini
                setUnreadCounts(prev => ({
                    ...prev,
                    [payload.new.sender]: (prev[payload.new.sender] || 0) + 1
                }));
            }
        )
        // Kalau pesan dibaca (diupdate jadi read), kurangi counter (atau reset)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "private_messages", filter: `receiver=eq.${myName}` },
            () => {
                fetchUnreadMessages(); // Refresh ulang biar akurat
            }
        )
        .subscribe();

    return () => supabase.removeChannel(channel);
  }, [myName]);

  // 1. Ambil daftar user (kecuali diri sendiri)
  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("username").neq("username", myName);
    if (data) setUsers(data);
    setLoading(false);
  };

  // 2. Hitung pesan yang belum dibaca
  const fetchUnreadMessages = async () => {
      const { data } = await supabase
        .from("private_messages")
        .select("sender")
        .eq("receiver", myName)
        .eq("is_read", false); // Ambil yang belum dibaca saja
      
      if (data) {
          // Hitung jumlah pesan per pengirim
          const counts = {};
          data.forEach(msg => {
              counts[msg.sender] = (counts[msg.sender] || 0) + 1;
          });
          setUnreadCounts(counts);
      }
  };

  return (
    <div className="animate-in fade-in h-full flex flex-col">
      <h2 className="text-xl font-black mb-4 px-2">Obrolan 💬</h2>
      
      {/* GLOBAL & GRUP CHAT */}
      <div className="space-y-2 mb-6">
        <button onClick={onOpenGlobal} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition shadow-md">
            <div className="bg-white/20 p-2 rounded-full">🌍</div>
            <div className="text-left">
                <h3 className="font-bold">Global Chat</h3>
                <p className="text-xs text-blue-100">Ngobrol bareng semua warga</p>
            </div>
        </button>
      </div>

      <h3 className="font-bold text-gray-400 text-xs mb-3 px-2">PESAN PRIBADI (DM)</h3>

      {/* DAFTAR TEMAN + UNREAD BADGE */}
      <div className="space-y-2 flex-1 overflow-y-auto pb-20">
        {loading ? (
            <div className="text-center text-gray-300 mt-10">Memuat teman...</div>
        ) : (
            users.map((user) => {
                const count = unreadCounts[user.username] || 0; // Ambil jumlah pesan belum dibaca
                const isOnline = onlineUsers.has(user.username);

                return (
                    <button 
                        key={user.username} 
                        onClick={() => onSelectChat(user.username)}
                        className="w-full bg-white p-3 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img 
                                    src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user.username}`} 
                                    className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 group-hover:scale-110 transition" 
                                    alt="avatar"
                                />
                                {/* Indikator Online */}
                                {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                            </div>
                            
                            <div className="text-left">
                                <h4 className="font-bold text-gray-800">@{user.username}</h4>
                                <p className="text-[10px] text-gray-400">
                                    {isOnline ? "Sedang Online" : "Offline"}
                                </p>
                            </div>
                        </div>

                        {/* 🔴 BADGE UNREAD COUNTER */}
                        {count > 0 && (
                            <div className="bg-red-500 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full animate-bounce shadow-red-200 shadow-md">
                                {count > 99 ? "99+" : count}
                            </div>
                        )}
                        
                        {/* Panah (Kalau tidak ada pesan baru) */}
                        {count === 0 && (
                            <span className="text-gray-300 opacity-0 group-hover:opacity-100 transition">➤</span>
                        )}
                    </button>
                );
            })
        )}
      </div>
    </div>
  );
}