"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ChatDashboard({ myName, onSelectChat, onOpenGlobal, onSelectGroup, onlineUsers }) {
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    fetchRecentChats();
    fetchGroups();
  }, [myName]);

  // 1. Ambil Daftar Orang yang pernah chat dengan kita
  const fetchRecentChats = async () => {
    // Ambil pesan dimana pengirim ATAU penerima adalah saya
    const { data, error } = await supabase
      .from("private_messages")
      .select("*")
      .or(`sender.eq.${myName},receiver.eq.${myName}`)
      .order("created_at", { ascending: false })
      .limit(50); // Ambil 50 pesan terakhir untuk scan history

    if (data) {
      // Logic Unik: Cari nama partner chat dari tumpukan pesan
      const uniquePartners = new Set();
      const chatList = [];

      data.forEach(msg => {
        const partner = msg.sender === myName ? msg.receiver : msg.sender;
        if (!uniquePartners.has(partner)) {
            uniquePartners.add(partner);
            chatList.push({
                username: partner,
                lastMessage: msg.content,
                time: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                timestamp: msg.created_at
            });
        }
      });
      setRecentChats(chatList);
    }
    setLoading(false);
  };

  // 2. Ambil Daftar Grup
  const fetchGroups = async () => {
      const { data } = await supabase.from("groups").select("*");
      if(data) setGroups(data);
  };

  // 3. Buat Grup Baru
  const handleCreateGroup = async () => {
      const name = prompt("Nama Grup Baru:");
      if(!name) return;
      
      const { data, error } = await supabase.from("groups").insert([{ name: name, admin: myName }]).select().single();
      if(data) {
          setGroups([...groups, data]);
          // Auto join admin
          await supabase.from("group_members").insert([{ group_id: data.id, username: myName }]);
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* SECTION 1: TOMBOL GLOBAL & BUAT GRUP */}
      <div className="grid grid-cols-2 gap-3">
        <button 
            onClick={onOpenGlobal}
            className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-200 hover:scale-[1.02] transition text-left"
        >
            <h3 className="font-bold text-lg">🌍 Global Chat</h3>
            <p className="text-xs opacity-80">Nongkrong satu semesta</p>
        </button>

        <button 
            onClick={handleCreateGroup}
            className="p-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-purple-400 hover:text-purple-500 hover:bg-purple-50 transition flex flex-col justify-center items-center gap-2"
        >
            <span className="text-2xl">+</span>
            <span className="text-xs font-bold">Buat Grup Baru</span>
        </button>
      </div>

      {/* SECTION 2: GRUP SAYA */}
      <div>
          <h3 className="font-bold text-gray-800 mb-3 text-sm px-1">Grup Diskusi 👥</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {groups.map(g => (
                  <button 
                    key={g.id} 
                    onClick={() => onSelectGroup(g)}
                    className="min-w-[120px] bg-white border border-gray-200 p-3 rounded-xl hover:border-purple-500 hover:shadow-md transition text-left relative"
                  >
                      {/* Delete Icon (kecil di pojok kalau mau ditambah nanti) */}
                      <p className="font-bold text-gray-800 text-sm truncate">{g.name}</p>
                      <p className="text-[10px] text-gray-400">@{g.admin}</p>
                  </button>
              ))}
          </div>
      </div>

      {/* SECTION 3: RIWAYAT CHAT PRIBADI */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3 text-sm px-1">Pesan Terakhir 💬</h3>
        <div className="space-y-2">
            {loading ? <p className="text-xs text-gray-400 text-center">Memuat riwayat...</p> : 
             recentChats.length === 0 ? <p className="text-xs text-gray-400 text-center py-4">Belum ada chat pribadi.</p> :
             recentChats.map((chat) => {
                 const isOnline = onlineUsers.has(chat.username);
                 return (
                    <div 
                        key={chat.username} 
                        onClick={() => onSelectChat(chat.username)}
                        className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 hover:shadow-md cursor-pointer transition"
                    >
                        <div className="relative">
                            <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${chat.username}`} className="w-12 h-12 rounded-full bg-gray-50"/>
                            {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-bold text-gray-800 text-sm">@{chat.username}</h4>
                                <span className="text-[10px] text-gray-400">{chat.time}</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                        </div>
                    </div>
                 );
             })
            }
        </div>
      </div>

    </div>
  );
}