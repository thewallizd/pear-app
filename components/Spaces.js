"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Modal from "./Modal"; 
import { Mic, Radio, Users, LogOut, Plus, Activity, Headphones } from "lucide-react"; // Import Ikon Lucide

export default function Spaces({ myName }) {
  const [spaces, setSpaces] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceTitle, setNewSpaceTitle] = useState("");
  const [activeSpace, setActiveSpace] = useState(null); 

  useEffect(() => {
    fetchSpaces();

    const channel = supabase
      .channel("public:spaces_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "spaces" }, () => {
        fetchSpaces();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchSpaces = async () => {
    const { data } = await supabase
        .from("spaces")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
    if (data) setSpaces(data);
  };

  const createSpace = async () => {
    if (!newSpaceTitle.trim()) return;
    
    const { data } = await supabase.from("spaces").insert([
        { title: newSpaceTitle, host: myName, is_active: true, listeners_count: 1 }
    ]).select();

    if (data) {
        setNewSpaceTitle("");
        setIsCreating(false);
        setActiveSpace(data[0]); 
    }
  };

  const joinSpace = async (space) => {
    setActiveSpace(space);
    await supabase.rpc('increment_listener', { row_id: space.id });
  };

  const leaveSpace = async () => {
    if (!activeSpace) return;

    if (activeSpace.host === myName) {
        if(confirm("Kamu Host. Keluar berarti mematikan Space. Yakin?")) {
            await supabase.from("spaces").update({ is_active: false }).eq("id", activeSpace.id);
            setActiveSpace(null);
        }
    } else {
        setActiveSpace(null);
        const newCount = Math.max(0, activeSpace.listeners_count - 1);
        await supabase.from("spaces").update({ listeners_count: newCount }).eq("id", activeSpace.id);
    }
  };

  // --- KOMPONEN ANIMASI GELOMBANG SUARA ---
  const AudioWave = () => (
    <div className="flex items-center justify-center gap-1 h-8">
      <div className="w-1 bg-white animate-[bounce_1s_infinite] h-3"></div>
      <div className="w-1 bg-white animate-[bounce_1.2s_infinite] h-6"></div>
      <div className="w-1 bg-white animate-[bounce_0.8s_infinite] h-4"></div>
      <div className="w-1 bg-white animate-[bounce_1.1s_infinite] h-7"></div>
      <div className="w-1 bg-white animate-[bounce_0.9s_infinite] h-3"></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      
      {/* 1. Header Banner */}
      {!activeSpace && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-purple-200 dark:shadow-none relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
                    <Mic size={24} /> Pear Spaces
                </h2>
                <p className="opacity-90 text-sm mb-4">Nongkrong, dengerin musik, atau curhat live.</p>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="bg-white text-purple-600 px-5 py-2 rounded-full font-bold text-sm hover:bg-purple-50 transition shadow-lg flex items-center gap-2"
                >
                    <Plus size={16} /> Bikin Space Baru
                </button>
            </div>
            {/* Dekorasi Background */}
            <Headphones className="absolute top-4 right-4 text-white opacity-10 w-32 h-32 rotate-12" />
        </div>
      )}

      {/* 2. Tampilan DALAM ROOM (Live) */}
      {activeSpace && (
         <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 border-4 border-purple-500/30 relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
                <span className="bg-red-500 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-4 animate-pulse flex items-center gap-1">
                    <Radio size={12} /> Live On Air
                </span>
                
                <h3 className="text-2xl font-bold mb-2">{activeSpace.title}</h3>
                <p className="text-gray-400 text-sm mb-8 flex items-center gap-1">Host: @{activeSpace.host}</p>

                {/* Avatar Host Berdenyut */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-30"></div>
                    <img 
                        src={`https://api.dicebear.com/9.x/notionists/svg?seed=${activeSpace.host}`} 
                        className="w-24 h-24 rounded-full border-4 border-gray-800 bg-gray-700 relative z-10"
                    />
                </div>

                {/* Visualizer */}
                <div className="mb-8">
                    <AudioWave />
                </div>

                <button 
                    onClick={leaveSpace} 
                    className="bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white px-6 py-2 rounded-xl font-bold transition border border-red-500/50 flex items-center gap-2"
                >
                    <LogOut size={16} /> Keluar Room
                </button>
            </div>
         </div>
      )}

      {/* 3. Daftar Space Aktif */}
      {!activeSpace && (
          <div className="grid gap-3">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 px-2 flex items-center gap-2">
                <Activity size={18} className="text-orange-500" /> Sedang Live Sekarang
            </h3>
            
            {spaces.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 flex flex-col items-center gap-2">
                    <Radio size={40} className="opacity-20" />
                    <span>Sepi banget... Yuk mulai siaran!</span>
                </div>
            ) : (
                spaces.map(space => (
                    <div key={space.id} onClick={() => joinSpace(space)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md transition cursor-pointer flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-purple-500 rounded-full opacity-0 group-hover:opacity-20 animate-pulse transition"></div>
                                <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${space.host}`} className="w-12 h-12 rounded-full border border-gray-100 dark:border-slate-600 bg-gray-50 dark:bg-slate-700"/>
                                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[8px] px-1 rounded font-bold border border-white dark:border-slate-800">LIVE</div>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">{space.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
                                    <span>@{space.host}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><Users size={10} /> {space.listeners_count}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-4 py-2 rounded-xl text-xs font-bold group-hover:bg-purple-600 group-hover:text-white transition">
                            Gabung
                        </div>
                    </div>
                ))
            )}
          </div>
      )}

      {/* 4. Modal Buat Space */}
      <Modal isOpen={isCreating} onClose={() => setIsCreating(false)} title="Mulai Siaran Baru">
         <div className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-center mb-4">
                <Mic size={32} className="mx-auto text-purple-600 dark:text-purple-400 mb-2" />
                <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Suaramu akan didengar seluruh warga Pear.</p>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">Topik Pembicaraan</label>
                <input 
                    autoFocus
                    type="text" 
                    value={newSpaceTitle}
                    onChange={(e) => setNewSpaceTitle(e.target.value)}
                    placeholder="Contoh: Bahas Konspirasi Bumi Datar..." 
                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 focus:outline-none transition dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                />
            </div>

            <button 
                onClick={createSpace} 
                disabled={!newSpaceTitle.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-200 dark:shadow-none transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
                <Radio size={16} /> Mulai Siaran
            </button>
         </div>
      </Modal>

    </div>
  );
}