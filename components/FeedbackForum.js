"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Send, ChevronUp, Lightbulb, Loader2, CheckCircle2, Clock, Hammer } from "lucide-react"; // Import Ikon Lucide

export default function FeedbackForum({ myName }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [newFeedback, setNewFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFeedbacks();

    // Realtime Listener
    const channel = supabase
      .channel("public:feedback")
      .on("postgres_changes", { event: "*", schema: "public", table: "feedback" }, () => {
        fetchFeedbacks();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchFeedbacks = async () => {
    const { data } = await supabase
        .from("feedback")
        .select("*")
        .order("votes", { ascending: false }); 
    if (data) setFeedbacks(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newFeedback.trim()) return;
    setIsSubmitting(true);

    const tempItem = {
        id: Math.random(),
        content: newFeedback,
        author: myName,
        votes: 0,
        status: "review",
        created_at: new Date().toISOString()
    };
    setFeedbacks(prev => [tempItem, ...prev]);
    setNewFeedback("");

    await supabase.from("feedback").insert([{ 
        content: tempItem.content, 
        author: myName,
        votes: 0,
        status: "review"
    }]);
    
    setIsSubmitting(false);
  };

  const handleVote = async (id) => {
    setFeedbacks(prev => prev.map(item => 
        item.id === id ? { ...item, votes: item.votes + 1 } : item
    ));
    await supabase.rpc("vote_feedback", { row_id: id });
  };

  // Badge Status dengan Ikon Lucide
  const getStatusBadge = (status) => {
      switch(status) {
          case 'progress': return <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1 border border-yellow-200 dark:border-yellow-800"><Hammer size={10} /> Sedang Dibuat</span>;
          case 'done': return <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1 border border-blue-200 dark:border-blue-800"><CheckCircle2 size={10} /> Selesai</span>;
          default: return <span className="bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1 border border-gray-200 dark:border-slate-600"><Clock size={10} /> Ditinjau</span>;
      }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 pb-20">
      {/* Header Kotak Saran */}
      <div className="bg-gradient-to-r from-orange-400 to-pink-500 p-6 rounded-3xl text-white shadow-lg shadow-orange-200 dark:shadow-none relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-xl font-black mb-1 flex items-center gap-2">
                <Lightbulb size={24} className="text-yellow-200" /> Kotak Ide Warga
            </h2>
            <p className="text-sm opacity-90 mb-4">Punya ide fitur baru? Atau nemu bug? Tulis sini, yang paling banyak di-vote bakal dikabulkan!</p>
            
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input 
                    value={newFeedback}
                    onChange={(e) => setNewFeedback(e.target.value)}
                    className="flex-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-3 text-sm text-white placeholder-white/70 focus:outline-none focus:bg-white/30 transition"
                    placeholder="Contoh: Tambahin fitur Dark Mode dong..."
                    disabled={isSubmitting}
                />
                <button 
                    type="submit" 
                    disabled={!newFeedback.trim() || isSubmitting}
                    className="bg-white text-orange-500 w-12 rounded-xl font-bold flex items-center justify-center hover:bg-orange-50 transition shadow-sm disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
            </form>
        </div>
      </div>

      {/* Daftar Ide */}
      <div className="space-y-3">
        {feedbacks.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-slate-500 py-8 flex flex-col items-center gap-2">
                <Lightbulb size={32} className="opacity-20" />
                <span className="text-xs">Belum ada ide. Jadilah yang pertama!</span>
            </div>
        ) : (
            feedbacks.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 flex gap-4 hover:shadow-md dark:hover:shadow-none transition group">
                    {/* Tombol Vote */}
                    <div className="flex flex-col items-center justify-start gap-1 min-w-[40px]">
                        <button 
                            onClick={() => handleVote(item.id)}
                            className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-700 hover:bg-orange-100 dark:hover:bg-orange-900/50 hover:text-orange-500 dark:hover:text-orange-400 flex items-center justify-center transition text-gray-400 dark:text-slate-400"
                        >
                            <ChevronUp size={20} />
                        </button>
                        <span className="font-bold text-gray-700 dark:text-slate-200 text-sm">{item.votes}</span>
                    </div>

                    {/* Konten */}
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${item.author}`} className="w-5 h-5 rounded-full bg-gray-100 dark:bg-slate-700"/>
                                <span className="text-xs font-bold text-gray-600 dark:text-slate-400">@{item.author}</span>
                            </div>
                            {getStatusBadge(item.status)}
                        </div>
                        <p className="text-gray-800 dark:text-slate-200 text-sm leading-relaxed">{item.content}</p>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}