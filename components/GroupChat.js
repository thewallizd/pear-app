"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function GroupChat({ group, myName, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Cek apakah saya adalah Admin grup ini?
  const isAdmin = group.admin === myName;

  useEffect(() => {
    // 1. Load Chat Grup
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("group_messages")
        .select("*")
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // 2. Realtime Listener
    const channel = supabase
      .channel(`group:${group.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${group.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        },
      )
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
    const tempMsg = {
      id: Math.random(),
      group_id: group.id,
      sender: myName,
      content: newMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");

    await supabase.from("group_messages").insert([
      {
        group_id: group.id,
        sender: myName,
        content: tempMsg.content,
      },
    ]);
  };

  // --- FITUR ADMIN: HAPUS GRUP ---
  const deleteGroup = async () => {
    if (confirm("Yakin ingin membubarkan grup ini selamanya?")) {
      // Update status jadi tidak aktif (Soft Delete)
      await supabase
        .from("groups")
        .update({ is_active: false })
        .eq("id", group.id);
      onBack(); // Kembali ke dashboard
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[600px] overflow-hidden animate-in zoom-in-95 duration-300">
      {/* Header Grup */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-blue-600 font-bold p-2 hover:bg-gray-50 rounded-full transition"
          >
            ⬅
          </button>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            #
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">{group.name}</h3>
            <p className="text-[10px] text-gray-400">
              Grup Diskusi • Admin: @{group.admin}
            </p>
          </div>
        </div>

        {/* Tombol Hapus (Hanya muncul jika saya Admin) */}
        {isAdmin && (
          <button
            onClick={deleteGroup}
            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition"
            title="Bubarkan Grup"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Area Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
        {messages.map((msg, idx) => {
          const isMe = msg.sender === myName;
          return (
            <div
              key={idx}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-in slide-in-from-bottom-1`}
            >
              {!isMe && (
                <span className="text-[10px] text-gray-400 ml-1 mb-1">
                  @{msg.sender}
                </span>
              )}
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? "bg-blue-500 text-white rounded-tr-none" : "bg-white text-gray-700 rounded-tl-none border border-gray-200"}`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Chat */}
      <form
        onSubmit={sendMessage}
        className="p-3 bg-white border-t border-gray-100 flex gap-2"
      >
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
          placeholder={`Kirim pesan ke #${group.name}...`}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white p-3 rounded-xl transition shadow-lg shadow-blue-200"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
