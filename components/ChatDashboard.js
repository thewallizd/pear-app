"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Modal from "@/components/Modal";

export default function ChatDashboard({ myName, onSelectChat, onOpenGlobal, onSelectGroup, onlineUsers }) {
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Buat Grup
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  const fetchData = async () => {
    // 1. Ambil User (Teman)
    const { data: userData } = await supabase.from("users").select("username").neq("username", myName);
    if (userData) setFriends(userData);

    // 2. Ambil Grup
    const { data: groupData } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
    if (groupData) setGroups(groupData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [myName]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return alert("Nama grup wajib diisi!");
    
    const { error } = await supabase.from("groups").insert([{
      name: newGroupName,
      description: newGroupDesc || "Grup komunitas seru",
      created_by: myName,
      avatar_seed: newGroupName.replace(/\s/g, '') // Seed avatar dari nama grup
    }]);

    if (!error) {
      setShowCreateModal(false);
      setNewGroupName("");
      setNewGroupDesc("");
      fetchData(); // Refresh list
      alert("Grup berhasil dibuat! 🎉");
    } else {
      alert("Gagal membuat grup.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* GLOBAL CHAT CARD */}
      <div 
        onClick={onOpenGlobal}
        className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-2xl shadow-md cursor-pointer hover:shadow-lg transition transform hover:-translate-y-1 relative overflow-hidden group"
      >
        <div className="absolute right-0 top-0 opacity-10 text-6xl group-hover:scale-110 transition">🌍</div>
        <h3 className="text-white font-bold text-lg flex items-center gap-2">Global Chat 💬</h3>
        <p className="text-green-100 text-xs">Ngobrol bareng semua warga Pear</p>
      </div>

      {/* --- SEKSI GRUP KOMUNITAS --- */}
      <div>
        <div className="flex items-center justify-between mb-2">
           <h3 className="font-bold text-gray-700 text-sm">Grup Komunitas</h3>
           <button onClick={() => setShowCreateModal(true)} className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-1 rounded-lg hover:bg-blue-100 transition">+ Buat Grup</button>
        </div>

        <div className="grid grid-cols-1 gap-2">
            {groups.length === 0 ? <div className="text-gray-400 text-xs italic">Belum ada grup. Bikin dong!</div> : 
             groups.map(group => (
               <div key={group.id} onClick={() => onSelectGroup(group)} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition">
                  <img src={`https://api.dicebear.com/9.x/initials/svg?seed=${group.avatar_seed}&backgroundColor=b6e3f4`} className="w-10 h-10 rounded-xl bg-gray-100"/>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-gray-800 truncate">{group.name}</h4>
                    <p className="text-[10px] text-gray-500 truncate">{group.description}</p>
                  </div>
                  <span className="text-gray-300">➜</span>
               </div>
             ))
            }
        </div>
      </div>

      {/* --- SEKSI WARGA (TEMAN) --- */}
      <div>
        <h3 className="font-bold text-gray-700 text-sm mb-2">Warga Lainnya</h3>
        {loading ? (
            <div className="text-center text-gray-400 py-10">Loading warga...</div>
        ) : (
            <div className="space-y-2">
            {friends.map((friend) => {
                const isOnline = onlineUsers && onlineUsers.has(friend.username);
                return (
                <div key={friend.username} onClick={() => onSelectChat(friend.username)} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-green-50 hover:border-green-200 transition group">
                    <div className="flex items-center gap-3">
                    <div className="relative">
                        <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${friend.username}&radius=50`} className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200"/>
                        {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-gray-800">@{friend.username}</h4>
                        <p className={`text-[10px] ${isOnline ? 'text-green-600 font-bold' : 'text-gray-400'}`}>{isOnline ? 'Sedang Online' : 'Offline'}</p>
                    </div>
                    </div>
                    <span className="text-gray-300 group-hover:text-green-600 transition">💬</span>
                </div>
                );
            })}
            </div>
        )}
      </div>

      {/* --- MODAL BUAT GRUP MANUAL (SEDERHANA) --- */}
      {showCreateModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95">
               <h3 className="text-lg font-bold text-gray-800 mb-4">Buat Grup Baru ✨</h3>
               <input type="text" placeholder="Nama Grup (Wajib)" className="w-full mb-3 p-2 rounded-lg border text-sm" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
               <input type="text" placeholder="Deskripsi Singkat" className="w-full mb-4 p-2 rounded-lg border text-sm" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} />
               <div className="flex justify-end gap-2">
                  <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
                  <button onClick={handleCreateGroup} className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700">Buat Grup</button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}