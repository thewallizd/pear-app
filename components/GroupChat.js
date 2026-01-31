"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function GroupChat({ group, myName, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMember, setIsMember] = useState(false); // Status keanggotaan
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    checkMembership(); // Cek apakah saya member?

    // Subscribe Pesan Baru
    const channel = supabase
      .channel(`group_chat:${group.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${group.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
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
    // Cek di tabel group_members
    const { data } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", group.id)
        .eq("username", myName)
        .single();
    
    if (data) setIsMember(true);
    
    // Khusus Global Chat & Admin selalu dianggap member
    if (group.id === 'global' || group.admin === myName) setIsMember(true);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Auto-Join kalau kirim pesan tapi belum member
    if (!isMember && group.id !== 'global') {
        await handleJoinGroup();
    }

    await supabase.from("group_messages").insert([
      { group_id: group.id, sender: myName, content: newMessage }
    ]);
    setNewMessage("");
  };

  // --- AKSI GRUP ---

  const handleJoinGroup = async () => {
      await supabase.from("group_members").insert([{ group_id: group.id, username: myName }]);
      setIsMember(true);
  };

  const handleLeaveGroup = async () => {
      if(!confirm(`Yakin mau keluar dari grup "${group.name}"?`)) return;

      await supabase.from("group_members").delete()
        .eq("group_id", group.id)
        .eq("username", myName);
      
      alert("Kamu telah keluar grup.");
      onBack();
  };

  const handleDeleteGroup = async () => {
      if (!confirm(`Yakin mau membubarkan grup "${group.name}" selamanya?`)) return;

      // Hapus data (Cascade akan menghapus member & pesan juga kalau di-setting di SQL, tapi kita manual biar aman)
      await supabase.from("group_messages").delete().eq("group_id", group.id);
      await supabase.from("group_members").delete().eq("group_id", group.id);
      const { error } = await supabase.from("groups").delete().eq("id", group.id);

      if (!error) {
          alert("Grup berhasil dibubarkan.");
          onBack();
      } else {
          alert("Gagal menghapus grup.");
      }
  };

  // Logic Tombol Pojok Kanan
  const isAdmin = group.admin === myName && group.id !== 'global';
  const isGlobal = group.id === 'global';

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right">
      
      {/* HEADER GRUP */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-800 text-xl">←</button>
            <div>
                <h3 className="font-bold text-gray-800">{group.name}</h3>
                <p className="text-[10px] text-gray-400">
                    {isGlobal ? "Publik" : `Admin: @${group.admin}`} 
                    {!isGlobal && isMember && " • Member ✅"}
                </p>
            </div>
        </div>

        {/* TOMBOL AKSI (Logic Cerdas) */}
        <div className="flex gap-2">
            {!isGlobal && (
                isAdmin ? (
                    // Tombol Hapus (Khusus Admin)
                    <button 
                        onClick={handleDeleteGroup}
                        className="bg-red-100 text-red-500 p-2 rounded-full hover:bg-red-500 hover:text-white transition"
                        title="Bubarkan Grup"
                    >
                        🗑️
                    </button>
                ) : (
                    // Tombol Keluar / Gabung (Member Biasa)
                    isMember ? (
                        <button 
                            onClick={handleLeaveGroup}
                            className="bg-orange-100 text-orange-500 p-2 rounded-full hover:bg-orange-500 hover:text-white transition"
                            title="Keluar Grup"
                        >
                            🚪
                        </button>
                    ) : (
                        <button 
                            onClick={handleJoinGroup}
                            className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-green-600 hover:text-white transition"
                        >
                            Gabung
                        </button>
                    )
                )
            )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e5ddd5]/30">
        {messages.length === 0 && (
            <div className="text-center mt-10 opacity-50">
                <span className="text-4xl block mb-2">😶</span>
                <p className="text-xs">Sepi banget... Sapa temanmu!</p>
            </div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.sender === myName;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              {!isMe && <span className="text-[10px] text-gray-500 mb-1 ml-1 font-bold">@{msg.sender}</span>}
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                  isMe ? "bg-purple-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none"
                }`}
              >
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

      {/* INPUT AREA */}
      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isMember ? `Kirim pesan ke ${group.name}...` : "Gabung dulu untuk chat..."}
          className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-purple-200 focus:outline-none"
        />
        <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-purple-700 transition disabled:opacity-50"
        >
          ➤
        </button>
      </form>
    </div>
  );
}