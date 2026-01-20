"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import TimeAgo from "@/components/TimeAgo";

export default function GroupChat({ myName, group, onBack, onVisitProfile }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase.from("group_chat").select("*").eq("group_id", group.id).order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // LISTEN ALL EVENTS (*) untuk menangkap DELETE
    const channel = supabase.channel(`group_${group.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_chat", filter: `group_id=eq.${group.id}` }, (payload) => {
        if (payload.eventType === "INSERT") {
           setMessages((prev) => [...prev, payload.new]);
        } else if (payload.eventType === "DELETE") {
           setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [group.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault(); if (!newMessage.trim()) return;
    await supabase.from("group_chat").insert([{ group_id: group.id, sender: myName, message: newMessage }]);
    setNewMessage("");
  };

  const handleDeleteMessage = async (msgId) => {
    if (confirm("Hapus pesan grup ini?")) {
      await supabase.from("group_chat").delete().eq("id", msgId);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in slide-in-from-right duration-300">
      <div className="bg-white p-4 border-b border-gray-100 flex items-center gap-3 shadow-sm z-10">
        <button onClick={onBack} className="text-gray-400 hover:text-green-600 transition">⬅</button>
        <img src={`https://api.dicebear.com/9.x/initials/svg?seed=${group.avatar_seed}&backgroundColor=b6e3f4`} className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200"/>
        <div>
          <h2 className="font-bold text-gray-800 text-sm">{group.name}</h2>
          <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{group.description}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => {
          const isMe = msg.sender === myName;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} group/msg`}>
               {!isMe && <span className="text-[10px] text-gray-400 ml-1 mb-0.5 cursor-pointer hover:underline" onClick={() => onVisitProfile(msg.sender)}>@{msg.sender}</span>}
               
               <div className="flex items-center gap-2">
                  {isMe && (
                   <button 
                     onClick={() => handleDeleteMessage(msg.id)} 
                     className="text-[10px] text-gray-300 hover:text-red-500 opacity-0 group-hover/msg:opacity-100 transition"
                     title="Hapus"
                   >
                     🗑️
                   </button>
                 )}
                 <div className={`p-3 rounded-2xl text-sm shadow-sm max-w-[75%] ${isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"}`}>
                  {msg.message}
                 </div>
               </div>
              <span className="text-[9px] text-gray-400 mt-1 font-medium mx-1"><TimeAgo timestamp={msg.created_at} /></span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input type="text" className="flex-1 p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition" placeholder={`Kirim ke ${group.name}...`} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
        <button disabled={!newMessage.trim()} className="bg-blue-600 text-white px-4 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50">➤</button>
      </form>
    </div>
  );
}