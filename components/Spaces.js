"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Spaces({ myName, onVisitProfile }) {
  const [spaces, setSpaces] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceTitle, setNewSpaceTitle] = useState("");
  const [activeSpace, setActiveSpace] = useState(null); // Kalau join space

  useEffect(() => {
    fetchSpaces();

    // Realtime Listener: Kalau ada yang bikin space baru, langsung muncul
    const channel = supabase
      .channel("public:spaces")
      .on("postgres_changes", { event: "*", schema: "public", table: "spaces" }, (payload) => {
        fetchSpaces(); // Refresh list kalau ada perubahan
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchSpaces = async () => {
    const { data } = await supabase.from("spaces").select("*").eq("is_active", true).order("created_at", { ascending: false });
    if (data) setSpaces(data);
  };

  const createSpace = async () => {
    if (!newSpaceTitle.trim()) return;
    
    // Simpan ke Database
    const { data, error } = await supabase.from("spaces").insert([
        { title: newSpaceTitle, host: myName, is_active: true, listeners_count: 1 }
    ]).select();

    if (data) {
        setNewSpaceTitle("");
        setIsCreating(false);
        joinSpace(data[0]); // Otomatis join setelah bikin
    }
  };

  const joinSpace = (space) => {
    setActiveSpace(space);
    // Di sini nanti bisa pasang logika WebRTC/Audio
    alert(`Bergabung ke Space "${space.title}". (Fitur suara sedang dikembangkan)`);
  };

  const leaveSpace = async () => {
    setActiveSpace(null);
    // Kalau host yang keluar, space bubar (opsional)
    if (activeSpace?.host === myName) {
        await supabase.from("spaces").update({ is_active: false }).eq("id", activeSpace.id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Space */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-2xl font-black mb-1">🎙️ Pear Spaces</h2>
            <p className="opacity-90 text-sm">Nongkrong, dengerin musik, atau curhat live.</p>
            
            {!activeSpace && (
                <button 
                    onClick={() => setIsCreating(!isCreating)}
                    className="mt-4 bg-white text-purple-600 px-5 py-2 rounded-full font-bold text-sm hover:bg-purple-50 transition shadow-lg"
                >
                    {isCreating ? "Batal" : "+ Bikin Space Baru"}
                </button>
            )}
        </div>
        
        {/* Dekorasi Background */}
        <div className="absolute top-0 right-0 p-4 text-9xl opacity-10 rotate-12">🎧</div>
      </div>

      {/* Form Buat Space */}
      {isCreating && (
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm animate-in slide-in-from-top-2">
            <input 
                autoFocus
                type="text" 
                value={newSpaceTitle}
                onChange={(e) => setNewSpaceTitle(e.target.value)}
                placeholder="Mau bahas topik apa?" 
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-purple-200 mb-3"
            />
            <button onClick={createSpace} className="w-full bg-purple-600 text-white py-2 rounded-xl font-bold">Mulai Siaran 📡</button>
        </div>
      )}

      {/* Tampilan Sedang Live (Active Space) */}
      {activeSpace && (
         <div className="bg-purple-900 text-white p-6 rounded-3xl shadow-2xl animate-pulse-slow border-4 border-purple-500/30">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Live</span>
                    <h3 className="text-xl font-bold mt-2">{activeSpace.title}</h3>
                    <p className="text-sm opacity-70">Host: @{activeSpace.host}</p>
                </div>
                <button onClick={leaveSpace} className="bg-white/10 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition">
                    Keluar ✌️
                </button>
            </div>
            
            {/* Visualisasi Speaker */}
            <div className="flex gap-4 justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                    <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${activeSpace.host}`} className="w-16 h-16 rounded-full border-4 border-purple-400 bg-white"/>
                    <span className="text-xs font-bold">@{activeSpace.host}</span>
                </div>
            </div>
         </div>
      )}

      {/* Daftar Space Aktif */}
      {!activeSpace && (
          <div className="grid gap-3">
            {spaces.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                    <div className="text-4xl mb-2">🦗</div>
                    Belum ada yang siaran. Kamu yang pertama dong!
                </div>
            ) : (
                spaces.map(space => (
                    <div key={space.id} className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition cursor-pointer flex justify-between items-center" onClick={() => joinSpace(space)}>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl">📻</div>
                            <div>
                                <h4 className="font-bold text-gray-800">{space.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${space.host}`} className="w-4 h-4 rounded-full"/>
                                    @{space.host} • {space.listeners_count} pendengar
                                </div>
                            </div>
                        </div>
                        <div className="bg-purple-50 text-purple-600 px-3 py-1 rounded-lg text-xs font-bold">
                            Join
                        </div>
                    </div>
                ))
            )}
          </div>
      )}
    </div>
  );
}