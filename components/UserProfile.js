"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "@/components/PostCard";
import TimeAgo from "@/components/TimeAgo";

export default function UserProfile({ targetUsername, myName, onBack, onChat }) {
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [stats, setStats] = useState({ posts: 0, aura: 0 });
  const [loading, setLoading] = useState(true);

  // Helper Spotify
  const getSpotifyId = (url) => {
    if (!url) return null;
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Ambil Info User
      const { data: userData } = await supabase.from("users").select("*").eq("username", targetUsername).single();
      
      // 2. Ambil Postingan User
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("author", targetUsername)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (userData) setProfile(userData);
      
      if (postsData) {
        setUserPosts(postsData);
        // Hitung Aura
        const totalAura = postsData.reduce((acc, curr) => acc + (curr.votes || 0), 0);
        setStats({ posts: postsData.length, aura: totalAura });
      }

      setLoading(false);
    };

    fetchData();
  }, [targetUsername]);

  if (loading) return <div className="p-10 text-center text-gray-400">Sedang mengintip profil... 🕵️‍♂️</div>;

  const avatarUrl = `https://api.dicebear.com/9.x/notionists/svg?seed=${targetUsername}&backgroundColor=c0aede,b6e3f4,ffdfbf,ffd5dc&radius=50`;

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      
      {/* HEADER NAVIGASI */}
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-green-600 font-bold text-sm mb-4 transition">
        ⬅ Kembali
      </button>

      {/* KARTU PROFIL UTAMA */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative group">
        {/* Banner Abstrak */}
        <div className="h-32 bg-gradient-to-r from-green-400 to-emerald-600 relative overflow-hidden">
           <div className="absolute inset-0 bg-white/10 pattern-dots"></div>
        </div>

        <div className="px-6 pb-6 relative">
          <div className="flex justify-between items-end -mt-12 mb-4">
            <img src={avatarUrl} className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md z-10"/>
            
            {/* TOMBOL AKSI */}
            {targetUsername !== myName && (
              <button 
                onClick={() => onChat(targetUsername)}
                className="bg-green-600 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition transform hover:-translate-y-1 flex items-center gap-2"
              >
                💬 Chat Personal
              </button>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
              @{targetUsername}
              {profile?.is_verified && <span className="text-blue-500 text-lg" title="Verified">☑️</span>}
            </h1>
            <p className="text-gray-600 mt-2 text-sm leading-relaxed">
              {profile?.bio || <span className="italic text-gray-400">Belum ada bio.</span>}
            </p>

            {/* INFO TAMBAHAN */}
            <div className="flex flex-wrap gap-3 mt-3">
              {profile?.location && <span className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded border">📍 {profile.location}</span>}
              {profile?.website && <a href={profile.website} target="_blank" className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 hover:underline">🔗 Website</a>}
            </div>

            {/* STATISTIK */}
            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                    <span className="block text-2xl font-black text-gray-800">{stats.posts}</span>
                    <span className="text-xs text-gray-400 uppercase font-bold">Postingan</span>
                </div>
                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-center">
                    <span className="block text-2xl font-black text-orange-600">{stats.aura}</span>
                    <span className="text-xs text-orange-400 uppercase font-bold">Total Aura ✨</span>
                </div>
            </div>

            {/* LAGU TEMA */}
            {profile?.theme_song && getSpotifyId(profile.theme_song) && (
               <div className="mt-6 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                  <iframe style={{borderRadius: '12px'}} src={`https://open.spotify.com/embed/track/${getSpotifyId(profile.theme_song)}?utm_source=generator&theme=0`} width="100%" height="80" frameBorder="0" allowFullScreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* RIWAYAT POSTINGAN */}
      <div>
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
           📝 Postingan {targetUsername}
        </h3>
        <div className="space-y-4">
            {userPosts.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed">Belum ada postingan.</div>
            ) : (
                userPosts.map(post => (
                    <PostCard key={post.id} {...post} createdAt={post.created_at} onUserClick={() => {}} myName={myName} />
                ))
            )}
        </div>
      </div>

    </div>
  );
}