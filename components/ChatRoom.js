"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ChatRoom({ myName, onUserClick }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // 1. Load Global Chat (50 Terakhir)
    const fetchMessages = async () => {
      const { data } = await supabase.from("global_chat").select("*").order("created_at", { ascending: false }).limit(50);
      if (data) setMessages(data.reverse()); // Balik urutan biar yg baru di bawah
    };
    fetchMessages();

    // 2. Realtime
    const channel = supabase
      .channel("global_chat_room")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "global_chat" }, (payload) => {
        // Cek duplikasi optimistic
        setMessages((prev) => {
            const isDuplicate = prev.some(m => m.id < 1 && m.content === payload.new.content && m.sender === payload.new.sender);
            if (isDuplicate) return prev; 
            return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // --- OPTIMISTIC UPDATE ---
    const tempMsg = {
        id: Math.random(), 
        sender: myName,
        content: newMessage,
        created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");

    await supabase.from("global_chat").insert([{ sender: myName, content: tempMsg.content }]);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[600px] overflow-hidden relative">
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500 z-20"></div>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-white/95 backdrop-blur z-10 flex justify-between items-center">
        <div>
            <h2 className="font-black text-gray-800 text-lg flex items-center gap-2">
                🌍 Global Chat
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </h2>
            <p className="text-xs text-gray-400">Tempat nongkrong seluruh warga semesta.</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
        {messages.map((msg, i) => {
            const isMe = msg.sender === myName;
            return (
                <div key={i} className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    <img 
                        onClick={() => onUserClick(msg.sender)}
                        src={`https://api.dicebear.com/9.x/notionists/svg?seed=${msg.sender}`} 
                        className="w-8 h-8 rounded-full border border-gray-200 bg-white cursor-pointer hover:scale-110 transition"
                    />
                    <div className={`max-w-[80%]`}>
                        <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe ? "bg-blue-500 text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border border-gray-200"}`}>
                            {!isMe && <span className="block text-[10px] font-bold text-gray-400 mb-1 cursor-pointer hover:underline" onClick={() => onUserClick(msg.sender)}>@{msg.sender}</span>}
                            {msg.content}
                        </div>
                    </div>
                </div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
         <input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
            placeholder="Kirim pesan ke seluruh dunia..."
        />
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-xl transition shadow-lg shadow-blue-200 font-bold">
            Kirim
        </button>
      </form>
    </div>
  );
}