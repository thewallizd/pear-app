"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateLeaderboard();

    // Realtime Listener: Kalau ada yang nge-like, ranking bisa berubah live!
    const channel = supabase
      .channel("public:posts_leaderboard")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "posts" }, () => {
        calculateLeaderboard();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const calculateLeaderboard = async () => {
    // 1. Ambil semua data Author dan Votes dari postingan
    const { data } = await supabase
      .from("posts")
      .select("author, votes");

    if (data) {
      // 2. LOGIC: Hitung Total Vote per User (Aggregating)
      // Kita pakai teknik "Reduce" di JavaScript
      const scores = data.reduce((acc, curr) => {
        const currentScore = acc[curr.author] || 0;
        return {
            ...acc,
            [curr.author]: currentScore + (curr.votes || 0) // Tambahkan vote postingan ini ke total user
        };
      }, {});

      // 3. Ubah ke Array dan Urutkan dari Terbesar ke Terkecil
      const sortedLeaders = Object.keys(scores)
        .map(author => ({
            author,
            score: scores[author]
        }))
        .sort((a, b) => b.score - a.score) // Sort Descending
        .slice(0, 5); // Ambil Top 5 Saja

      setLeaders(sortedLeaders);
    }
    setLoading(false);
  };

  // Helper: Kasih Medali untuk Juara 1, 2, 3
  const getRankBadge = (index) => {
      switch(index) {
          case 0: return <span className="text-xl">🥇</span>;
          case 1: return <span className="text-xl">🥈</span>;
          case 2: return <span className="text-xl">🥉</span>;
          default: return <span className="text-gray-400 font-bold text-sm">#{index + 1}</span>;
      }
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm animate-in fade-in h-fit">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>🏆</span> Top Warga
        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Most Liked</span>
      </h3>

      <div className="space-y-4">
        {loading ? (
            <div className="text-center text-xs text-gray-400 py-4">Menghitung skor...</div>
        ) : leaders.length === 0 ? (
            <div className="text-center text-xs text-gray-400 py-4">Belum ada data.</div>
        ) : (
            leaders.map((user, index) => (
                <div key={user.author} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        {/* Kolom Ranking */}
                        <div className="w-6 text-center">{getRankBadge(index)}</div>
                        
                        {/* Avatar & Nama */}
                        <div className="flex items-center gap-2">
                            <img 
                                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user.author}`} 
                                className={`w-8 h-8 rounded-full border-2 ${index === 0 ? "border-yellow-400" : "border-gray-100"}`}
                            />
                            <span className={`text-sm ${index === 0 ? "font-black text-black" : "font-medium text-gray-600"}`}>
                                @{user.author}
                            </span>
                        </div>
                    </div>
                    
                    {/* Skor Total */}
                    <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                        {user.score} ❤️
                    </div>
                </div>
            ))
        )}
      </div>

      {/* Footer Motivasi */}
      <div className="mt-4 pt-3 border-t border-gray-50 text-center">
        <p className="text-[10px] text-gray-400">
            Rajin posting konten bagus biar naik rank! 🚀
        </p>
      </div>
    </div>
  );
}