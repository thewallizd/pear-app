"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Leaderboard({ myName, onUserClick }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      
      // 1. Ambil semua postingan (hanya kolom author & votes biar ringan)
      const { data } = await supabase.from("posts").select("author, votes");

      if (data) {
        // 2. Hitung Total Aura per User
        const scores = {};
        
        data.forEach((post) => {
          const author = post.author || "Anonim";
          const votes = post.votes || 0;
          
          if (!scores[author]) {
            scores[author] = 0;
          }
          scores[author] += votes;
        });

        // 3. Ubah ke Array & Urutkan dari Terbesar
        const sortedLeaders = Object.entries(scores)
          .map(([name, score]) => ({ name, score }))
          .sort((a, b) => b.score - a.score) // Sort Descending
          .slice(0, 10); // Ambil Top 10 aja

        setLeaders(sortedLeaders);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  // Helper untuk Warna Medali
  const getRankStyle = (index) => {
    if (index === 0) return "bg-yellow-100 border-yellow-300 text-yellow-700 shadow-yellow-100"; // Emas
    if (index === 1) return "bg-gray-100 border-gray-300 text-gray-700 shadow-gray-100"; // Perak
    if (index === 2) return "bg-orange-100 border-orange-300 text-orange-800 shadow-orange-100"; // Perunggu
    return "bg-white border-gray-100 text-gray-600"; // Biasa
  };

  const getRankIcon = (index) => {
    if (index === 0) return "👑";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-white text-center">
        <h2 className="text-2xl font-black uppercase tracking-wider mb-1">🏆 Hall of Fame</h2>
        <p className="text-yellow-100 text-xs font-bold">Para Sepuh dengan Aura Tertinggi</p>
      </div>

      {/* LIST PEMENANG */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Sedang menghitung aura...</div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Belum ada data.</div>
        ) : (
          leaders.map((user, index) => (
            <div 
              key={user.name}
              className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all hover:scale-[1.02] ${getRankStyle(index)}`}
            >
              <div className="flex items-center gap-4">
                {/* RANK NUMBER/ICON */}
                <div className="w-8 text-center font-black text-xl">
                  {getRankIcon(index)}
                </div>
                
                {/* USER INFO */}
                <div 
                  onClick={() => onUserClick && onUserClick(user.name)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <img 
                    src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user.name}&radius=50`} 
                    className="w-10 h-10 rounded-full bg-white border border-black/10 shadow-sm group-hover:scale-110 transition"
                  />
                  <div>
                    <h3 className="font-bold text-sm group-hover:underline">
                      @{user.name}
                      {user.name === myName && <span className="ml-2 text-[10px] bg-black/10 px-1.5 rounded text-black/60">(Anda)</span>}
                    </h3>
                  </div>
                </div>
              </div>

              {/* SCORE AURA */}
              <div className="text-right">
                <span className="block font-black text-lg">{user.score}</span>
                <span className="text-[9px] uppercase font-bold opacity-60">Aura</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-gray-50 p-3 text-center text-[10px] text-gray-400 font-medium">
        *Diupdate secara realtime berdasarkan vote postingan
      </div>
    </div>
  );
}