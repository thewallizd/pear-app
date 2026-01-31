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
      .order("created_at", { ascending: true });
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

    // HAPUS update state manual (setMessages) disini
    // Biarkan Realtime yang bekerja
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

  const isOnline = onlineUsers.has(partnerName);

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white shadow-sm z-10">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-800 text-xl">←</button>
        <div className="relative">
            <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${partnerName}`} className="w-10 h-10 rounded-full bg-gray-50"/>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        </div>
        <div>
            <h3 className="font-bold text-gray-800">@{partnerName}</h3>
            <p className="text-[10px] text-gray-400">{isOnline ? "Sedang Online" : "Offline"}</p>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f2f5]">
        {messages.length === 0 && <p className="text-center text-xs text-gray-400 mt-10">Mulai obrolan dengan @{partnerName}...</p>}
        {messages.map((msg) => {
          const isMe = msg.sender === myName;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none"}`}>
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

      {/* INPUT */}
      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tulis pesan..."
          className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
        />
        <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
          ➤
        </button>
      </form>
    </div>
  );
}