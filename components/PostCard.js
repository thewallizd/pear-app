"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import ReportModal from "./ReportModal";
import CommentModal from "./CommentModal";

// FUNGSI UTILS: MENGHITUNG WAKTU RELATIF ⏱️
const timeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return "Baru saja";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} menit lalu`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
  return past.toLocaleDateString(); // Kalau sudah lama banget, tampilkan tanggal biasa
};

export default function PostCard({
  id,
  content,
  author,
  likes,
  created_at,
  myName,
  onUserClick,
}) {
  const [likeCount, setLikeCount] = useState(likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    checkStatus();
  }, [id, myName]);

  const checkStatus = async () => {
    const { data: likeData } = await supabase
      .from("likes")
      .select("*")
      .eq("post_id", id)
      .eq("username", myName)
      .single();
    if (likeData) setIsLiked(true);

    const { data: saveData } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("post_id", id)
      .eq("username", myName)
      .single();
    if (saveData) setIsSaved(true);
  };

  const handleLike = async () => {
    if (isLiked) {
      setLikeCount((prev) => prev - 1);
      setIsLiked(false);
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", id)
        .eq("username", myName);
      await supabase
        .from("posts")
        .update({ likes: likeCount - 1 })
        .eq("id", id);
    } else {
      setLikeCount((prev) => prev + 1);
      setIsLiked(true);
      await supabase.from("likes").insert([{ post_id: id, username: myName }]);
      await supabase
        .from("posts")
        .update({ likes: likeCount + 1 })
        .eq("id", id);
      if (author !== myName)
        await supabase
          .from("notifications")
          .insert([
            { recipient: author, content: `@${myName} menyukai postinganmu.` },
          ]);
    }
  };

  const handleBookmark = async () => {
    if (isSaved) {
      setIsSaved(false);
      await supabase
        .from("bookmarks")
        .delete()
        .eq("post_id", id)
        .eq("username", myName);
    } else {
      setIsSaved(true);
      await supabase
        .from("bookmarks")
        .insert([{ post_id: id, username: myName }]);
    }
  };

  return (
    <>
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition mb-3 relative group">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div onClick={() => onUserClick(author)} className="cursor-pointer">
            <img
              src={`https://api.dicebear.com/9.x/notionists/svg?seed=${author}`}
              alt="avatar"
              className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100"
            />
          </div>
          <div className="flex-1">
            <h3
              onClick={() => onUserClick(author)}
              className="font-bold text-gray-800 text-sm cursor-pointer hover:underline"
            >
              @{author}
            </h3>

            {/* GUNAKAN WAKTU RELATIF DISINI 👇 */}
            <p className="text-[10px] text-gray-400 flex items-center gap-1">
              {timeAgo(created_at)} • 🌍
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleBookmark}
              className="text-gray-300 hover:text-orange-500 transition p-2 rounded-full hover:bg-orange-50"
            >
              {isSaved ? "🔖" : "🏷️"}
            </button>
            {author !== myName && (
              <button
                onClick={() => setShowReport(true)}
                className="text-gray-300 hover:text-red-500 transition p-2 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100"
              >
                ⚠️
              </button>
            )}
          </div>
        </div>

        <p className="text-gray-700 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
          {content}
        </p>

        <div className="flex items-center gap-6 border-t border-gray-50 pt-3">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 text-sm font-bold transition ${isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
          >
            <span>{isLiked ? "❤️" : "🤍"}</span>
            <span>{likeCount}</span>
          </button>
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-500 transition"
          >
            <span>💬</span>
            <span className="text-xs">Komentar</span>
          </button>
        </div>
      </div>

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        postId={id}
        myName={myName}
      />
      <CommentModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        postId={id}
        myName={myName}
      />
    </>
  );
}
