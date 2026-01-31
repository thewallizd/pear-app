"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function BukuWarga({ myName, onlineUsers, onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      // Ambil semua user yang sudah pernah login (dari tabel profiles)
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .neq("username", myName) // Jangan ambil nama sendiri
        .limit(50); // Batasi 50 user dulu biar ringan

      if (data) {
        setUsers(data.map(u => u.username));
      }
      setLoading(false);
    };

    fetchUsers();
  }, [myName]);

  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm animate-in fade-in">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>📒</span> Buku Warga
      </h3>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
        {loading ? (
            <div className="text-center text-xs text-gray-400 py-4">Memuat warga...</div>
        ) : users.length === 0 ? (
            <div className="text-center text-xs text-gray-400 py-4">Belum ada tetangga lain.</div>
        ) : (
            users.map((friend) => {
                const isOnline = onlineUsers.has(friend);
                return (
                    <div 
                        key={friend} 
                        onClick={() => onSelectUser(friend)}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition group"
                    >
                        <div className="relative">
                            <img 
                                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${friend}`} 
                                className="w-10 h-10 rounded-full border border-gray-100 bg-white"
                            />
                            {/* Status Dot (Hijau kalau online) */}
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        </div>
                        
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-700 group-hover:text-green-600 transition">@{friend}</p>
                            <p className="text-[10px] text-gray-400">
                                {isOnline ? "Sedang Online" : "Offline"}
                            </p>
                        </div>

                        <button className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full group-hover:bg-green-500 group-hover:text-white transition">
                            Chat
                        </button>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
}