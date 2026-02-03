"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ChatDashboard({ myName, onSelectChat, onOpenGlobal, onSelectGroup, onlineUsers }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState(""); // State Pencarian 🔍

  useEffect(() => {
    fetchUsers();
    fetchUnreadMessages();

    // REALTIME: Notifikasi Pesan Masuk
    const channel = supabase.channel("dashboard_unread")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "private_messages", filter: `receiver=eq.${myName}` }, 
            (payload) => {
                setUnreadCounts(prev => ({
                    ...prev,
                    [payload.new.sender]: (prev[payload.new.sender] || 0) + 1
                }));
            }
        )
        // Kalau pesan dibaca, refresh counter
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "private_messages", filter: `receiver=eq.${myName}` },
            () => { fetchUnreadMessages(); }
        )
        .subscribe();

    return () => supabase.removeChannel(channel);
  }, [myName]);

  const fetchUsers = async () => {
    // Ambil semua user kecuali diri sendiri
    const { data } = await supabase.from("profiles").select("username").neq("username", myName);
    if (data) setUsers(data);
    setLoading(false);
  };

  const fetchUnreadMessages = async () => {
      const { data } = await supabase.from("private_messages").select("sender").eq("receiver", myName).eq("is_read", false);
      if (data) {
          const counts = {};
          data.forEach(msg => { counts[msg.sender] = (counts[msg.sender] || 0) + 1; });
          setUnreadCounts(counts);
      }
  };

  // LOGIKA FILTER PENCARIAN 🔍
  // Mencari nama user yang mengandung huruf yang diketik (tidak peduli huruf besar/kecil)
  const filteredUsers = users.filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in fade-in h-full flex flex-col bg-white">
      <div className="p-4 pb-2">
          <h2 className="text-2xl font-black text-gray-800 mb-1">Obrolan 💬</h2>
          <p className="text-xs text-gray-400">Hubungkan silaturahmi antar warga.</p>
      </div>
      
      {/* SEARCH BAR (BARU) 🔍 */}
      <div className="px-4 mb-4">
        <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition">🔍</span>
            <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari teman..." 
                className="w-full bg-gray-50 border border-gray-100 pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition text-sm font-bold text-gray-700"
            />
        </div>
      </div>

      {/* MENU GLOBAL */}
      <div className="px-4 mb-6">
        <button onClick={onOpenGlobal} className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-4 rounded-2xl flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition shadow-lg shadow-purple-200">
            <div className="bg-white/20 w-10 h-10 flex items-center justify-center rounded-full text-xl backdrop-blur-sm">🌏</div>
            <div className="text-left flex-1">
                <h3 className="font-bold text-sm">Global Chat</h3>
                <p className="text-[10px] text-white/80">Ruang publik semua warga</p>
            </div>
            <span className="text-white/60">➤</span>
        </button>
      </div>

      <h3 className="font-bold text-gray-400 text-[10px] tracking-widest px-4 mb-2">DAFTAR TEMAN</h3>

      {/* DAFTAR USER */}
      <div className="space-y-1 flex-1 overflow-y-auto px-2 pb-20">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                <span className="text-xs">Memuat warga...</span>
            </div>
        ) : filteredUsers.length === 0 ? (
            // Tampilan kalau pencarian tidak ketemu
            <div className="text-center py-10 opacity-50">
                <p className="text-2xl mb-2">🕵️‍♂️</p>
                <p className="text-xs font-bold text-gray-400">Warga tidak ditemukan.</p>
            </div>
        ) : (
            filteredUsers.map((user) => {
                const count = unreadCounts[user.username] || 0;
                const isOnline = onlineUsers.has(user.username);

                return (
                    <button 
                        key={user.username} 
                        onClick={() => onSelectChat(user.username)}
                        className="w-full bg-white p-3 rounded-2xl hover:bg-gray-50 transition group border border-transparent hover:border-gray-100 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img 
                                    src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user.username}`} 
                                    className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 group-hover:scale-110 transition shadow-sm" 
                                    alt="avatar"
                                />
                                {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>}
                            </div>
                            
                            <div className="text-left">
                                <h4 className="font-bold text-gray-800 text-sm">@{user.username}</h4>
                                <p className={`text-[10px] font-medium ${isOnline ? "text-green-600" : "text-gray-400"}`}>
                                    {isOnline ? "• Online sekarang" : "Offline"}
                                </p>
                            </div>
                        </div>

                        {/* BADGE COUNTER */}
                        {count > 0 ? (
                            <div className="bg-red-500 text-white text-[10px] font-bold min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full animate-bounce shadow-md shadow-red-200">
                                {count > 99 ? "99+" : count}
                            </div>
                        ) : (
                            <span className="text-gray-300 opacity-0 group-hover:opacity-100 transition -translate-x-2 group-hover:translate-x-0 text-xs">Chat</span>
                        )}
                    </button>
                );
            })
        )}
      </div>
    </div>
  );
}