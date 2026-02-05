"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import DeleteAccountModal from "./DeleteAccountModal"; 
import { User, Palette, Moon, Sun, Volume2, VolumeX, Save, Loader2 } from "lucide-react"; // Import Ikon Lucide

// Menerima props baru: isDark & toggleTheme
export default function Settings({ myName, isDark, toggleTheme }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State PIN Baru (Placeholder)
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "", bio: "", location: "", website: ""
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    fetchProfile();
    const savedSound = localStorage.getItem("pear_sound");
    if (savedSound === "off") setSoundEnabled(false);
  }, [myName]);

  const fetchProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("username", myName).single();
    if (data) {
      setFormData({
        full_name: data.full_name || "", bio: data.bio || "", location: data.location || "", website: data.website || ""
      });
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const updates = { username: myName, ...formData, updated_at: new Date() };
    const { error } = await supabase.from("profiles").upsert(updates);
    setSaving(false);
    if (!error) alert("✅ Profil berhasil disimpan!");
    else alert("❌ Gagal menyimpan.");
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem("pear_sound", newState ? "on" : "off");
  };

  const executeDelete = async () => { /* Logic hapus akun */ };

  if (loading) return (
      <div className="p-10 text-center text-gray-400 dark:text-slate-500 flex flex-col items-center gap-2">
          <Loader2 className="animate-spin" /> Memuat pengaturan...
      </div>
  );

  return (
    <div className="animate-in fade-in max-w-2xl mx-auto pb-10 transition-colors">
      <DeleteAccountModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={executeDelete} myName={myName} isDeleting={deleting} />

      {/* Header User */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative group cursor-pointer">
            <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${myName}`} className="w-20 h-20 rounded-full bg-white dark:bg-slate-700 border-4 border-gray-100 dark:border-slate-600 shadow-sm"/>
        </div>
        <div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white">@{myName}</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Kelola tampilan & privasi</p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* CARD 1: EDIT PROFIL */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm transition-colors">
            <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <User className="text-blue-500" size={20} /> Edit Profil
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 ml-1 mb-1 block">Nama Lengkap</label>
                    <input 
                        value={formData.full_name} 
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition"
                        placeholder="Nama asli kamu..."
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 ml-1 mb-1 block">Bio</label>
                    <textarea 
                        value={formData.bio} 
                        onChange={(e) => setFormData({...formData, bio: e.target.value})} 
                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none dark:text-white transition"
                        placeholder="Ceritakan sedikit tentangmu..."
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={saving} 
                    className="bg-gray-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition w-full disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
                </button>
            </form>
        </div>

        {/* CARD 2: TAMPILAN & SUARA */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm transition-colors">
            <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Palette className="text-purple-500" size={20} /> Tampilan & Aplikasi
            </h3>
            
            {/* TOGGLE DARK MODE */}
            <div className="flex items-center justify-between p-2 border-b border-gray-50 dark:border-slate-700 pb-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-orange-100 text-orange-500'}`}>
                        {isDark ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <div>
                        <p className="font-bold text-sm text-gray-700 dark:text-gray-200">Mode Gelap</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{isDark ? "Aktif (Mata Santuy)" : "Mati (Terang Benderang)"}</p>
                    </div>
                </div>
                {/* Switch Toggle */}
                <button onClick={toggleTheme} className={`w-12 h-6 rounded-full p-1 transition duration-300 ${isDark ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${isDark ? 'translate-x-6' : ''}`}></div>
                </button>
            </div>

            {/* TOGGLE SOUND */}
            <div className="flex items-center justify-between p-2 pt-4">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${soundEnabled ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>
                        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </div>
                    <div>
                        <p className="font-bold text-sm text-gray-700 dark:text-gray-200">Suara Notifikasi</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{soundEnabled ? "Nyala" : "Bisur"}</p>
                    </div>
                </div>
                <button onClick={toggleSound} className={`w-12 h-6 rounded-full p-1 transition duration-300 ${soundEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${soundEnabled ? 'translate-x-6' : ''}`}></div>
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}