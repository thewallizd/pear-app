"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "@/components/PostCard";

export default function ProfileDashboard({ myName, onLogout, onUserClick }) {
  const [stats, setStats] = useState({ posts: 0, votes: 0, friends: 0 });
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // STATE PROFILE
  const [profileData, setProfileData] = useState({ bio: "", website: "", location: "", theme_song: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: "", website: "", location: "", theme_song: "" });
  const [isSaving, setIsSaving] = useState(false);

  // State Rank
  const [rank, setRank] = useState("Warga Baru 🌱");
  const [nextRank, setNextRank] = useState({ name: "Warga Aktif 🔥", target: 20 });
  const [progress, setProgress] = useState(0);

  const avatarUrl = `https://api.dicebear.com/9.x/notionists/svg?seed=${myName}&backgroundColor=c0aede,b6e3f4,ffdfbf,ffd5dc&radius=50`;

  const getSpotifyId = (url) => {
    if (!url) return null;
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: postsData } = await supabase
  .from("posts")
  .select("*")
  .eq("author", myName)
  .order("is_pinned", { ascending: false }) // <--- YANG PINNED DI ATAS
  .order("created_at", { ascending: false });
      const { count: friendsCount } = await supabase.from("friends").select("*", { count: "exact", head: true }).eq("status", "accepted").or(`requester.eq.${myName},receiver.eq.${myName}`);

      if (postsData) {
        setMyPosts(postsData);
        const totalVotes = postsData.reduce((acc, curr) => acc + (curr.votes || 0), 0);
        setStats({ posts: postsData.length, votes: totalVotes, friends: friendsCount || 0 });

        let currentRank = "Warga Baru 🌱";
        let next = { name: "Warga Aktif 🔥", target: 20 };
        if (totalVotes > 100) { currentRank = "Sepuh Sirkel 🧙‍♂️"; next = { name: "Legend Abadi 🏆", target: 500 }; } 
        else if (totalVotes > 50) { currentRank = "Starboy/girl 🌟"; next = { name: "Sepuh Sirkel 🧙‍♂️", target: 101 }; } 
        else if (totalVotes > 20) { currentRank = "Warga Aktif 🔥"; next = { name: "Starboy/girl 🌟", target: 51 }; }
        setRank(currentRank);
        setNextRank(next);
        setProgress(Math.min((totalVotes / next.target) * 100, 100));
      }

      const { data: userData } = await supabase.from("users").select("bio, website, location, theme_song").eq("username", myName).single();
      if (userData) {
        setProfileData(userData);
        setEditForm(userData);
      }
      setLoading(false);
    };

    fetchData();
  }, [myName]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const { error } = await supabase.from("users").update({
        bio: editForm.bio, website: editForm.website, location: editForm.location, theme_song: editForm.theme_song
      }).eq("username", myName);

    if (!error) {
      setProfileData(editForm);
      setIsEditing(false);
      alert("Profil berhasil diupdate! ✨");
    } else {
      alert("Gagal update profil.");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="bg-white rounded-3xl shadow-xl border border-white overflow-hidden relative group">
        <div className="h-40 relative w-full overflow-hidden bg-gray-100">
           <img src={avatarUrl} className="w-full h-full object-cover blur-2xl scale-125 opacity-60 transform group-hover:scale-150 transition duration-1000"/>
           <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90"></div>
        </div>

        <div className="px-8 pb-8 relative">
          <div className="flex justify-between items-end -mt-16 mb-4 relative z-10">
            <div className="relative">
              <img src={avatarUrl} className="w-28 h-28 rounded-full bg-white border-[6px] border-white shadow-2xl"/>
              <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white" title="Online"></div>
            </div>
            
            <div className="flex gap-2 mb-4">
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 bg-white text-gray-700 text-xs font-bold rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 hover:shadow-md transition transform hover:-translate-y-1 flex items-center gap-2">
                  ✏️ Edit Profile
                </button>
              )}
              <button onClick={onLogout} className="px-5 py-2.5 bg-white text-red-500 text-xs font-bold rounded-full border border-gray-100 shadow-sm hover:bg-red-50 hover:shadow-md transition transform hover:-translate-y-1">
                Logout 🚪
              </button>
            </div>
          </div>

          {isEditing ? (
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3 mb-6 animate-in slide-in-from-top-2">
              <h3 className="font-bold text-gray-800 text-sm mb-2">Edit Informasi Publik</h3>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Bio / Tentang Kamu</label>
                <textarea className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-green-500" rows="2" placeholder="Ceritakan sedikit tentang dirimu..." value={editForm.bio || ""} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1"><span>🎵 Theme Song (Link Spotify)</span></label>
                <input type="text" className="w-full p-2.5 rounded-xl border border-green-200 bg-green-50/50 text-sm focus:outline-none focus:border-green-500 placeholder-green-700/30" placeholder="Paste link lagu Spotify..." value={editForm.theme_song || ""} onChange={(e) => setEditForm({...editForm, theme_song: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-gray-500 uppercase">Lokasi 📍</label><input type="text" className="w-full p-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-green-500" placeholder="Depok" value={editForm.location || ""} onChange={(e) => setEditForm({...editForm, location: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold text-gray-500 uppercase">Link / Website 🔗</label><input type="text" className="w-full p-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-green-500" placeholder="instagram.com/..." value={editForm.website || ""} onChange={(e) => setEditForm({...editForm, website: e.target.value})} /></div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition">Batal</button>
                <button onClick={handleSaveProfile} disabled={isSaving} className="px-6 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition shadow-md disabled:opacity-50">{isSaving ? "Menyimpan..." : "Simpan Perubahan ✅"}</button>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-black text-gray-800 tracking-tight">{myName}</h1>
              <div className="space-y-4 mt-2 max-w-lg">
                <p className="text-gray-600 text-sm leading-relaxed">{profileData.bio || <span className="text-gray-400 italic">Belum ada bio. Klik edit untuk menambahkan.</span>}</p>
                
                {/* --- PLAYER MUSIK SPOTIFY (NO SCROLL) --- */}
                {getSpotifyId(profileData.theme_song) && (
                  <div className="my-3 animate-in fade-in zoom-in duration-500 overflow-hidden rounded-xl bg-black">
                    <iframe 
                      style={{borderRadius: '12px'}} 
                      src={`https://open.spotify.com/embed/track/${getSpotifyId(profileData.theme_song)}?utm_source=generator&theme=0`} 
                      width="100%" 
                      height="80" 
                      frameBorder="0" 
                      scrolling="no" // <-- INI YANG BIKIN GAK ADA SCROLL
                      allowFullScreen="" 
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                      loading="lazy"
                      className="shadow-sm border border-gray-100"
                    ></iframe>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 mt-2">
                  <div className="flex items-center gap-2"><span className="bg-black/5 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-black/5">{rank}</span><span className="text-xs text-gray-400">• Bergabung 2026</span></div>
                  {profileData.location && <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">📍 {profileData.location}</span>}
                  {profileData.website && <a href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 hover:underline">🔗 {profileData.website.replace(/(^\w+:|^)\/\//, '').substring(0, 20)}...</a>}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {/* CARD POST */}
            <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition hover:-translate-y-1 group/card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl group-hover/card:scale-110 transition">📝</div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kontribusi</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-800">{stats.posts}</span>
                <span className="text-sm text-gray-500 font-medium">Post</span>
              </div>
            </div>

            {/* CARD REPUTASI (UPDATE TEXT GAUL) */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition hover:-translate-y-1 relative overflow-hidden group/karma">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/karma:opacity-20 transition"><span className="text-6xl">🔥</span></div>
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xl shadow-inner">⚡</div>
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Reputasi</span>
              </div>
              <div className="relative z-10">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-black text-gray-800">{stats.votes}</span>
                  {/* UBAH TEXT DI SINI JADI "Total Aura" */}
                  <span className="text-sm text-gray-500 font-medium">Total Aura ✨</span>
                </div>
                <div className="w-full bg-orange-200/50 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-[10px] text-orange-600 mt-1 font-medium">{Math.round(nextRank.target - stats.votes)} poin lagi menuju <span className="font-bold">{nextRank.name}</span></p>
              </div>
            </div>

            {/* CARD TEMAN */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl">🤝</div>
                <span className="text-xs font-bold text-green-500 uppercase tracking-wider">Koneksi</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-800">{stats.friends}</span>
                <span className="text-sm text-gray-500 font-medium">Teman</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><span>Riwayat Postingan</span><span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-extrabold">{myPosts.length}</span></h3>
        </div>
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
          ) : myPosts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200"><div className="text-4xl mb-2">🍃</div><p className="text-gray-400 font-medium">Masih sepi nih...</p></div>
          ) : (
            myPosts.map((post) => (<PostCard key={post.id} {...post} createdAt={post.created_at} onUserClick={onUserClick} myName={myName}/>))
          )}
        </div>
      </div>
    </div>
  );
}