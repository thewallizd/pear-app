"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { BookUser, MessageCircle } from "lucide-react"; // Ganti Emoji dengan Ikon Keren

export default function BukuWarga({ myName, onlineUsers, onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      // Ambil user limit 50 biar ringan
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .neq("username", myName) 
        .limit(50); 

      if (data) {
        setUsers(data.map(u => u.username));
      }
      setLoading(false);
    };

    fetchUsers();
  }, [myName]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm animate-in fade-in transition-colors">
      
      {/* HEADER: Ganti Emoji dengan Lucide */}
      <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <BookUser size={20} className="text-blue-500" /> 
        <span>Buku Warga</span>
      </h3>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
        {loading ? (
            <div className="text-center text-xs text-gray-400 dark:text-slate-500 py-4">Memuat warga...</div>
        ) : users.length === 0 ? (
            <div className="text-center text-xs text-gray-400 dark:text-slate-500 py-4">Belum ada tetangga lain.</div>
        ) : (
            users.map((friend) => {
                const isOnline = onlineUsers.has(friend);
                return (
                    <div 
                        key={friend} 
                        onClick={() => onSelectUser(friend)}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition group"
                    >
                        <div className="relative">
                            <img 
                                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${friend}`} 
                                className="w-10 h-10 rounded-full border border-gray-100 dark:border-slate-600 bg-white dark:bg-slate-600"
                            />
                            {/* Status Dot */}
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${isOnline ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-500'}`}></div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-700 dark:text-slate-200 group-hover:text-green-600 dark:group-hover:text-green-400 transition truncate">@{friend}</p>
                            <p className={`text-[10px] ${isOnline ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400 dark:text-slate-500"}`}>
                                {isOnline ? "Online" : "Offline"}
                            </p>
                        </div>

                        {/* Tombol Chat Kecil */}
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-slate-300 group-hover:bg-blue-500 group-hover:text-white transition">
                            <MessageCircle size={14} />
                        </button>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
}