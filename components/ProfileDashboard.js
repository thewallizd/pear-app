"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfileDashboard({ myName, onLogout, onViewProfile }) {
  const [profile, setProfile] = useState({ full_name: "", bio: "" });
  const [stats, setStats] = useState({ posts: 0, likes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyData();

    // Realtime: Kalau bio diganti, widget ini langsung berubah
    const channel = supabase
      .channel("my_dashboard_profile")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `username=eq.${myName}` }, (payload) => {
         setProfile(prev => ({ ...prev, ...payload.new }));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [myName]);

  const fetchMyData = async () => {
    // 1. Ambil Info Profil (Nama & Bio)
    const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", myName)
        .single();
    
    if (profileData) setProfile(profileData);

    // 2. Hitung Jumlah Postingan
    const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true }) // head: true artinya cuma hitung jumlah, gak ambil datanya (biar ringan)
        .eq("author", myName);

    // 3. Hitung Total Likes (Agak trick, tapi bisa)
    const { data: postsData } = await supabase.from("posts").select("votes").eq("author", myName);
    const totalLikes = postsData ? postsData.reduce((acc, curr) => acc + (curr.votes || 0), 0) : 0;

    setStats({ posts: count || 0, likes: totalLikes });
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-24 animate-in fade-in text-center group">
      
      {/* Background Banner Kecil */}
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-t-3xl opacity-10"></div>

      <div className="relative z-10">
          {/* Avatar */}
          <div className="relative inline-block">
            <img 
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${myName}&backgroundColor=c0aede,b6e3f4&radius=50`} 
                className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-white hover:scale-105 transition cursor-pointer"
                onClick={onViewProfile}
            />
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>

          {/* Nama & Bio */}
          <div className="mt-3">
            <h3 className="font-black text-xl text-gray-800 cursor-pointer hover:text-green-600 transition" onClick={onViewProfile}>
                {profile.full_name || `@${myName}`}
            </h3>
            <p className="text-xs text-gray-400 font-bold mb-2">@{myName}</p>
            
            {profile.bio ? (
                <p className="text-xs text-gray-500 italic line-clamp-2 px-2">"{profile.bio}"</p>
            ) : (
                <p className="text-[10px] text-gray-300">Belum ada bio.</p>
            )}
          </div>

          {/* Statistik Mini */}
          <div className="flex justify-center gap-4 my-6 border-t border-b border-gray-50 py-4">
            <div className="text-center">
                <span className="block font-bold text-lg text-gray-800">{stats.posts}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Posts</span>
            </div>
            <div className="text-center">
                <span className="block font-bold text-lg text-gray-800">{stats.likes}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Likes</span>
            </div>
          </div>

          {/* Menu Navigasi */}
          <div className="space-y-2">
            <button 
                onClick={onViewProfile}
                className="w-full py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-green-600 transition flex items-center justify-center gap-2"
            >
                👤 Lihat Profil Lengkap
            </button>
            <button 
                onClick={onLogout}
                className="w-full py-2 rounded-xl text-sm font-bold text-gray-400 hover:bg-red-50 hover:text-red-500 transition flex items-center justify-center gap-2"
            >
                🚪 Keluar / Logout
            </button>
          </div>
      </div>
    </div>
  );
}