"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "./PostCard";
import Modal from "./Modal";
import { ArrowLeft, Edit, MessageCircle, UserPlus, FileText, Loader2 } from "lucide-react"; // Import Lucide

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
    
    // 1. Ambil Detail Profil
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

    const { error } = await supabase
        .from("profiles")
        .upsert({
            username: myName,
            full_name: editForm.full_name,
            bio: editForm.bio,
            updated_at: new Date()
        });

    if (!error) {
        setProfileData({ ...profileData, ...editForm });
        setIsEditing(false);
    } else {
        alert("Gagal menyimpan profil.");
    }
    setIsSaving(false);
  };

  return (
    <div className="animate-in slide-in-from-right-4 transition-colors">
      
      {/* Navigasi */}
      <button 
        onClick={onBack} 
        className="mb-4 flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 font-bold text-sm transition group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition" /> Kembali ke Home
      </button>

      {/* KARTU PROFIL UTAMA */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm text-center mb-6 relative overflow-hidden transition-colors">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-green-400 to-blue-500 opacity-20 dark:opacity-30"></div>
        
        <div className="relative z-10 -mt-2">
            <img 
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${targetUsername}&backgroundColor=c0aede,b6e3f4&radius=50`} 
                className="w-24 h-24 mx-auto rounded-full border-4 border-white dark:border-slate-700 shadow-md bg-white dark:bg-slate-600 hover:scale-105 transition duration-300"
            />
            
            {/* Nama Lengkap & Username */}
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mt-3">
                {profileData.full_name || `@${targetUsername}`}
            </h2>
            {profileData.full_name && <p className="text-sm text-gray-400 dark:text-slate-500 font-bold">@{targetUsername}</p>}

            {/* BIO */}
            {profileData.bio ? (
                <p className="text-gray-600 dark:text-slate-300 text-sm mt-2 max-w-xs mx-auto italic">"{profileData.bio}"</p>
            ) : (
                <p className="text-gray-300 dark:text-slate-600 text-xs mt-2 italic">Belum ada bio.</p>
            )}

            {/* Statistik */}
            <div className="flex justify-center gap-8 mt-6 mb-6">
                <div className="text-center">
                    <span className="block font-black text-xl text-gray-800 dark:text-white">{posts.length}</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider font-bold">Posts</span>
                </div>
                <div className="text-center">
                    <span className="block font-black text-xl text-gray-800 dark:text-white">0</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider font-bold">Followers</span>
                </div>
            </div>

            {/* --- TOMBOL AKSI --- */}
            <div className="flex justify-center gap-3">
                {isOwnProfile ? (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="bg-gray-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition shadow-lg flex items-center gap-2"
                    >
                        <Edit size={16} /> Edit Profil
                    </button>
                ) : (
                    <>
                        <button 
                            onClick={() => onChat(targetUsername)}
                            className="bg-green-500 text-white px-6 py-2 rounded-xl font-bold shadow-green-200 dark:shadow-none hover:bg-green-600 transition flex items-center gap-2"
                        >
                            <MessageCircle size={16} /> Chat
                        </button>
                        <button className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-200 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition flex items-center gap-2">
                            <UserPlus size={16} /> Follow
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
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">Nama Tampilan</label>
                <input 
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900 dark:text-white transition"
                    placeholder="Contoh: Raka Si Paling Koding"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">Bio / Status</label>
                <textarea 
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900 resize-none h-24 dark:text-white transition"
                    placeholder="Ceritakan sedikit tentang dirimu..."
                />
            </div>
            <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition shadow-lg shadow-green-100 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : "Simpan Perubahan"}
            </button>
        </div>
      </Modal>

      {/* POST LIST */}
      <div className="flex items-center gap-2 mb-4 px-2 text-gray-700 dark:text-white">
        <FileText size={20} className="text-gray-500 dark:text-slate-400" />
        <h3 className="font-bold">Riwayat Postingan</h3>
      </div>
      
      {loading ? (
        <div className="text-center py-10 text-gray-400 dark:text-slate-500 flex flex-col items-center gap-2">
            <Loader2 size={24} className="animate-spin" />
            <span>Memuat...</span>
        </div>
      ) : (
        <div className="space-y-4">
            {posts.map((post) => (
                <PostCard key={post.id} {...post} myName={myName} onUserClick={() => {}} />
            ))}
            {posts.length === 0 && (
                <div className="text-center py-10 text-gray-400 dark:text-slate-500 border border-dashed border-gray-200 dark:border-slate-700 rounded-3xl">
                    Belum ada postingan.
                </div>
            )}
        </div>
      )}
    </div>
  );
}