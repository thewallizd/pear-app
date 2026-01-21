"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function GroupChat({ myName, group, onBack, onVisitProfile }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  
  // Cek apakah aku admin grup ini (asumsi kolom 'admin' atau 'created_by' ada di tabel groups)
  // Kita pakai logic: Jika namaku sama dengan pembuat grup
  const isAdmin = group.admin === myName || group.created_by === myName; 

  useEffect(() => {
    // 1. Load Chat History
    const fetchMessages = async () => {
      const { data } = await supabase.from("group_messages").select("*").eq("group_id", group.id).order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // 2. Realtime Listener
    const channel = supabase.channel(`group:${group.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${group.id}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [group.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Optimistic Update
    const tempMsg = { id: Math.random(), group_id: group.id, sender: myName, content: newMessage, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");

    await supabase.from("group_messages").insert([{ group_id: group.id, sender: myName, content: tempMsg.content }]);
  };

  // --- FITUR BARU: HAPUS GRUP ---
  const handleDeleteGroup = async () => {
    if (confirm("Yakin mau bubarkan grup ini selamanya? Semua chat akan hilang!")) {
        const { error } = await supabase.from("groups").delete().eq("id", group.id);
        if (error) {
            alert("Gagal menghapus grup: " + error.message);
        } else {
            alert("Grup berhasil dibubarkan.");
            onBack(); // Kembali ke dashboard
        }
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[600px] overflow-hidden">
      {/* Header Group */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-400 hover:text-green-600 font-bold">⬅</button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                {group.name.charAt(0).toUpperCase()}
            </div>
            <div>
                <h3 className="font-bold text-gray-800 text-sm">{group.name}</h3>
                <p className="text-[10px] text-gray-400">{group.description || "Grup Warga"}</p>
            </div>
        </div>

        {/* Tombol Hapus Grup (Hanya untuk Admin) */}
        {isAdmin && (
            <button 
                onClick={handleDeleteGroup}
                className="bg-red-50 text-red-500 p-2 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition flex items-center gap-1"
                title="Bubarkan Grup"
            >
                🗑️ Bubarkan
            </button>
        )}
      </div>

      {/* Area Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {messages.map((msg, idx) => {
            const isMe = msg.sender === myName;
            return (
                <div key={idx} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    {!isMe && (
                        <img 
                            onClick={() => onVisitProfile(msg.sender)}
                            src={`https://api.dicebear.com/9.x/notionists/svg?seed=${msg.sender}`} 
                            className="w-8 h-8 rounded-full border border-gray-100 cursor-pointer"
                        />
                    )}
                    <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${isMe ? "bg-green-500 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"}`}>
                        {!isMe && <p className="text-[10px] font-bold text-gray-500 mb-0.5">{msg.sender}</p>}
                        {msg.content}
                        <p className={`text-[9px] text-right mt-1 ${isMe ? "text-green-100" : "text-gray-400"}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
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
            className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-100"
            placeholder={`Kirim ke grup ${group.name}...`}
        />
        <button className="bg-green-500 text-white p-3 rounded-xl hover:bg-green-600 transition font-bold">🚀</button>
      </form>
    </div>
  );
}