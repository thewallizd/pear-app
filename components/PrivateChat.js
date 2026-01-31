"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PrivateChat({ myName, partnerName, onBack, onlineUsers }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Buat Room ID yang konsisten (alfabetis), misal: "bombom_wali"
  const chatId = [myName, partnerName].sort().join("_");

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel(`private_chat:${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "private_messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setMessages((prev) => {
             // Anti Duplikat
             if (prev.some(msg => msg.id === payload.new.id)) return prev;
             return [...prev, payload.new];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [chatId]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("private_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true }); // Pastikan urut dari lama ke baru
    if (data) {
        setMessages(data);
        scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    // INSERT DB ONLY (Realtime akan handle display)
    await supabase.from("private_messages").insert([
      { chat_id: chatId, sender: myName, receiver: partnerName, content: newMessage }
    ]);
    
    setNewMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // --- FITUR TELEPON ---
  const handleCall = async () => {
      if(!confirm(`Hubungi @${partnerName}?`)) return;
      
      // Insert ke tabel calls
      await supabase.from("calls").insert([{
          caller: myName,
          receiver: partnerName,
          status: 'ringing'
      }]);
      
      alert("Memanggil... Tunggu dia angkat ya! 📞");
  };

  const isOnline = onlineUsers.has(partnerName);

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right relative">
      
      {/* HEADER (FIXED MOBILE & DESKTOP) */}
      <div className="p-3 md:p-4 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="bg-gray-100 hover:bg-gray-200 w-8 h-8 flex items-center justify-center rounded-full text-gray-600 transition">
                ←
            </button>
            
            <div className="flex items-center gap-2">
                <div className="relative">
                    <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${partnerName}`} className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-50 border border-gray-100"/>
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-sm md:text-base leading-tight">@{partnerName}</h3>
                    <p className="text-[10px] md:text-xs text-gray-400">{isOnline ? "Online" : "Offline"}</p>
                </div>
            </div>
        </div>

        {/* TOMBOL TELEPON (VISIBLE DI SEMUA LAYAR) */}
        <button 
            onClick={handleCall}
            className="bg-green-50 text-green-600 p-2 md:px-4 md:py-2 rounded-full hover:bg-green-500 hover:text-white transition flex items-center gap-2"
            title="Telepon Sekarang"
        >
            <span className="text-xl">📞</span>
            <span className="hidden md:inline text-sm font-bold">Panggil</span>
        </button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f2f5]">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
                <span className="text-4xl mb-2">👋</span>
                <p className="text-xs text-center">Belum ada riwayat pesan.<br/>Sapa @{partnerName} sekarang!</p>
            </div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.sender === myName;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] md:max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none border border-gray-100"}`}>
                {msg.content}
              </div>
              <span className="text-[9px] text-gray-400 mt-1 mx-1">
                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tulis pesan..."
          className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
        />
        <button 
            type="submit" 
            disabled={!newMessage.trim()} 
            className="bg-blue-600 text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center hover:bg-blue-700 transition shadow-md shadow-blue-200 disabled:opacity-50"
        >
          ➤
        </button>
      </form>
    </div>
  );
}