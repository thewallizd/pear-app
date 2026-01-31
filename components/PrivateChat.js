"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PrivateChat({ myName, partnerName, onBack, onlineUsers, activeSession }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  // State Telepon
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState("idle");
  const [currentCallId, setCurrentCallId] = useState(null);

  const messagesEndRef = useRef(null);
  const chatId = [myName, partnerName].sort().join("_");
  const isOnline = onlineUsers.has(partnerName);

  // --- 1. INISIALISASI (Cek Operan dari Home) ---
  useEffect(() => {
    if (activeSession) {
        // Jika masuk kesini karena "Angkat Telepon", langsung tampilkan layar Connected
        setIsCalling(true);
        setCallStatus("connected");
        setCurrentCallId(activeSession.id);
    }
  }, [activeSession]);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel(`private_chat:${chatId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "private_messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setMessages((prev) => { if (prev.some(msg => msg.id === payload.new.id)) return prev; return [...prev, payload.new]; });
          scrollToBottom();
        }
      )
      // Dengar Status Telepon
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "calls", filter: `id=eq.${currentCallId}` },
        (payload) => {
            if (payload.new.status === 'accepted') setCallStatus("connected");
            if (payload.new.status === 'rejected' || payload.new.status === 'ended' || payload.new.status === 'missed') {
                setCallStatus("ended");
                setTimeout(() => { setIsCalling(false); setCallStatus("idle"); }, 2000);
            }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [chatId, currentCallId]);

  const fetchMessages = async () => {
    const { data } = await supabase.from("private_messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true });
    if (data) { setMessages(data); scrollToBottom(); }
  };

  const scrollToBottom = () => { setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100); };

  const sendMessage = async (e) => {
    e?.preventDefault(); if (!newMessage.trim()) return;
    await supabase.from("private_messages").insert([{ chat_id: chatId, sender: myName, receiver: partnerName, content: newMessage }]);
    setNewMessage("");
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  // --- 2. LOGIC TELEPON & TIMEOUT ---
  const handleCall = async () => {
      setIsCalling(true);
      setCallStatus("calling");

      // Insert Call
      const { data } = await supabase.from("calls").insert([{
          caller: myName,
          receiver: partnerName,
          status: 'ringing'
      }]).select().single();

      if (data) {
          const callId = data.id;
          setCurrentCallId(callId);

          // PASANG TIMER 30 DETIK (Missed Call) ⏰
          setTimeout(async () => {
              // Cek status di database, jangan cuma state lokal (biar akurat)
              const { data: latest } = await supabase.from("calls").select("status").eq("id", callId).single();
              
              if (latest && latest.status === 'ringing') {
                  // Kalau masih ringing setelah 30 detik -> Matikan & Set Missed
                  await supabase.from("calls").update({ status: 'missed' }).eq("id", callId);
                  
                  setCallStatus("ended");
                  alert("Tidak ada jawaban.");
                  setIsCalling(false);
              }
          }, 30000); // 30.000 ms = 30 detik
      }
  };

  const handleEndCall = async () => {
      if (currentCallId) {
          await supabase.from("calls").update({ status: 'ended' }).eq("id", currentCallId);
      }
      setIsCalling(false);
      setCallStatus("idle");
      setCurrentCallId(null);
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right relative">
      
      {/* OVERLAY TELEPON (UI Call) */}
      {isCalling && (
        <div className="absolute inset-0 z-50 bg-gray-900/95 flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
            <div className="mb-8 relative">
                <span className={`absolute inset-0 rounded-full bg-green-500 opacity-50 ${callStatus === 'calling' ? 'animate-ping' : ''}`}></span>
                <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${partnerName}`} className="w-32 h-32 rounded-full border-4 border-white relative z-10 bg-gray-800"/>
            </div>
            <h2 className="text-2xl font-bold mb-2">@{partnerName}</h2>
            <p className="text-green-400 font-medium mb-12 animate-pulse">
                {callStatus === 'calling' && "📞 Memanggil..."}
                {callStatus === 'connected' && "✅ Tersambung (Audio On)"}
                {callStatus === 'ended' && "❌ Panggilan Berakhir"}
            </p>
            <button onClick={handleEndCall} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition hover:scale-110 shadow-lg shadow-red-500/50">
                <span className="text-2xl">☎️</span>
            </button>
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
                    <p className="text-[10px] md:text-xs text-gray-400">{isOnline ? "Online" : "Offline"}</p>
                </div>
            </div>
        </div>
        <button onClick={handleCall} className="bg-green-50 text-green-600 w-10 h-10 rounded-full flex items-center justify-center hover:bg-green-500 hover:text-white transition">📞</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f2f5]">
        {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === myName ? "items-end" : "items-start"}`}>
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm ${msg.sender === myName ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none"}`}>{msg.content}</div>
            </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Tulis pesan..." className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:outline-none"/>
        <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center">➤</button>
      </form>
    </div>
  );
}