"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import ReportModal from "./ReportModal";
import CommentModal from "./CommentModal";

// 1. IMPORT LIBRARY BARU
import { formatDistanceToNow } from "date-fns";
import { id as indonesia } from "date-fns/locale"; // Bahasa Indonesia
import { Heart, MessageCircle, Bookmark, AlertTriangle } from "lucide-react"; // Ikon Keren

export default function PostCard({ id, content, author, likes, created_at, myName, onUserClick }) {
  const [likeCount, setLikeCount] = useState(likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const [showReport, setShowReport] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    checkStatus();
  }, [id, myName]);

  const checkStatus = async () => {
    const { data: likeData } = await supabase.from("likes").select("*").eq("post_id", id).eq("username", myName).single();
    if (likeData) setIsLiked(true);

    const { data: saveData } = await supabase.from("bookmarks").select("*").eq("post_id", id).eq("username", myName).single();
    if (saveData) setIsSaved(true);
  };

  const handleLike = async () => {
    if (isLiked) {
      setLikeCount(prev => prev - 1); setIsLiked(false);
      await supabase.from("likes").delete().eq("post_id", id).eq("username", myName);
      await supabase.from("posts").update({ likes: likeCount - 1 }).eq("id", id);
    } else {
      setLikeCount(prev => prev + 1); setIsLiked(true);
      await supabase.from("likes").insert([{ post_id: id, username: myName }]);
      await supabase.from("posts").update({ likes: likeCount + 1 }).eq("id", id);
      if (author !== myName) await supabase.from("notifications").insert([{ recipient: author, content: `@${myName} menyukai postinganmu.` }]);
    }
  };

  const handleBookmark = async () => {
      if (isSaved) {
          setIsSaved(false);
          await supabase.from("bookmarks").delete().eq("post_id", id).eq("username", myName);
      } else {
          setIsSaved(true);
          await supabase.from("bookmarks").insert([{ post_id: id, username: myName }]);
      }
  };

  // FORMAT WAKTU OTOMATIS (date-fns)
  const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: indonesia });

  return (
    <>
    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition mb-3 relative group">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div onClick={() => onUserClick(author)} className="cursor-pointer">
             <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${author}`} alt="avatar" className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100" />
        </div>
        <div className="flex-1">
          <h3 onClick={() => onUserClick(author)} className="font-bold text-gray-800 dark:text-white text-sm cursor-pointer hover:underline">@{author}</h3>
          
          {/* WAKTU RELATIF RAPI */}
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            {timeAgo} • 🌍
          </p>
        </div>
        
        <div className="flex items-center gap-1">
            <button onClick={handleBookmark} className={`transition p-2 rounded-full hover:bg-orange-50 dark:hover:bg-slate-700 ${isSaved ? "text-orange-500 fill-orange-500" : "text-gray-300"}`}>
                {/* IKON BOOKMARK */}
                <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
            </button>
            {author !== myName && (
                <button onClick={() => setShowReport(true)} className="text-gray-300 hover:text-red-500 transition p-2 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100">
                    <AlertTriangle size={18} />
                </button>
            )}
        </div>
      </div>

      <p className="text-gray-700 dark:text-slate-200 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{content}</p>

      {/* Footer Actions */}
      <div className="flex items-center gap-6 border-t border-gray-50 dark:border-slate-700 pt-3">
        <button onClick={handleLike} className={`flex items-center gap-2 text-sm font-bold transition ${isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}>
          {/* IKON HEART */}
          <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
          <span>{likeCount}</span>
        </button>
        
        <button onClick={() => setShowComments(true)} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-500 transition">
          {/* IKON COMMENT */}
          <MessageCircle size={20} />
          <span className="text-xs">Komentar</span>
        </button>
      </div>
    </div>

    <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} postId={id} myName={myName} />
    <CommentModal isOpen={showComments} onClose={() => setShowComments(false)} postId={id} myName={myName} />
    </>
  );
}