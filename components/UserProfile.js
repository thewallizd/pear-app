"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "./PostCard";
import Modal from "./Modal"; // PENTING: Pastikan Modal.js sudah ada

export default function UserProfile({ targetUsername, myName, onBack, onChat }) {
  // Data Profil
  const [profileData, setProfileData] = useState({ full_name: "", bio: "" });
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk Edit Profil
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", bio: "" });
  const [isSaving, setIsSaving] = useState(false);

  const isOwnProfile = targetUsername === myName;

  useEffect(() => {
    fetchData();
  }, [targetUsername]);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Ambil Detail Profil (Bio & Nama)
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", targetUsername)
        .single();
    
    if (profile) {
        setProfileData(profile);
        setEditForm({ full_name: profile.full_name || "", bio: profile.bio || "" });
    }

    // 2. Ambil Postingan
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .eq("author", targetUsername)
      .order("created_at", { ascending: false });
      
    if (postsData) setPosts(postsData);
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);

    // Upsert = Kalau belum ada dibuat, kalau sudah ada diupdate
    const { error } = await supabase
        .from("profiles")
        .upsert({
            username: myName,
            full_name: editForm.full_name,
            bio: editForm.bio
        });

    if (!error) {
        setProfileData({ ...profileData, ...editForm }); // Update tampilan
        setIsEditing(false); // Tutup modal
    } else {
        alert("Gagal menyimpan profil.");
    }
    setIsSaving(false);
  };

  return (
    <div className="animate-in slide-in-from-right-4">
      {/* Navigasi */}
      <button 
        onClick={onBack} 
        className="mb-4 flex items-center gap-2 text-gray-500 hover:text-green-600 font-bold text-sm transition group"
      >
        <span className="group-hover:-translate-x-1 transition">⬅</span> Kembali ke Home
      </button>

      {/* KARTU PROFIL UTAMA */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-green-400 to-blue-500 opacity-20"></div>
        
        <div className="relative z-10 -mt-2">
            <img 
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${targetUsername}&backgroundColor=c0aede,b6e3f4&radius=50`} 
                className="w-24 h-24 mx-auto rounded-full border-4 border-white shadow-md bg-white hover:scale-105 transition duration-300"
            />
            
            {/* Nama Lengkap & Username */}
            <h2 className="text-2xl font-black text-gray-800 mt-3">
                {profileData.full_name || `@${targetUsername}`}
            </h2>
            {profileData.full_name && <p className="text-sm text-gray-400 font-bold">@{targetUsername}</p>}

            {/* BIO (Kalau ada) */}
            {profileData.bio ? (
                <p className="text-gray-600 text-sm mt-2 max-w-xs mx-auto italic">"{profileData.bio}"</p>
            ) : (
                <p className="text-gray-300 text-xs mt-2 italic">Belum ada bio.</p>
            )}

            {/* Statistik */}
            <div className="flex justify-center gap-8 mt-6 mb-6">
                <div className="text-center">
                    <span className="block font-black text-xl text-gray-800">{posts.length}</span>
                    <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Posts</span>
                </div>
                <div className="text-center">
                    <span className="block font-black text-xl text-gray-800">0</span>
                    <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Followers</span>
                </div>
            </div>

            {/* --- TOMBOL AKSI --- */}
            <div className="flex justify-center gap-3">
                {isOwnProfile ? (
                    // TOMBOL EDIT (Hanya muncul di profil sendiri)
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="bg-gray-800 text-white px-6 py-2 rounded-xl font-bold hover:bg-black transition shadow-lg"
                    >
                        ✏️ Edit Profil
                    </button>
                ) : (
                    // TOMBOL CHAT (Hanya muncul di profil orang lain)
                    <>
                        <button 
                            onClick={() => onChat(targetUsername)}
                            className="bg-green-500 text-white px-6 py-2 rounded-xl font-bold shadow-green-200 hover:bg-green-600 transition"
                        >
                            💬 Chat
                        </button>
                        <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 transition">
                            Follow +
                        </button>
                    </>
                )}
            </div>
        </div>
      </div>

      {/* MODAL EDIT PROFIL */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Profil Kamu">
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nama Tampilan</label>
                <input 
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                    placeholder="Contoh: Raka Si Paling Koding"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Bio / Status</label>
                <textarea 
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 resize-none h-24"
                    placeholder="Ceritakan sedikit tentang dirimu..."
                />
            </div>
            <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition shadow-lg shadow-green-100"
            >
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
        </div>
      </Modal>

      {/* POST LIST */}
      <div className="flex items-center gap-2 mb-4 px-2">
        <span className="text-xl">📝</span>
        <h3 className="font-bold text-gray-700">Riwayat Postingan</h3>
      </div>
      
      {loading ? (
        <div className="text-center py-10 text-gray-400">⏳ Memuat...</div>
      ) : (
        <div className="space-y-4">
            {posts.map((post) => (
                <PostCard key={post.id} {...post} myName={myName} onUserClick={() => {}} />
            ))}
        </div>
      )}
    </div>
  );
}