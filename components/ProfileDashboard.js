"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfileDashboard({ myName, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({ posts: 0, likes: 0 });

  useEffect(() => {
    const fetchData = async () => {
        // 1. Ambil Note
        const { data: userData } = await supabase.from("users").select("note").eq("username", myName).single();
        if (userData) setNote(userData.note || "");

        // 2. Hitung Statistik (Opsional, biar keren)
        const { count: postCount } = await supabase.from("posts").select("*", { count: 'exact' }).eq("author", myName);
        const { data: posts } = await supabase.from("posts").select("votes").eq("author", myName);
        const totalVotes = posts ? posts.reduce((acc, curr) => acc + (curr.votes || 0), 0) : 0;
        
        setStats({ posts: postCount || 0, likes: totalVotes });
        setLoading(false);
    };
    fetchData();
  }, [myName]);

  const handleSaveNote = async () => {
    await supabase.from("users").update({ note: note }).eq("username", myName);
    setIsEditing(false);
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* HEADER PROFIL */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-green-400 to-emerald-500 opacity-20"></div>
        
        <div className="relative z-10 mt-4">
            <div className="relative inline-block">
                <img 
                    src={`https://api.dicebear.com/9.x/notionists/svg?seed=${myName}&backgroundColor=c0aede,b6e3f4&radius=50`} 
                    className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white" 
                />
                <span className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full text-xs border-2 border-white" title="Verified Warga">✓</span>
            </div>
            
            <h2 className="text-2xl font-black text-gray-800 mt-3">@{myName}</h2>
            
            {/* --- FITUR NOTES (Editable) --- */}
            <div className="mt-4 max-w-xs mx-auto">
                {isEditing ? (
                    <div className="flex gap-2 animate-in zoom-in">
                        <input 
                            type="text" 
                            value={note} 
                            onChange={(e) => setNote(e.target.value)}
                            maxLength={60}
                            className="w-full text-center text-sm border-b-2 border-green-500 focus:outline-none py-1 bg-transparent"
                            placeholder="Tulis statusmu..."
                            autoFocus
                        />
                        <button onClick={handleSaveNote} className="bg-green-500 text-white p-1 rounded-lg text-xs font-bold">✓</button>
                    </div>
                ) : (
                    <div 
                        onClick={() => setIsEditing(true)} 
                        className="bg-yellow-50 text-gray-600 text-sm px-4 py-2 rounded-xl border border-yellow-100 cursor-pointer hover:bg-yellow-100 transition relative group/note"
                    >
                        {note || "Klik untuk tambah notes..."}
                        <span className="absolute -top-2 -right-2 bg-white shadow-sm border rounded-full p-1 text-[8px] opacity-0 group-hover/note:opacity-100 transition">✏️</span>
                    </div>
                )}
            </div>
        </div>

        {/* STATISTIK */}
        <div className="flex justify-center gap-8 mt-6 border-t border-gray-100 pt-6">
            <div className="text-center">
                <div className="text-xl font-black text-gray-800">{stats.posts}</div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Post</div>
            </div>
            <div className="text-center">
                <div className="text-xl font-black text-gray-800">{stats.likes}</div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Aura</div>
            </div>
            <div className="text-center">
                <div className="text-xl font-black text-gray-800">0</div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Teman</div>
            </div>
        </div>
      </div>

      {/* MENU AKUN */}
      <div className="mt-6 space-y-3">
        <button onClick={onLogout} className="w-full bg-white border border-red-100 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-50 transition shadow-sm">
            Keluar Akun 🚪
        </button>
        <div className="text-center text-xs text-gray-300 mt-4">
            Pear App Version 1.0 (Universal)
        </div>
      </div>
    </div>
  );
}