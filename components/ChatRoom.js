"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import TimeAgo from "@/components/TimeAgo"; // <--- IMPORT INI

export default function ChatRoom({ myName, onUserClick }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // 1. Ambil pesan lama
    const fetchMessages = async () => {
      const { data } = await supabase.from("global_chat").select("*").order("created_at", { ascending: true }).limit(50);
      if (data) setMessages(data);
    };
    fetchMessages();

    // 2. Realtime Listener
    const channel = supabase.channel("global_chat_channel")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "global_chat" }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Auto scroll ke bawah
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await supabase.from("global_chat").insert([{ user_name: myName, message: newMessage }]);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-green-50 p-4 border-b border-green-100 flex justify-between items-center">
        <h2 className="font-bold text-green-800 flex items-center gap-2">💬 Global Chat <span className="text-xs bg-green-200 px-2 rounded-full text-green-800">Live</span></h2>
        <span className="text-[10px] text-green-600 font-medium">Semua Warga</span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
        {messages.map((msg) => {
          const isMe = msg.user_name === myName;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                <img 
                  src={`https://api.dicebear.com/9.x/notionists/svg?seed=${msg.user_name}&radius=50`} 
                  className="w-8 h-8 rounded-full border border-white shadow-sm cursor-pointer hover:scale-110 transition"
                  onClick={() => !isMe && onUserClick(msg.user_name)}
                  title={`Chat ${msg.user_name}`}
                />
                <div className={`p-3 rounded-2xl text-sm shadow-sm relative group ${isMe ? "bg-green-600 text-white rounded-tr-none" : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"}`}>
                  {!isMe && <span className="block text-[10px] font-bold text-green-600 mb-0.5 cursor-pointer hover:underline" onClick={() => onUserClick(msg.user_name)}>{msg.user_name}</span>}
                  {msg.message}
                </div>
              </div>
              {/* WAKTU REALTIME */}
              <span className={`text-[9px] text-gray-400 mt-1 mx-11 font-medium`}>
                 <TimeAgo timestamp={msg.created_at} />
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input 
          type="text" 
          className="flex-1 p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition"
          placeholder="Tulis pesan..." 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
        />
        <button disabled={!newMessage.trim()} className="bg-green-600 text-white px-4 rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-50">➤</button>
      </form>
    </div>
  );
}