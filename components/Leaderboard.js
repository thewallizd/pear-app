"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Trophy, Medal, Heart, TrendingUp } from "lucide-react"; // Import Ikon Lucide

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateLeaderboard();

    // Realtime Listener
    const channel = supabase
      .channel("public:posts_leaderboard")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "posts" }, () => {
        calculateLeaderboard();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const calculateLeaderboard = async () => {
    const { data } = await supabase.from("posts").select("author, votes");

    if (data) {
      const scores = data.reduce((acc, curr) => {
        const currentScore = acc[curr.author] || 0;
        return {
            ...acc,
            [curr.author]: currentScore + (curr.votes || 0)
        };
      }, {});

      const sortedLeaders = Object.keys(scores)
        .map(author => ({
            author,
            score: scores[author]
        }))
        .sort((a, b) => b.score - a.score) 
        .slice(0, 5); 

      setLeaders(sortedLeaders);
    }
    setLoading(false);
  };

  // Helper Badge Juara dengan Ikon Lucide
  const getRankBadge = (index) => {
      switch(index) {
          case 0: return <Medal size={20} className="text-yellow-500 fill-yellow-500" />;
          case 1: return <Medal size={20} className="text-gray-400 fill-gray-400" />;
          case 2: return <Medal size={20} className="text-orange-400 fill-orange-400" />;
          default: return <span className="text-gray-400 dark:text-slate-500 font-bold text-sm">#{index + 1}</span>;
      }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm animate-in fade-in h-fit transition-colors">
      <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Trophy size={20} className="text-yellow-500" /> 
        <span>Top Warga</span>
        <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-200 dark:border-yellow-700">Most Liked</span>
      </h3>

      <div className="space-y-4">
        {loading ? (
            <div className="text-center text-xs text-gray-400 dark:text-slate-500 py-4 flex flex-col items-center gap-2">
                <TrendingUp size={24} className="animate-bounce opacity-50" />
                <span>Menghitung skor...</span>
            </div>
        ) : leaders.length === 0 ? (
            <div className="text-center text-xs text-gray-400 dark:text-slate-500 py-4">Belum ada data.</div>
        ) : (
            leaders.map((user, index) => (
                <div key={user.author} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        {/* Kolom Ranking */}
                        <div className="w-6 text-center flex justify-center">{getRankBadge(index)}</div>
                        
                        {/* Avatar & Nama */}
                        <div className="flex items-center gap-2">
                            <img 
                                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user.author}`} 
                                className={`w-8 h-8 rounded-full border-2 ${index === 0 ? "border-yellow-400" : "border-gray-100 dark:border-slate-600"} bg-gray-50 dark:bg-slate-700`}
                            />
                            <span className={`text-sm ${index === 0 ? "font-black text-black dark:text-white" : "font-medium text-gray-600 dark:text-slate-300"}`}>
                                @{user.author}
                            </span>
                        </div>
                    </div>
                    
                    {/* Skor Total */}
                    <div className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 px-2 py-1 rounded-lg flex items-center gap-1">
                        {user.score} <Heart size={10} fill="currentColor" />
                    </div>
                </div>
            ))
        )}
      </div>

      {/* Footer Motivasi */}
      <div className="mt-4 pt-3 border-t border-gray-50 dark:border-slate-700 text-center">
        <p className="text-[10px] text-gray-400 dark:text-slate-500 flex items-center justify-center gap-1">
            Rajin posting konten bagus! <TrendingUp size={12} />
        </p>
      </div>
    </div>
  );
}