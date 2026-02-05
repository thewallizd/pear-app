"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Send, MessageCircle } from "lucide-react"; // Import Ikon Lucide

export default function CommentModal({ isOpen, onClose, postId, myName }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
      const channel = supabase.channel(`comments_${postId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `post_id=eq.${postId}` },
            (payload) => {
                setComments(prev => [...prev, payload.new]);
                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        )
        .subscribe();
        
      return () => supabase.removeChannel(channel);
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    const { data } = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
    if (data) setComments(data);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);

    await supabase.from("comments").insert([{ post_id: postId, username: myName, content: newComment }]);
    setNewComment("");
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"></div>

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-slate-800 w-full max-w-md h-[80vh] md:h-[600px] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 transition-colors">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 dark:text-white">Komentar ({comments.length})</h3>
            <button onClick={onClose} className="bg-gray-100 dark:bg-slate-700 w-8 h-8 rounded-full text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 transition">
                <X size={18} />
            </button>
        </div>

        {/* List Komentar */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.length === 0 ? (
                <div className="text-center text-gray-400 dark:text-slate-500 mt-10">
                    <MessageCircle size={48} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs">Belum ada komentar. Jadilah yang pertama!</p>
                </div>
            ) : (
                comments.map((c) => (
                    <div key={c.id} className="flex gap-3 animate-in fade-in">
                        <img 
                            src={`https://api.dicebear.com/9.x/notionists/svg?seed=${c.username}`} 
                            className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 shrink-0"
                        />
                        <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-2xl rounded-tl-none text-sm">
                            <span className="font-bold text-gray-800 dark:text-white mr-2">@{c.username}</span>
                            <span className="text-gray-700 dark:text-slate-200">{c.content}</span>
                        </div>
                    </div>
                ))
            )}
            <div ref={bottomRef}></div>
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-gray-100 dark:border-slate-700 flex gap-2 bg-white dark:bg-slate-800 rounded-b-3xl">
            <input 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Tulis balasan..." 
                className="flex-1 bg-gray-100 dark:bg-slate-900 dark:text-white rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-slate-600 transition placeholder:text-gray-400 dark:placeholder:text-slate-500"
                autoFocus
            />
            <button disabled={loading || !newComment.trim()} className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50">
                <Send size={18} />
            </button>
        </form>
      </div>
    </div>
  );
}