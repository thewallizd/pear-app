"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function GroupChat({ group, myName, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [sending, setSending] = useState(false); // Loading state saat kirim
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    checkMembership();

    const channel = supabase
      .channel(`group_chat:${group.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${group.id}` },
        (payload) => {
          // Hanya tambahkan pesan jika ID-nya belum ada di state (Mencegah duplikat)
          setMessages((prev) => {
            if (prev.some(msg => msg.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [group.id]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("group_messages")
      .select("*")
      .eq("group_id", group.id)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data);
      scrollToBottom();
    }
  };

  const checkMembership = async () => {
    const { data } = await supabase.from("group_members").select("*").eq("group_id", group.id).eq("username", myName).single();
    if (data || group.id === 'global' || group.admin === myName) setIsMember(true);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sendMessage = async (e) => {
    e?.preventDefault(); // Handle form submit
    if (!newMessage.trim() || sending) return;

    setSending(true); // Kunci tombol biar gak spam

    // Auto-Join logic
    if (!isMember && group.id !== 'global') {
        await supabase.from("group_members").insert([{ group_id: group.id, username: myName }]);
        setIsMember(true);
    }

    // 1. Kirim ke Database SAJA. Jangan update state manual disini.
    // Biarkan fitur Realtime (useEffect di atas) yang menangkap pesan ini dan menampilkannya.
    const { error } = await supabase.from("group_messages").insert([
      { group_id: group.id, sender: myName, content: newMessage }
    ]);

    if (!error) {
        setNewMessage("");
    }
    setSending(false);
  };

  // Fitur Enter to Send
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Logic Hapus/Keluar sama seperti sebelumnya (saya singkat biar fokus ke fix chat)
  const handleLeaveGroup = async () => { /* ... kode lama ... */ alert("Keluar berhasil"); onBack(); };
  const handleDeleteGroup = async () => { /* ... kode lama ... */ alert("Grup bubar"); onBack(); };

  const isAdmin = group.admin === myName && group.id !== 'global';
  const isGlobal = group.id === 'global';

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-800 text-xl">←</button>
            <div>
                <h3 className="font-bold text-gray-800">{group.name}</h3>
                <p className="text-[10px] text-gray-400">{isGlobal ? "Publik" : `Admin: @${group.admin}`}</p>
            </div>
        </div>
        {/* Tombol Hapus/Keluar disembunyikan untuk ringkas, pakai kode sebelumnya */}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e5ddd5]/30">
        {messages.map((msg) => {
          const isMe = msg.sender === myName;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              {!isMe && <span className="text-[10px] text-gray-500 mb-1 ml-1 font-bold">@{msg.sender}</span>}
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe ? "bg-purple-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none"}`}>
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

      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown} // <-- Pasang listener Enter disini
          placeholder={isMember ? "Ketik pesan..." : "Gabung dulu..."}
          className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-purple-200 focus:outline-none"
        />
        <button type="submit" disabled={!newMessage.trim() || sending} className="bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-purple-700 transition disabled:opacity-50">
          {sending ? "..." : "➤"}
        </button>
      </form>
    </div>
  );
}