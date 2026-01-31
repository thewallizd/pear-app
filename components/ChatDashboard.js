"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ChatDashboard({ myName, onSelectChat, onOpenGlobal, onSelectGroup, onlineUsers }) {
  const [recentChats, setRecentChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk Tambah Teman Manual
  const [searchName, setSearchName] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchRecentChats();
    fetchGroups();
  }, [myName]);

  const fetchRecentChats = async () => {
    const { data } = await supabase
      .from("private_messages")
      .select("*")
      .or(`sender.eq.${myName},receiver.eq.${myName}`)
      .order("created_at", { ascending: false });

    if (data) {
      const uniquePartners = new Set();
      const chatList = [];
      data.forEach(msg => {
        const partner = msg.sender === myName ? msg.receiver : msg.sender;
        if (!uniquePartners.has(partner)) {
            uniquePartners.add(partner);
            chatList.push({
                username: partner,
                lastMessage: msg.content,
                timestamp: msg.created_at
            });
        }
      });
      setRecentChats(chatList.slice(0, 20)); // Ambil 20 terakhir
    }
    setLoading(false);
  };

  const fetchGroups = async () => {
      const { data } = await supabase.from("groups").select("*");
      if(data) setGroups(data);
  };

  const handleCreateGroup = async () => {
      const name = prompt("Nama Grup Baru:");
      if(!name) return;
      await supabase.from("groups").insert([{ name: name, admin: myName }]);
      fetchGroups(); // Refresh manual
  };

  // --- FITUR BARU: MULAI CHAT MANUAL ---
  const handleStartNewChat = (e) => {
      e.preventDefault();
      if(!searchName.trim()) return;
      if(searchName === myName) return alert("Gak bisa chat diri sendiri hehe");
      
      onSelectChat(searchName); // Langsung buka chat room
      setSearchName("");
      setIsSearching(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      
      {/* 1. TOMBOL AKSI UTAMA */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onOpenGlobal} className="p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-200 hover:scale-[1.02] transition text-left relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="font-bold text-lg">🌍 Global Chat</h3>
                <p className="text-[10px] opacity-80">Semua warga kumpul disini</p>
            </div>
        </button>

        <button onClick={() => setIsSearching(!isSearching)} className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-green-500 hover:shadow-md transition text-left group">
            <h3 className="font-bold text-gray-800 group-hover:text-green-600 transition">🔍 Cari Teman</h3>
            <p className="text-[10px] text-gray-400">Mulai chat baru</p>
        </button>
      </div>

      {/* FORM CARI TEMAN (Muncul jika tombol Cari diklik) */}
      {isSearching && (
          <form onSubmit={handleStartNewChat} className="bg-green-50 p-4 rounded-2xl animate-in slide-in-from-top-2 border border-green-100">
              <label className="text-xs font-bold text-green-700 block mb-2">Masukkan Username Teman:</label>
              <div className="flex gap-2">
                  <input 
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Contoh: bombom"
                    className="flex-1 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    autoFocus
                  />
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm">Chat ➤</button>
              </div>
          </form>
      )}

      {/* 2. DAFTAR GRUP */}
      <div>
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="font-bold text-gray-800 text-sm">Grup Diskusi 👥</h3>
            <button onClick={handleCreateGroup} className="text-[10px] bg-gray-100 px-2 py-1 rounded-md hover:bg-gray-200">+ Buat Grup</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {groups.map(g => (
                  <button key={g.id} onClick={() => onSelectGroup(g)} className="min-w-[120px] bg-white border border-gray-200 p-3 rounded-xl hover:border-purple-500 hover:shadow-md transition text-left">
                      <p className="font-bold text-gray-800 text-sm truncate">{g.name}</p>
                      <p className="text-[10px] text-gray-400">@{g.admin}</p>
                  </button>
              ))}
          </div>
      </div>

      {/* 3. RIWAYAT PESAN (RECENT CHATS) */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3 text-sm px-1">Pesan Terakhir 💬</h3>
        <div className="space-y-2">
            {loading && <p className="text-xs text-center text-gray-400">Memuat...</p>}
            {!loading && recentChats.length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 mb-2">Belum ada riwayat chat.</p>
                    <button onClick={() => setIsSearching(true)} className="text-xs text-blue-500 font-bold underline">Cari Teman Sekarang</button>
                </div>
            )}
            
            {recentChats.map((chat) => {
                 const isOnline = onlineUsers.has(chat.username);
                 return (
                    <div key={chat.username} onClick={() => onSelectChat(chat.username)} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 hover:shadow-md cursor-pointer transition">
                        <div className="relative">
                            <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${chat.username}`} className="w-12 h-12 rounded-full bg-gray-50"/>
                            {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-bold text-gray-800 text-sm">@{chat.username}</h4>
                                <span className="text-[10px] text-gray-400">{new Date(chat.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                        </div>
                    </div>
                 );
             })}
        </div>
      </div>
    </div>
  );
}