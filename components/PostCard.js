"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PostCard({ id, content, author, votes, created_at, myName, onUserClick }) {
  const [likeCount, setLikeCount] = useState(votes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  // Cek apakah user sudah like (disimpan di localStorage biar hemat DB)
  useEffect(() => {
    const likedPosts = JSON.parse(localStorage.getItem("liked_posts") || "[]");
    if (likedPosts.includes(id)) setHasLiked(true);
  }, [id]);

  const handleVote = async () => {
    if (hasLiked) {
        // Unlike (Logic Optimistic)
        setLikeCount(prev => prev - 1);
        setHasLiked(false);
        const likedPosts = JSON.parse(localStorage.getItem("liked_posts") || "[]");
        localStorage.setItem("liked_posts", JSON.stringify(likedPosts.filter(postId => postId !== id)));
        await supabase.rpc('decrement_vote', { row_id: id });
    } else {
        // Like (Logic Optimistic)
        setLikeCount(prev => prev + 1);
        setHasLiked(true);
        const likedPosts = JSON.parse(localStorage.getItem("liked_posts") || "[]");
        likedPosts.push(id);
        localStorage.setItem("liked_posts", JSON.stringify(likedPosts));
        await supabase.rpc('increment_vote', { row_id: id });
    }
  };

  const toggleComments = async () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      const { data } = await supabase.from("comments").select("*").eq("post_id", id).order("created_at", { ascending: true });
      if (data) setComments(data);
      setLoadingComments(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // --- OPTIMISTIC UPDATE (Kunci agar komentar langsung muncul) ---
    const tempComment = {
        id: Math.random(), // ID sementara
        post_id: id,
        author: myName,
        content: newComment,
        created_at: new Date().toISOString()
    };

    // 1. Paksa update state layar duluan
    setComments(prev => [...prev, tempComment]);
    setNewComment(""); // Reset input

    // 2. Kirim ke Database di belakang layar
    const { error } = await supabase.from("comments").insert([{ post_id: id, author: myName, content: tempComment.content }]);
    
    if (error) {
        console.error("Gagal komen:", error);
        // Opsional: Hapus komentar kalau gagal (jarang terjadi)
    }
  };

  // Format Waktu (Contoh: "5 menit yang lalu")
  const timeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return "Baru saja";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
  };

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition mb-4">
      {/* Header Post */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onUserClick(author)}>
          <img 
            src={`https://api.dicebear.com/9.x/notionists/svg?seed=${author}&backgroundColor=c0aede,b6e3f4&radius=50`} 
            alt="avatar" 
            className="w-10 h-10 rounded-full border border-gray-200 bg-gray-50" 
          />
          <div>
            <h3 className="font-bold text-gray-800 text-sm hover:underline">@{author}</h3>
            <p className="text-[10px] text-gray-400">{timeAgo(created_at)}</p>
          </div>
        </div>
      </div>

      {/* Konten Post */}
      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-4 pl-1">{content}</p>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
        <button 
            onClick={handleVote}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition ${hasLiked ? "bg-red-50 text-red-500" : "text-gray-400 hover:bg-gray-50"}`}
        >
            <span>{hasLiked ? "❤️" : "🤍"}</span> {likeCount}
        </button>

        <button 
            onClick={toggleComments}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-gray-400 hover:bg-gray-50 transition"
        >
            💬 {showComments ? "Tutup Komentar" : "Komentar"}
        </button>

        <button className="text-gray-400 hover:text-gray-600 px-2">
            🔗
        </button>
      </div>

      {/* Bagian Komentar */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2">
            
            {/* List Komentar */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                {loadingComments ? (
                    <p className="text-center text-xs text-gray-400">Memuat komentar...</p>
                ) : comments.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-2">Belum ada yang komen. Jadilah yang pertama!</p>
                ) : (
                    comments.map((c) => (
                        <div key={c.id} className="flex gap-2 items-start bg-gray-50 p-2 rounded-xl">
                             <img 
                                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${c.author}`} 
                                className="w-6 h-6 rounded-full border border-white"
                             />
                             <div className="flex-1">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-bold text-gray-700">@{c.author}</span>
                                    <span className="text-[9px] text-gray-400">{timeAgo(c.created_at)}</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-0.5 break-words">{c.content}</p>
                             </div>
                        </div>
                    ))
                )}
            </div>

            {/* Form Input Komentar */}
            <form onSubmit={handleSendComment} className="flex gap-2 items-center">
                <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Tulis balasan..." 
                    className="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-green-300 focus:bg-white transition"
                />
                <button type="submit" disabled={!newComment.trim()} className="bg-green-500 text-white p-2 rounded-xl hover:bg-green-600 disabled:opacity-50 transition">
                    ➤
                </button>
            </form>
        </div>
      )}
    </div>
  );
}