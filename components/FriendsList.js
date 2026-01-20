"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function FriendsList({ myName, onlineUsers, onVisitProfile, onChat }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      // Ambil semua user kecuali diri sendiri
      const { data } = await supabase.from("users").select("*").neq("username", myName);
      if (data) setUsers(data);
      setLoading(false);
    };

    fetchUsers();
  }, [myName]);

  // Filter pencarian teman
  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      
      {/* Header & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 sticky top-0 z-10">
        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          👥 Warga Pear <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">{users.length}</span>
        </h2>
        <input 
          type="text" 
          placeholder="Cari teman..." 
          className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-500 bg-gray-50 transition"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading data warga...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-10 text-gray-400">Tidak ditemukan.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredUsers.map((user) => {
            const isOnline = onlineUsers && onlineUsers.has(user.username);
            
            return (
              <div key={user.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col items-center text-center group relative overflow-hidden">
                
                {/* Banner Mini */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-r from-gray-50 to-gray-100 group-hover:from-green-50 group-hover:to-green-100 transition"></div>

                {/* Avatar */}
                <div 
                  className="relative z-10 cursor-pointer"
                  onClick={() => onVisitProfile(user.username)}
                >
                  <img 
                    src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user.username}&radius=50`} 
                    className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-sm transition transform group-hover:scale-110"
                  />
                  {/* Status Dot */}
                  <div 
                    className={`absolute bottom-1 right-1 w-4 h-4 border-2 border-white rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} 
                    title={isOnline ? "Online" : "Offline"}
                  ></div>
                </div>

                {/* Info */}
                <h3 
                  className="font-bold text-gray-800 mt-2 text-sm truncate w-full cursor-pointer hover:text-green-600 hover:underline"
                  onClick={() => onVisitProfile(user.username)}
                >
                  @{user.username}
                </h3>
                
                {/* Tombol Aksi */}
                <div className="mt-3 flex gap-2 w-full">
                  <button 
                    onClick={() => onVisitProfile(user.username)}
                    className="flex-1 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                  >
                    Profil
                  </button>
                  <button 
                    onClick={() => onChat(user.username)}
                    className="flex-1 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-bold hover:bg-green-600 hover:text-white transition"
                  >
                    Chat
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}