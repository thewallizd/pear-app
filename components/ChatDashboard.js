"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ChatDashboard({ myName, onSelectChat, onOpenGlobal }) {
  const [history, setHistory] = useState([]);
  const [friends, setFriends] = useState([]); // State Teman
  const [searchName, setSearchName] = useState("");
  const [activeTab, setActiveTab] = useState("history"); // 'history' atau 'friends'

  useEffect(() => {
    // 1. Fetch History Chat (Lama)
    const fetchHistory = async () => {
      const { data } = await supabase.from("private_messages").select("*").or(`sender.eq.${myName},recipient.eq.${myName}`).order("created_at", { ascending: false });
      if (data) {
        const uniqueChats = {};
        data.forEach((msg) => {
          const partner = msg.sender === myName ? msg.recipient : msg.sender;
          if (!uniqueChats[partner]) uniqueChats[partner] = { name: partner, lastMessage: msg.content, time: msg.created_at, isMe: msg.sender === myName };
        });
        setHistory(Object.values(uniqueChats));
      }
    };

    // 2. Fetch Daftar Teman (Baru)
    const fetchFriends = async () => {
      const { data } = await supabase.from('friends').select('*').eq('status', 'accepted').or(`requester.eq.${myName},receiver.eq.${myName}`);
      if (data) {
        // Ambil nama temannya (bukan nama kita)
        const friendList = data.map(f => f.requester === myName ? f.receiver : f.requester);
        setFriends(friendList);
      }
    };

    fetchHistory();
    fetchFriends();
  }, [myName]);

  const handleSearch = (e) => { e.preventDefault(); if(searchName.trim() && searchName !== myName) onSelectChat(searchName); };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[60vh]">
      <div className="bg-green-600 p-6 text-white">
        <h2 className="text-xl font-bold mb-1">Pusat Pesan 📬</h2>
        <div className="flex gap-4 mt-4 text-sm font-bold">
          <button onClick={() => setActiveTab('history')} className={`pb-1 border-b-2 ${activeTab === 'history' ? 'border-white text-white' : 'border-transparent text-green-200 hover:text-white'}`}>Riwayat</button>
          <button onClick={() => setActiveTab('friends')} className={`pb-1 border-b-2 ${activeTab === 'friends' ? 'border-white text-white' : 'border-transparent text-green-200 hover:text-white'}`}>Teman ({friends.length})</button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <button onClick={onOpenGlobal} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-xl shadow-md flex items-center justify-between hover:opacity-90">
          <div className="flex items-center gap-3"><div className="bg-white/20 p-2 rounded-lg">📢</div><div className="text-left"><h3 className="font-bold">Global Chat</h3><p className="text-xs text-indigo-100">Gibah Sirkel</p></div></div><span>➤</span>
        </button>

        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input type="text" placeholder="Cari user lain..." className="flex-1 p-2 text-sm rounded-lg border border-gray-300" value={searchName} onChange={(e) => setSearchName(e.target.value)}/>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Chat</button>
          </form>
        </div>

        {/* LIST KONTEN */}
        <div className="space-y-2">
          {activeTab === 'history' ? (
             history.map((chat) => (
                <button key={chat.name} onClick={() => onSelectChat(chat.name)} className="w-full flex items-center gap-3 p-3 bg-white hover:bg-green-50 rounded-xl border border-gray-100 text-left">
                  <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${chat.name}&radius=50`} className="w-12 h-12 rounded-full bg-gray-100"/>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{chat.name}</h4>
                    <p className="text-xs text-gray-500 truncate">{chat.isMe ? "Anda: " : ""}{chat.lastMessage}</p>
                  </div>
                </button>
             ))
          ) : (
             friends.length === 0 ? <p className="text-center text-gray-400 py-4 text-sm">Belum ada teman.</p> :
             friends.map((friendName) => (
                <button key={friendName} onClick={() => onSelectChat(friendName)} className="w-full flex items-center gap-3 p-3 bg-white hover:bg-green-50 rounded-xl border border-gray-100 text-left">
                  <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${friendName}&radius=50`} className="w-12 h-12 rounded-full bg-gray-100"/>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{friendName}</h4>
                    <p className="text-xs text-green-600 font-bold">Teman Akrab 🤝</p>
                  </div>
                </button>
             ))
          )}
        </div>
      </div>
    </div>
  );
}