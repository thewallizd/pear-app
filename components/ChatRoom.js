"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ChatRoom({ myName, onUserClick }) { // <-- Terima props onUserClick
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null); 

  // 1. Ambil Pesan & Dengar Real-time
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50);
      if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel("global_chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Kirim Pesan
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage;
    setNewMessage(""); 

    await supabase.from("messages").insert([{ content, author: myName }]);
  };

  return (
    <div className="flex flex-col h-[80vh] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
      
      {/* HEADER CHAT */}
      <div className="bg-green-600 p-4 text-white flex justify-between items-center shadow-md z-10">
        <div>
          <h2 className="font-bold text-lg">Gibah Sirkel 💬</h2>
          <p className="text-xs text-green-100 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
            Online
          </p>
        </div>
      </div>

      {/* AREA CHAT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e5ddd5]">
        {messages.map((msg) => {
          const isMe = msg.author === myName;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
              
              {/* --- UPDATE: AVATAR BISA DIKLIK --- */}
              <button 
                onClick={() => onUserClick && onUserClick(msg.author)} 
                title={`Chat PC dengan ${msg.author}`}
                className="hover:scale-110 transition transform"
              >
                <img 
                  src={`https://api.dicebear.com/9.x/notionists/svg?seed=${msg.author}&radius=50`}
                  className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300"
                  alt={msg.author}
                />
              </button>

              {/* Bubble Chat */}
              <div className={`max-w-[70%] p-3 rounded-xl text-sm shadow-sm relative ${
                isMe 
                  ? "bg-green-100 text-gray-900 rounded-tr-none" 
                  : "bg-white text-gray-900 rounded-tl-none"
              }`}>
                {!isMe && (
                  <button 
                    onClick={() => onUserClick && onUserClick(msg.author)}
                    className="text-[10px] font-bold text-orange-600 mb-1 hover:underline block"
                  >
                    {msg.author}
                  </button>
                )}
                <p className="leading-relaxed">{msg.content}</p>
                <p className="text-[9px] text-gray-400 text-right mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT CHAT */}
      <form onSubmit={handleSendMessage} className="p-3 bg-gray-100 border-t border-gray-200 flex gap-2">
        <input
          type="text"
          placeholder="Ketik pesan rahasia..."
          className="flex-1 p-3 rounded-full border border-gray-300 focus:outline-none focus:border-green-500 text-sm"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button 
          disabled={!newMessage.trim()}
          className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700 transition disabled:opacity-50 shadow-md"
        >
          ➤
        </button>
      </form>
    </div>
  );
}