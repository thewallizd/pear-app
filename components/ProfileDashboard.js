"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User, LogOut, Heart, FileText } from "lucide-react"; // Import Ikon Lucide

export default function ProfileDashboard({ myName, onLogout, onViewProfile }) {
  const [profile, setProfile] = useState({ full_name: "", bio: "" });
  const [stats, setStats] = useState({ posts: 0, likes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyData();

    // Realtime Profile Changes
    const channel = supabase
      .channel("my_dashboard_profile")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `username=eq.${myName}` }, (payload) => {
         setProfile(prev => ({ ...prev, ...payload.new }));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [myName]);

  const fetchMyData = async () => {
    const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", myName)
        .single();
    
    if (profileData) setProfile(profileData);

    const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author", myName);

    const { data: postsData } = await supabase.from("posts").select("votes").eq("author", myName);
    // Menggunakan kolom 'likes' jika ada, atau 'votes' (sesuaikan dengan skema DB kamu)
    // Asumsi: Kita pakai 'votes' untuk total likes di postingan
    // Kalau kamu pakai 'likes' di tabel posts, ganti 'votes' jadi 'likes'
    const totalLikes = postsData ? postsData.reduce((acc, curr) => acc + (curr.votes || curr.likes || 0), 0) : 0;

    setStats({ posts: count || 0, likes: totalLikes });
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm sticky top-24 animate-in fade-in text-center group transition-colors">
      
      {/* Background Banner Kecil */}
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-t-3xl opacity-10 dark:opacity-20"></div>

      <div className="relative z-10">
          {/* Avatar */}
          <div className="relative inline-block">
            <img 
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${myName}&backgroundColor=c0aede,b6e3f4&radius=50`} 
                className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-700 shadow-md bg-white dark:bg-slate-600 hover:scale-105 transition cursor-pointer"
                onClick={onViewProfile}
            />
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-700 rounded-full"></div>
          </div>

          {/* Nama & Bio */}
          <div className="mt-3">
            <h3 className="font-black text-xl text-gray-800 dark:text-white cursor-pointer hover:text-green-600 dark:hover:text-green-400 transition" onClick={onViewProfile}>
                {profile.full_name || `@${myName}`}
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 font-bold mb-2">@{myName}</p>
            
            {profile.bio ? (
                <p className="text-xs text-gray-500 dark:text-slate-400 italic line-clamp-2 px-2">"{profile.bio}"</p>
            ) : (
                <p className="text-[10px] text-gray-300 dark:text-slate-600">Belum ada bio.</p>
            )}
          </div>

          {/* Statistik Mini */}
          <div className="flex justify-center gap-6 my-6 border-t border-b border-gray-50 dark:border-slate-700 py-4">
            <div className="text-center flex flex-col items-center">
                <span className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-1">
                    <FileText size={16} className="text-blue-500" /> {stats.posts}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-1">Posts</span>
            </div>
            <div className="text-center flex flex-col items-center">
                <span className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-1">
                    <Heart size={16} className="text-red-500 fill-red-500" /> {stats.likes}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-1">Likes</span>
            </div>
          </div>

          {/* Menu Navigasi */}
          <div className="space-y-2">
            <button 
                onClick={onViewProfile}
                className="w-full py-2 rounded-xl text-sm font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-green-600 dark:hover:text-green-400 transition flex items-center justify-center gap-2"
            >
                <User size={18} /> Lihat Profil Lengkap
            </button>
            <button 
                onClick={onLogout}
                className="w-full py-2 rounded-xl text-sm font-bold text-gray-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition flex items-center justify-center gap-2"
            >
                <LogOut size={18} /> Keluar / Logout
            </button>
          </div>
      </div>
    </div>
  );
}