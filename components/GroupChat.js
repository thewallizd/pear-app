"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, Send, Trash2, LogOut, MoreVertical, Loader2 } from "lucide-react"; // Import Ikon

export default function GroupChat({ group, myName, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false); // Menu dropdown untuk Admin
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
    // Kalau Global, otomatis member
    if (group.id === 'global') {
        setIsMember(true);
        return;
    }
    const { data } = await supabase.from("group_members").select("*").eq("group_id", group.id).eq("username", myName).single();
    if (data || group.admin === myName) setIsMember(true);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);

    // Auto-Join logic
    if (!isMember && group.id !== 'global') {
        await supabase.from("group_members").insert([{ group_id: group.id, username: myName }]);
        setIsMember(true);
    }

    const { error } = await supabase.from("group_messages").insert([
      { group_id: group.id, sender: myName, content: newMessage }
    ]);

    if (!error) {
        setNewMessage("");
    }
    setSending(false);
  };

  // LOGIC KELUAR GRUP
  const handleLeaveGroup = async () => {
      if (confirm("Yakin mau keluar dari grup ini?")) {
          await supabase.from("group_members").delete().eq("group_id", group.id).eq("username", myName);
          onBack();
      }
  };

  // LOGIC HAPUS GRUP (ADMIN ONLY)
  const handleDeleteGroup = async () => {
      if (confirm("Yakin bubarkan grup? Semua chat akan hilang.")) {
          await supabase.from("groups").delete().eq("id", group.id);
          onBack();
      }
  };

  const isAdmin = group.admin === myName && group.id !== 'global';
  const isGlobal = group.id === 'global';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 animate-in slide-in-from-right relative transition-colors">
      
      {/* HEADER */}
      <div className="p-3 md:p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 z-10 sticky top-0">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="bg-gray-100 dark:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition">
                <ArrowLeft size={18} />
            </button>
            <div>
                <h3 className="font-bold text-gray-800 dark:text-white text-sm md:text-base">{group.name}</h3>
                <p className="text-[10px] text-gray-400 dark:text-slate-400">{isGlobal ? "Ruang Publik" : `Admin: @${group.admin}`}</p>
            </div>
        </div>

        {/* MENU OPSI (Hanya untuk grup biasa) */}
        {!isGlobal && (
            <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition">
                    <MoreVertical size={20} />
                </button>
                
                {/* Dropdown Menu */}
                {showMenu && (
                    <div className="absolute right-0 top-10 bg-white dark:bg-slate-900 shadow-xl border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden min-w-[150px] z-50 animate-in fade-in slide-in-from-top-2">
                        {isAdmin ? (
                            <button onClick={handleDeleteGroup} className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                <Trash2 size={16} /> Bubarkan
                            </button>
                        ) : (
                            <button onClick={handleLeaveGroup} className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                <LogOut size={16} /> Keluar
                            </button>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f2f5] dark:bg-slate-900/50">
        {messages.map((msg) => {
          const isMe = msg.sender === myName;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              {!isMe && <span className="text-[10px] text-gray-500 dark:text-slate-400 mb-1 ml-1 font-bold">@{msg.sender}</span>}
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm relative ${isMe ? "bg-purple-600 text-white rounded-br-none" : "bg-white dark:bg-slate-700 dark:text-white text-gray-800 rounded-bl-none"}`}>
                {msg.content}
              </div>
              <span className="text-[9px] text-gray-400 dark:text-slate-500 mt-1 mx-1">
                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <form onSubmit={sendMessage} className="p-3 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isMember || isGlobal ? "Ketik pesan..." : "Gabung & kirim..."}
          className="flex-1 bg-gray-100 dark:bg-slate-700 dark:text-white border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 focus:outline-none transition placeholder:text-gray-400 dark:placeholder:text-slate-500"
        />
        <button type="submit" disabled={!newMessage.trim() || sending} className="bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-purple-700 transition disabled:opacity-50">
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}