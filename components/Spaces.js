"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Spaces({ myName, onVisitProfile }) {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [topic, setTopic] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [chats, setChats] = useState([]);
  const [chatMsg, setChatMsg] = useState("");

  // 1. Fetch Room yang Aktif
  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase.from('spaces').select('*').eq('is_active', true);
      if (data) setRooms(data);
    };
    fetchRooms();

    // Realtime Listener untuk Room baru
    const channel = supabase.channel('public_spaces')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spaces' }, (payload) => {
         if (payload.eventType === 'INSERT') setRooms(prev => [payload.new, ...prev]);
         if (payload.eventType === 'UPDATE' && !payload.new.is_active) setRooms(prev => prev.filter(r => r.id !== payload.new.id));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // 2. Masuk Room (Realtime Presence)
  useEffect(() => {
    if (!activeRoom) return;
    
    // Load chat history (opsional)
    // setChats([]); 

    const roomChannel = supabase.channel(`space_${activeRoom.id}`, {
      config: { presence: { key: myName } }
    });

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState();
        const users = [];
        for (const key in state) {
            users.push(key);
        }
        setParticipants(users);
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        setChats((prev) => [...prev, payload]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
        roomChannel.unsubscribe();
    };
  }, [activeRoom, myName]);

  const createRoom = async () => {
    if (!topic.trim()) return;
    const { data, error } = await supabase.from('spaces').insert([{ host: myName, title: topic, is_active: true }]).select().single();
    if (data) {
        setRooms([data, ...rooms]);
        setActiveRoom(data);
        setIsCreating(false);
    }
  };

  const leaveRoom = async () => {
      if (activeRoom.host === myName) {
          // Kalau host keluar, room bubar
          await supabase.from('spaces').update({ is_active: false }).eq('id', activeRoom.id);
      }
      setActiveRoom(null);
  };

  const sendChat = async (e) => {
      e.preventDefault();
      if (!chatMsg.trim()) return;
      const payload = { user: myName, msg: chatMsg };
      setChats(prev => [...prev, payload]); // Update lokal
      // Kirim ke orang lain via Broadcast (Hemat database, karena chat space biasanya sementara)
      await supabase.channel(`space_${activeRoom.id}`).send({ type: 'broadcast', event: 'chat', payload });
      setChatMsg("");
  };

  // --- TAMPILAN DALAM ROOM ---
  if (activeRoom) {
      return (
          <div className="bg-gray-900 text-white min-h-[500px] rounded-3xl p-6 relative flex flex-col justify-between overflow-hidden shadow-2xl">
              
              {/* Header */}
              <div className="flex justify-between items-start z-10">
                  <div>
                    <h2 className="text-2xl font-bold">{activeRoom.title}</h2>
                    <p className="text-green-400 text-sm flex items-center gap-1">● Live Space</p>
                  </div>
                  <button onClick={leaveRoom} className="bg-red-500/20 text-red-400 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-red-500 hover:text-white transition">
                      {activeRoom.host === myName ? "Akhiri Space" : "Keluar"}
                  </button>
              </div>

              {/* Grid Speakers & Listeners */}
              <div className="flex-1 py-8 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-6">
                      {/* Host selalu paling depan */}
                      <div className="flex flex-col items-center">
                          <div className="relative">
                            <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${activeRoom.host}`} className="w-20 h-20 rounded-full border-4 border-green-500 bg-gray-800" />
                            <span className="absolute -bottom-2 bg-green-500 text-[10px] px-2 rounded-full font-bold">HOST</span>
                          </div>
                          <span className="mt-2 text-sm font-bold truncate w-full text-center">@{activeRoom.host}</span>
                      </div>

                      {/* Participants lain */}
                      {participants.filter(p => p !== activeRoom.host).map((user) => (
                          <div key={user} className="flex flex-col items-center opacity-80 hover:opacity-100 transition">
                              <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user}`} className="w-16 h-16 rounded-full border-2 border-gray-600 bg-gray-800" />
                              <span className="mt-2 text-xs text-gray-400 truncate w-full text-center">@{user}</span>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Chat Area (Floating) */}
              <div className="space-y-2 mb-4 h-32 overflow-y-auto px-2 mask-image-b">
                  {chats.map((c, i) => (
                      <div key={i} className="flex gap-2 items-end animate-in slide-in-from-bottom-2 fade-in">
                          <span className="font-bold text-green-400 text-xs">{c.user}:</span>
                          <span className="text-gray-200 text-sm bg-gray-800/50 px-2 py-1 rounded-lg">{c.msg}</span>
                      </div>
                  ))}
              </div>

              {/* Controls */}
              <div className="z-10 bg-gray-800/80 backdrop-blur p-2 rounded-2xl flex gap-2">
                  <form onSubmit={sendChat} className="flex-1 flex gap-2">
                    <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} className="bg-transparent text-white text-sm flex-1 px-3 focus:outline-none" placeholder="Kirim pesan..." />
                    <button className="bg-green-600 p-2 rounded-xl text-xs font-bold">Kirim 🚀</button>
                  </form>
                  <button className="bg-gray-700 p-2 rounded-xl" title="Mic (Coming Soon)">🎙️</button>
              </div>

              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full filter blur-[100px] opacity-20 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-600 rounded-full filter blur-[100px] opacity-20 pointer-events-none"></div>
          </div>
      );
  }

  // --- TAMPILAN LOBBY ---
  return (
    <div className="space-y-6">
        <div className="flex justify-between items-end">
            <div>
                <h2 className="text-2xl font-black text-gray-800">Space 🎙️</h2>
                <p className="text-gray-500 text-sm">Dengarkan diskusi live atau buat ruangmu sendiri.</p>
            </div>
            <button onClick={() => setIsCreating(!isCreating)} className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-black transition">
                {isCreating ? "Batal" : "+ Buat Space"}
            </button>
        </div>

        {isCreating && (
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-lg animate-in slide-in-from-top-4">
                <label className="text-xs font-bold text-gray-500 uppercase">Topik Diskusi</label>
                <input autoFocus type="text" value={topic} onChange={e=>setTopic(e.target.value)} className="w-full text-lg font-bold border-b-2 border-green-500 focus:outline-none py-2 mb-4" placeholder="Mau bahas apa hari ini?" />
                <button onClick={createRoom} className="w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600">Mulai Space Sekarang 📡</button>
            </div>
        )}

        <div className="grid gap-4">
            {rooms.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <div className="text-4xl mb-2">🔇</div>
                    Belum ada Space yang aktif.<br/>Jadilah yang pertama!
                </div>
            ) : (
                rooms.map(room => (
                    <div key={room.id} className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden group hover:scale-[1.02] transition cursor-pointer" onClick={() => setActiveRoom(room)}>
                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded animate-pulse">LIVE</span>
                                    <span className="text-xs text-gray-400">Host: @{room.host}</span>
                                </div>
                                <h3 className="text-lg font-bold">{room.title}</h3>
                            </div>
                            <div className="bg-white/10 p-2 rounded-full">
                                <span className="text-2xl">🔊</span>
                            </div>
                        </div>
                        {/* Avatar Bubbles */}
                        <div className="mt-4 flex -space-x-2">
                             <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${room.host}`} className="w-8 h-8 rounded-full border-2 border-gray-800 bg-gray-200" />
                             <div className="w-8 h-8 rounded-full border-2 border-gray-800 bg-gray-700 flex items-center justify-center text-[10px] font-bold">+</div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
}