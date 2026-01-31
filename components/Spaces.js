"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Modal from "./Modal"; // Kita pakai Modal biar rapi

export default function Spaces({ myName }) {
  const [spaces, setSpaces] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceTitle, setNewSpaceTitle] = useState("");
  
  // State kalau lagi masuk di dalam room
  const [activeSpace, setActiveSpace] = useState(null); 

  useEffect(() => {
    fetchSpaces();

    // Realtime Listener: Update list kalau ada space baru atau jumlah pendengar berubah
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
    
    // 1. Buat Space di DB
    const { data, error } = await supabase.from("spaces").insert([
        { title: newSpaceTitle, host: myName, is_active: true, listeners_count: 1 }
    ]).select();

    if (data) {
        setNewSpaceTitle("");
        setIsCreating(false);
        // Otomatis join sebagai Host
        setActiveSpace(data[0]); 
    }
  };

  const joinSpace = async (space) => {
    setActiveSpace(space);
    // Update DB: Tambah pendengar +1
    await supabase.rpc('increment_listener', { row_id: space.id });
  };

  const leaveSpace = async () => {
    if (!activeSpace) return;

    // Update DB: Kurangi pendengar -1
    // (Note: Idealnya pakai RPC decrement, tapi update biasa juga oke buat MVP)
    if (activeSpace.host === myName) {
        // Kalau Host yang keluar, matikan space
        if(confirm("Kamu Host. Keluar berarti mematikan Space. Yakin?")) {
            await supabase.from("spaces").update({ is_active: false }).eq("id", activeSpace.id);
            setActiveSpace(null);
        }
    } else {
        // Kalau pendengar biasa
        setActiveSpace(null);
        // Logic decrement manual (atau buat RPC decrement_listener nanti)
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
    <div className="space-y-6 animate-in fade-in">
      
      {/* 1. Header Banner */}
      {!activeSpace && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-2xl font-black mb-1">🎙️ Pear Spaces</h2>
                <p className="opacity-90 text-sm mb-4">Nongkrong, dengerin musik, atau curhat live.</p>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="bg-white text-purple-600 px-5 py-2 rounded-full font-bold text-sm hover:bg-purple-50 transition shadow-lg"
                >
                    + Bikin Space Baru
                </button>
            </div>
            <div className="absolute top-0 right-0 p-4 text-9xl opacity-10 rotate-12">🎧</div>
        </div>
      )}

      {/* 2. Tampilan DALAM ROOM (Live) */}
      {activeSpace && (
         <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 border-4 border-purple-500/30 relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
                <span className="bg-red-500 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-4 animate-pulse">
                    🔴 Live On Air
                </span>
                
                <h3 className="text-2xl font-bold mb-2">{activeSpace.title}</h3>
                <p className="text-gray-400 text-sm mb-8">Host: @{activeSpace.host}</p>

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
                    className="bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white px-6 py-2 rounded-xl font-bold transition border border-red-500/50"
                >
                    ✌️ Keluar Room
                </button>
            </div>
         </div>
      )}

      {/* 3. Daftar Space Aktif */}
      {!activeSpace && (
          <div className="grid gap-3">
            <h3 className="font-bold text-gray-700 px-2">Sedang Live Sekarang 🔥</h3>
            
            {spaces.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400">
                    <div className="text-4xl mb-2">🦗</div>
                    Sepi banget... Yuk mulai siaran!
                </div>
            ) : (
                spaces.map(space => (
                    <div key={space.id} onClick={() => joinSpace(space)} className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-purple-400 hover:shadow-md transition cursor-pointer flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-purple-500 rounded-full opacity-0 group-hover:opacity-20 animate-pulse transition"></div>
                                <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${space.host}`} className="w-12 h-12 rounded-full border border-gray-100 bg-gray-50"/>
                                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[8px] px-1 rounded font-bold border border-white">LIVE</div>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 group-hover:text-purple-600 transition">{space.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span>Host: @{space.host}</span>
                                    <span>•</span>
                                    <span>👥 {space.listeners_count} pendengar</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-purple-50 text-purple-600 px-4 py-2 rounded-xl text-xs font-bold group-hover:bg-purple-600 group-hover:text-white transition">
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
            <div className="bg-purple-50 p-4 rounded-xl text-center mb-4">
                <span className="text-4xl">🎙️</span>
                <p className="text-xs text-purple-700 mt-2 font-medium">Suaramu akan didengar seluruh warga Pear.</p>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Topik Pembicaraan</label>
                <input 
                    autoFocus
                    type="text" 
                    value={newSpaceTitle}
                    onChange={(e) => setNewSpaceTitle(e.target.value)}
                    placeholder="Contoh: Bahas Konspirasi Bumi Datar..." 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:outline-none transition"
                />
            </div>

            <button 
                onClick={createSpace} 
                disabled={!newSpaceTitle.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-200 transition disabled:opacity-50"
            >
                Mulai Siaran 📡
            </button>
         </div>
      </Modal>

    </div>
  );
}