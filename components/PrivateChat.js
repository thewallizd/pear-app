"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PrivateChat({ myName, partnerName, onBack, onlineUsers }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
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

    // 2. Realtime Listener (Untuk pesan masuk dari lawan bicara)
    const channel = supabase
      .channel(`chat:${myName}_${partnerName}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        // Cek apakah pesan ini relevan (antara aku dan dia)
        if (
           (payload.new.sender === partnerName && payload.new.recipient === myName) ||
           (payload.new.sender === myName && payload.new.recipient === partnerName) // Kasus kalau buka di 2 tab
        ) {
           // Cek duplikasi ID biar gak dobel sama optimistic update kita sendiri
           setMessages((prev) => {
               if (prev.some(m => m.id === payload.new.id || (m.id < 1 && m.content === payload.new.content && m.sender === payload.new.sender))) {
                   return prev; // Jangan tambah kalau sudah ada (efek optimistic)
               }
               return [...prev, payload.new];
           });
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [myName, partnerName]);

  // Auto Scroll ke bawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // --- OPTIMISTIC UPDATE ---
    const tempMsg = {
        id: Math.random(), // ID Random
        sender: myName,
        recipient: partnerName,
        content: newMessage,
        created_at: new Date().toISOString(),
        is_read: false
    };

    // 1. Tampilkan Langsung
    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");

    // 2. Kirim ke Database
    await supabase.from("messages").insert([{ 
        sender: myName, 
        recipient: partnerName, 
        content: tempMsg.content 
    }]);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[600px] overflow-hidden">
      {/* Header Chat */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-400 hover:text-green-600 font-bold">⬅</button>
            <div className="relative">
                <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${partnerName}`} className="w-10 h-10 rounded-full border border-gray-100 bg-gray-50"/>
                {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}
            </div>
            <div>
                <h3 className="font-bold text-gray-800 text-sm">@{partnerName}</h3>
                <p className="text-[10px] text-gray-400">{isOnline ? "Sedang Online" : "Offline"}</p>
            </div>
        </div>
      </div>

      {/* Area Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
        {messages.map((msg, idx) => {
            const isMe = msg.sender === myName;
            return (
                <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
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
        <button type="submit" className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl transition shadow-lg shadow-green-200">
            ✈️
        </button>
      </form>
    </div>
  );
}