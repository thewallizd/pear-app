"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PrivateChat({ myName, partnerName, onBack, onlineUsers }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState("idle"); 
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const chatId = [myName, partnerName].sort().join("_");
  const isOnline = onlineUsers.has(partnerName);

  useEffect(() => {
    fetchMessages();
    markAsRead();

    const channel = supabase.channel(`room_${chatId}`)
      // A. PESAN BARU
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "private_messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          setIsPartnerTyping(false);
          scrollToBottom();
          if (payload.new.sender === partnerName) markAsRead();
        }
      )
      // B. UPDATE (READ RECEIPT)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "private_messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
            setMessages((prev) => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
        }
      )
      // C. DELETE (PESAN DIHAPUS) 🗑️ <--- BARU
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "private_messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
            // Hapus pesan dari layar secara realtime
            setMessages((prev) => prev.filter(msg => msg.id !== payload.old.id));
        }
      )
      // D. TYPING
      .on("broadcast", { event: "typing" }, (payload) => {
          if (payload.payload.user === partnerName) {
              setIsPartnerTyping(true);
              clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => setIsPartnerTyping(false), 3000);
          }
      })
      // E. CALLS
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "calls" },
        (payload) => {
            if (payload.new.caller.toLowerCase() === myName.toLowerCase()) {
                if (payload.new.status === 'accepted') setCallStatus("connected");
                if (payload.new.status === 'rejected' || payload.new.status === 'ended') {
                    setCallStatus("ended");
                    setTimeout(() => { setIsCalling(false); setCallStatus("idle"); }, 1500);
                }
            }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [chatId, myName]);

  const fetchMessages = async () => {
    const { data } = await supabase.from("private_messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true });
    if (data) { setMessages(data); scrollToBottom(); }
  };

  const markAsRead = async () => {
      await supabase.from("private_messages").update({ is_read: true }).eq("chat_id", chatId).eq("sender", partnerName).eq("is_read", false);
  };

  const scrollToBottom = () => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
    await supabase.from("private_messages").insert([{ chat_id: chatId, sender: myName, receiver: partnerName, content: newMessage }]);
    setNewMessage("");
  };

  // FUNGSI HAPUS PESAN 🗑️
  const deleteMessage = async (msgId) => {
      const isSure = confirm("Tarik pesan ini?");
      if (isSure) {
          await supabase.from("private_messages").delete().eq("id", msgId);
          // UI akan update otomatis lewat listener 'DELETE' di atas
      }
  };

  const handleTyping = (e) => {
      setNewMessage(e.target.value);
      supabase.channel(`room_${chatId}`).send({ type: "broadcast", event: "typing", payload: { user: myName } });
  };

  const handleCall = async () => { setIsCalling(true); setCallStatus("calling"); await supabase.from("calls").insert([{ caller: myName, receiver: partnerName, status: 'ringing' }]); };
  const handleEndCall = async () => { const { data } = await supabase.from("calls").select("id").eq("caller", myName).eq("receiver", partnerName).order("created_at", {ascending:false}).limit(1).single(); if (data) await supabase.from("calls").update({ status: 'ended' }).eq("id", data.id); setIsCalling(false); setCallStatus("idle"); };

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right relative">
      
      {/* OVERLAY TELEPON */}
      {isCalling && (
        <div className="absolute inset-0 z-[60] bg-[#0f172a] flex flex-col items-center justify-center text-white">
            <h2 className="text-3xl font-bold mb-2">@{partnerName}</h2>
            <div className="mb-12">
                {callStatus === 'calling' && <span className="animate-pulse">📞 Memanggil...</span>}
                {callStatus === 'connected' && <span className="text-green-400">✅ Tersambung</span>}
                {callStatus === 'ended' && <span className="text-red-400">❌ Berakhir</span>}
            </div>
            <button onClick={handleEndCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 transition text-3xl">☎️</button>
        </div>
      )}

      {/* HEADER */}
      <div className="p-3 md:p-4 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center text-gray-600">←</button>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${partnerName}`} className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-50 border border-gray-100"/>
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-sm md:text-base">@{partnerName}</h3>
                    <p className={`text-[10px] md:text-xs ${isPartnerTyping ? "text-green-600 font-bold animate-pulse" : "text-gray-400"}`}>
                        {isPartnerTyping ? "Sedang mengetik..." : (isOnline ? "Online" : "Offline")}
                    </p>
                </div>
            </div>
        </div>
        <button onClick={handleCall} className="bg-green-50 text-green-600 w-10 h-10 rounded-full flex items-center justify-center hover:bg-green-500 hover:text-white transition">📞</button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f2f5]">
        {messages.map((msg) => {
            const isMe = msg.sender === myName;
            return (
                <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} group`}>
                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm relative flex items-center gap-2 ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none"}`}>
                    
                    {/* TOMBOL SAMPAH (Hanya muncul saat hover di pesan sendiri) 🗑️ */}
                    {isMe && (
                        <button 
                            onClick={() => deleteMessage(msg.id)}
                            className="text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition -ml-1 text-[10px]"
                            title="Tarik Pesan"
                        >
                            🗑️
                        </button>
                    )}

                    <span>{msg.content}</span>
                    
                    {/* CENTANG BIRU */}
                    {isMe && (
                        <span className="text-[10px] ml-1 font-bold mt-1">
                            {msg.is_read ? <span className="text-blue-200">✓✓</span> : <span className="text-white/60">✓</span>}
                        </span>
                    )}
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
        <input value={newMessage} onChange={handleTyping} placeholder="Tulis pesan..." className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition"/>
        <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700 transition">➤</button>
      </form>
    </div>
  );
}