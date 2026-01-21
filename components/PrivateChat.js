"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PrivateChat({ myName, partnerName, onBack, onlineUsers }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isCalling, setIsCalling] = useState(false); // State untuk status telepon
  const messagesEndRef = useRef(null);

  const isOnline = onlineUsers && onlineUsers.has(partnerName);

  useEffect(() => {
    // 1. Load Chat Lama
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender.eq.${myName},recipient.eq.${partnerName}),and(sender.eq.${partnerName},recipient.eq.${myName})`)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // 2. Realtime Listener (Super Agresif - Tangkap semua, saring di sini)
    const channel = supabase
      .channel(`chat_room:${myName}_${partnerName}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const newMsg = payload.new;
        
        // Filter: Hanya terima pesan jika relevan dengan percakapan ini
        const isRelevant = 
            (newMsg.sender === partnerName && newMsg.recipient === myName) ||
            (newMsg.sender === myName && newMsg.recipient === partnerName);

        if (isRelevant) {
           setMessages((prev) => {
               // Cek duplikasi ID (Mencegah pesan dobel karena Optimistic Update)
               const exists = prev.some(m => m.id === newMsg.id || (m.content === newMsg.content && m.sender === newMsg.sender && m.id < 1));
               if (exists) return prev;
               return [...prev, newMsg];
           });
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [myName, partnerName]);

  // Auto Scroll ke bawah setiap ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // --- OPTIMISTIC UPDATE (Agar Chat Terasa Instan) ---
    const tempMsg = {
        id: Math.random(), // ID Sementara
        sender: myName,
        recipient: partnerName,
        content: newMessage,
        created_at: new Date().toISOString(),
        is_read: false
    };

    // 1. Tampilkan langsung di layar (tanpa menunggu database)
    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");

    // 2. Kirim ke Database di background
    await supabase.from("messages").insert([{ 
        sender: myName, 
        recipient: partnerName, 
        content: tempMsg.content 
    }]);
  };

  // --- TAMPILAN MODE TELEPON (CALLING UI) ---
  if (isCalling) {
    return (
      <div className="bg-gray-900 text-white rounded-3xl h-[600px] flex flex-col items-center justify-center relative overflow-hidden animate-in zoom-in duration-300 shadow-2xl">
        {/* Background Pattern Halus */}
        <div className="absolute top-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        {/* Avatar Berdenyut */}
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-50"></div>
            <img 
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${partnerName}`} 
                className="w-32 h-32 rounded-full border-4 border-gray-800 bg-gray-700 relative z-10 shadow-xl" 
            />
        </div>

        <h2 className="text-2xl font-bold mb-1 tracking-wide">{partnerName}</h2>
        <p className="text-green-400 animate-pulse text-sm mb-12 font-medium">Memanggil...</p>

        {/* Tombol Kontrol Telepon */}
        <div className="flex gap-8 z-10">
            <button className="p-4 rounded-full bg-gray-800 hover:bg-gray-700 transition text-gray-300">
                🎤
            </button>
            
            <button 
                onClick={() => setIsCalling(false)} 
                className="p-5 rounded-full bg-red-500 hover:bg-red-600 transition shadow-lg shadow-red-500/50 transform hover:scale-110"
            >
                📞 <span className="sr-only">End Call</span>
            </button>
            
            <button className="p-4 rounded-full bg-gray-800 hover:bg-gray-700 transition text-gray-300">
                🔊
            </button>
        </div>
      </div>
    );
  }

  // --- TAMPILAN UTAMA CHAT ---
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[600px] overflow-hidden">
      {/* Header Chat */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-400 hover:text-green-600 font-bold p-2 hover:bg-gray-50 rounded-full transition">⬅</button>
            <div className="relative">
                <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${partnerName}`} className="w-10 h-10 rounded-full border border-gray-100 bg-gray-50"/>
                {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}
            </div>
            <div>
                <h3 className="font-bold text-gray-800 text-sm">@{partnerName}</h3>
                <p className="text-[10px] text-gray-400">{isOnline ? "Online" : "Offline"}</p>
            </div>
        </div>

        {/* Tombol Telepon & Menu */}
        <div className="flex gap-2">
            <button 
                onClick={() => setIsCalling(true)} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition shadow-sm"
                title="Panggilan Suara"
            >
                📞
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 transition">
                ⋮
            </button>
        </div>
      </div>

      {/* Area Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
        {messages.map((msg, idx) => {
            const isMe = msg.sender === myName;
            return (
                <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-1`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? "bg-green-500 text-white rounded-tr-none" : "bg-white text-gray-700 rounded-tl-none border border-gray-200"}`}>
                        {msg.content}
                        <div className={`text-[9px] mt-1 text-right ${isMe ? "text-green-100" : "text-gray-400"}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                </div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Chat */}
      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-100 transition"
            placeholder={`Kirim pesan ke @${partnerName}...`}
        />
        <button type="submit" disabled={!newMessage.trim()} className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white p-3 rounded-xl transition shadow-lg shadow-green-200">
            ➤
        </button>
      </form>
    </div>
  );
}