"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Send, Image as ImageIcon, Loader2 } from "lucide-react"; // Import Ikon

export default function CreatePost({ myName, onPostSuccess }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) return;
    setLoading(true);

    const { error } = await supabase.from("posts").insert([
      { content: content, author: myName, likes: 0 }
    ]);

    if (!error) {
      setContent("");
      onPostSuccess(); 
    }
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 mb-6 flex gap-4 transition-colors">
      <img 
        src={`https://api.dicebear.com/9.x/notionists/svg?seed=${myName}`} 
        className="w-12 h-12 rounded-full bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 hidden md:block"
      />
      
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Apa kabar, ${myName}?`}
          className="w-full bg-gray-50 dark:bg-slate-900 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-green-100 dark:focus:ring-slate-600 outline-none resize-none text-gray-800 dark:text-white placeholder:text-gray-400 transition"
          rows={2}
        />
        
        <div className="flex justify-between items-center mt-3">
            {/* Tombol Upload (Placeholder) */}
            <button className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition p-2 rounded-full hover:bg-gray-50 dark:hover:bg-slate-700">
                <ImageIcon size={20} />
            </button>

            {/* Tombol Kirim */}
            <button 
                onClick={handlePost} 
                disabled={loading || !content.trim()}
                className="bg-gray-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-full font-bold hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
            >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                <span>Posting</span>
            </button>
        </div>
      </div>
    </div>
  );
}