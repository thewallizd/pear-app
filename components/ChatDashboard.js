"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ChatDashboard({ myName, onSelectChat, onOpenGlobal, onSelectGroup, onlineUsers }) {
  const [activeTab, setActiveTab] = useState("Private"); // Private | Groups
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // --- LOGIC NOTIFIKASI ALA WHATSAPP ---
  useEffect(() => {
    // 1. Minta Izin Notifikasi Browser
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    // 2. Setup Suara Notifikasi (Menggunakan file MP3 pendek)
    const notificationSound = new Audio("https://cdn.freesound.org/previews/536/536108_11306637-lq.mp3"); // Sound 'Ting' sederhana

    // 3. Listener Global untuk Pesan Masuk (Private)
    const msgChannel = supabase.channel("global_messages_listener")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
            if (payload.new.recipient === myName) {
                // Mainkan Suara
                notificationSound.play().catch(e => console.log("Audio play blocked", e));
                
                // Getar HP (Jika di Android)
                if (navigator.vibrate) navigator.vibrate(200);

                // Tampilkan Notifikasi Popup Browser
                if (Notification.permission === "granted" && document.hidden) {
                    new Notification(`Pesan baru dari @${payload.new.sender}`, {
                        body: payload.new.content,
                        icon: "/icon.png" // Pastikan ada icon.png di folder public
                    });
                }
                
                // Refresh list chat
                fetchConversations();
            }
        })
        .subscribe();

    return () => supabase.removeChannel(msgChannel);
  }, [myName]);
  // -------------------------------------

  useEffect(() => {
    fetchConversations();
    fetchGroups();
  }, [myName]);

  const fetchConversations = async () => {
    // Logic mengambil list chat (disederhanakan: ambil semua pesan yg melibatkan saya, lalu group by sender)
    const { data } = await supabase.from("messages")
      .select("*").or(`sender.eq.${myName},recipient.eq.${myName}`).order("created_at", { ascending: false });
    
    if (data) {
        const uniqueUsers = new Set();
        const chatList = [];
        data.forEach(msg => {
            const other = msg.sender === myName ? msg.recipient : msg.sender;
            if (!uniqueUsers.has(other)) {
                uniqueUsers.add(other);
                chatList.push({ user: other, lastMsg: msg.content, time: msg.created_at, unread: !msg.is_read && msg.recipient === myName });
            }
        });
        setConversations(chatList);
    }
  };

  const fetchGroups = async () => {
    const { data } = await supabase.from("groups").select("*").eq("is_active", true);
    if (data) setGroups(data);
  };

  const createGroup = async () => {
      if(!newGroupName.trim()) return;
      const { data, error } = await supabase.from("groups").insert([{ name: newGroupName, admin: myName, is_active: true }]).select();
      if(data) {
          setGroups([data[0], ...groups]);
          setIsCreatingGroup(false);
          setNewGroupName("");
      }
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-2">
      
      {/* Header Tab */}
      <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm">
        <button onClick={() => setActiveTab("Private")} className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${activeTab === "Private" ? "bg-green-100 text-green-700" : "text-gray-500 hover:bg-gray-50"}`}>Pribadi 📩</button>
        <button onClick={() => setActiveTab("Groups")} className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${activeTab === "Groups" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-50"}`}>Grup 👥</button>
      </div>

      {/* Global Chat Banner */}
      <div onClick={onOpenGlobal} className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 rounded-2xl text-white shadow-lg cursor-pointer transform hover:scale-[1.02] transition relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-20 text-6xl group-hover:rotate-12 transition">🌍</div>
        <h3 className="font-black text-lg">Global Chat Semesta</h3>
        <p className="text-xs opacity-90">Nongkrong bareng seluruh warga Pear.</p>
      </div>

      {/* --- TAB PRIVATE CHAT --- */}
      {activeTab === "Private" && (
        <div className="space-y-2">
            {conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">Belum ada chat pribadi.</div>
            ) : (
                conversations.map((chat) => (
                    <div key={chat.user} onClick={() => onSelectChat(chat.user)} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition shadow-sm">
                        <div className="relative">
                            <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${chat.user}`} className="w-12 h-12 rounded-full border border-gray-200"/>
                            {onlineUsers.has(chat.user) && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                                <h4 className="font-bold text-gray-800 text-sm">@{chat.user}</h4>
                                <span className="text-[10px] text-gray-400">{new Date(chat.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className={`text-xs truncate mt-0.5 ${chat.unread ? "font-bold text-black" : "text-gray-500"}`}>{chat.lastMsg}</p>
                        </div>
                        {chat.unread && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                    </div>
                ))
            )}
        </div>
      )}

      {/* --- TAB GROUP CHAT --- */}
      {activeTab === "Groups" && (
          <div className="space-y-3">
              <button onClick={() => setIsCreatingGroup(!isCreatingGroup)} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-bold hover:border-blue-400 hover:text-blue-500 transition text-sm">
                  {isCreatingGroup ? "Batal" : "+ Buat Grup Baru"}
              </button>
              
              {isCreatingGroup && (
                  <div className="flex gap-2 animate-in fade-in">
                      <input value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} className="flex-1 border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="Nama Grup..." />
                      <button onClick={createGroup} className="bg-blue-500 text-white px-4 rounded-xl font-bold text-sm">Buat</button>
                  </div>
              )}

              {groups.map(g => (
                  <div key={g.id} onClick={() => onSelectGroup(g)} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">#</div>
                      <div className="flex-1">
                          <h4 className="font-bold text-gray-800 text-sm">{g.name}</h4>
                          <p className="text-[10px] text-gray-400">Dibuat oleh @{g.admin}</p>
                      </div>
                      <span className="text-gray-300">➤</span>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}