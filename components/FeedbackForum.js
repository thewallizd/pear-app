"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function FeedbackForum({ myName }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [newFeedback, setNewFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFeedbacks();

    // Realtime Listener: Feedback baru atau Update Vote langsung terlihat
    const channel = supabase
      .channel("public:feedback")
      .on("postgres_changes", { event: "*", schema: "public", table: "feedback" }, () => {
        fetchFeedbacks();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchFeedbacks = async () => {
    // Urutkan berdasarkan VOTE terbanyak (Popularitas)
    const { data } = await supabase
        .from("feedback")
        .select("*")
        .order("votes", { ascending: false }); // Paling banyak vote di atas
    if (data) setFeedbacks(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newFeedback.trim()) return;
    setIsSubmitting(true);

    // Optimistic UI: Tampilkan dulu biar user seneng (Responsif)
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

    // Kirim ke Database
    await supabase.from("feedback").insert([{ 
        content: tempItem.content, 
        author: myName,
        votes: 0,
        status: "review"
    }]);
    
    setIsSubmitting(false);
  };

  const handleVote = async (id) => {
    // 1. Optimistic Update (Tambah angka di layar dulu)
    setFeedbacks(prev => prev.map(item => 
        item.id === id ? { ...item, votes: item.votes + 1 } : item
    ));

    // 2. Panggil fungsi di database
    await supabase.rpc("vote_feedback", { row_id: id });
  };

  // Helper untuk warna badge status
  const getStatusBadge = (status) => {
      switch(status) {
          case 'progress': return <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full font-bold">🚧 Sedang Dibuat</span>;
          case 'done': return <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">✨ Selesai</span>;
          default: return <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-bold">👀 Ditinjau</span>;
      }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4">
      {/* Header Kotak Saran */}
      <div className="bg-gradient-to-r from-orange-400 to-pink-500 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-xl font-black mb-1">💡 Kotak Ide Warga</h2>
            <p className="text-sm opacity-90 mb-4">Punya ide fitur baru? Atau nemu bug? Tulis sini, yang paling banyak di-vote bakal dikabulkan!</p>
            
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input 
                    value={newFeedback}
                    onChange={(e) => setNewFeedback(e.target.value)}
                    className="flex-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2 text-sm text-white placeholder-white/70 focus:outline-none focus:bg-white/30 transition"
                    placeholder="Contoh: Tambahin fitur Dark Mode dong..."
                    disabled={isSubmitting}
                />
                <button 
                    type="submit" 
                    disabled={!newFeedback.trim() || isSubmitting}
                    className="bg-white text-orange-500 px-4 py-2 rounded-xl font-bold text-sm hover:bg-orange-50 transition shadow-sm"
                >
                    {isSubmitting ? "..." : "Kirim"}
                </button>
            </form>
        </div>
        {/* Dekorasi Background */}
        <div className="absolute -bottom-4 -right-4 text-9xl opacity-10 rotate-12">🗳️</div>
      </div>

      {/* Daftar Ide */}
      <div className="space-y-3">
        {feedbacks.length === 0 ? (
            <div className="text-center text-gray-400 py-8">Belum ada ide. Jadilah yang pertama!</div>
        ) : (
            feedbacks.map((item, idx) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4 hover:shadow-md transition group">
                    {/* Tombol Vote */}
                    <div className="flex flex-col items-center justify-center gap-1 min-w-[40px]">
                        <button 
                            onClick={() => handleVote(item.id)}
                            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-orange-100 hover:text-orange-500 flex items-center justify-center transition text-gray-400"
                        >
                            ▲
                        </button>
                        <span className="font-bold text-gray-700 text-sm">{item.votes}</span>
                    </div>

                    {/* Konten */}
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                                <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${item.author}`} className="w-5 h-5 rounded-full bg-gray-100"/>
                                <span className="text-xs font-bold text-gray-600">@{item.author}</span>
                            </div>
                            {getStatusBadge(item.status)}
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed">{item.content}</p>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}