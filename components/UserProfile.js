"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function UserProfile({ targetUsername, myName, onBack, onChat }) {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ posts: 0, likes: 0 });

  useEffect(() => {
    const fetchData = async () => {
        // 1. Ambil Data User (termasuk Note)
        const { data } = await supabase.from("users").select("note, created_at").eq("username", targetUsername).single();
        if (data) setUserData(data);

        // 2. Hitung Statistik
        const { count: postCount } = await supabase.from("posts").select("*", { count: 'exact' }).eq("author", targetUsername);
        const { data: posts } = await supabase.from("posts").select("votes").eq("author", targetUsername);
        const totalVotes = posts ? posts.reduce((acc, curr) => acc + (curr.votes || 0), 0) : 0;
        
        setStats({ posts: postCount || 0, likes: totalVotes });
        setLoading(false);
    };
    fetchData();
  }, [targetUsername]);

  return (
    <div className="animate-in slide-in-from-right duration-300">
      <button onClick={onBack} className="mb-4 text-sm font-bold text-gray-500 hover:text-green-600 flex items-center gap-1">
        ⬅ Kembali
      </button>

      {loading ? (
        <div className="p-10 text-center text-gray-400">Loading profil...</div>
      ) : (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-purple-400 to-pink-500 opacity-20"></div>
             
             <div className="relative z-10 mt-4">
                <img 
                    src={`https://api.dicebear.com/9.x/notionists/svg?seed=${targetUsername}&backgroundColor=c0aede,b6e3f4&radius=50`} 
                    className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white inline-block" 
                />
                
                <h2 className="text-2xl font-black text-gray-800 mt-3">@{targetUsername}</h2>
                
                {/* --- MENAMPILKAN NOTES --- */}
                {userData?.note && (
                    <div className="mt-4 inline-block bg-gray-50 text-gray-600 text-sm px-4 py-2 rounded-xl border border-gray-200 italic">
                        "{userData.note}"
                    </div>
                )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 justify-center mt-6">
                <button onClick={() => onChat(targetUsername)} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition">
                    Chat 💬
                </button>
                <button className="bg-gray-100 text-gray-600 px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition">
                    Add Friend ➕
                </button>
            </div>

            {/* STATS */}
            <div className="flex justify-center gap-8 mt-8 border-t border-gray-100 pt-6">
                <div className="text-center">
                    <div className="text-xl font-black text-gray-800">{stats.posts}</div>
                    <div className="text-xs text-gray-400 font-bold uppercase">Post</div>
                </div>
                <div className="text-center">
                    <div className="text-xl font-black text-gray-800">{stats.likes}</div>
                    <div className="text-xs text-gray-400 font-bold uppercase">Aura</div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}