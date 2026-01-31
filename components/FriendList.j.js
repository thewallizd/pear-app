"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function FriendList({ myName, onSelectUser, onlineUsers }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCommunity = async () => {
      // CARA CERDAS: Cari user aktif berdasarkan siapa yang pernah posting
      // (Karena sistem login kita simpel, tidak ada tabel 'all_users' yang pasti lengkap)
      const { data } = await supabase
        .from("posts")
        .select("author")
        .order("created_at", { ascending: false });

      if (data) {
        // Ambil nama unik saja (Hapus duplikat)
        const uniqueNames = [...new Set(data.map(item => item.author))];
        
        // Buang nama sendiri dari daftar
        const friends = uniqueNames.filter(name => name !== myName);
        setUsers(friends);
      }
      setLoading(false);
    };

    fetchCommunity();
  }, [myName]);

  // Filter pencarian
  const filteredUsers = users.filter(u => u.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm h-fit sticky top-24 animate-in fade-in">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>📖</span> Buku Warga
      </h3>

      {/* Kolom Pencarian */}
      <div className="mb-4 relative">
        <input 
            type="text" 
            placeholder="Cari teman..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-100 transition pl-9"
        />
        <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
      </div>

      {/* Daftar User */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
        {loading ? (
            <div className="text-center text-xs text-gray-400 py-4">Memuat warga...</div>
        ) : filteredUsers.length === 0 ? (
            <div className="text-center text-xs text-gray-400 py-4">Tidak ditemukan.</div>
        ) : (
            filteredUsers.map((user) => {
                const isOnline = onlineUsers && onlineUsers.has(user);
                
                return (
                    <div key={user} className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-xl transition cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img 
                                    src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user}`} 
                                    className="w-10 h-10 rounded-full border border-gray-100 bg-white"
                                />
                                {isOnline && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" title="Sedang Online"></span>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-700">@{user}</span>
                                <span className="text-[10px] text-gray-400">
                                    {isOnline ? "Online Sekarang" : "Warga Pear"}
                                </span>
                            </div>
                        </div>

                        {/* Tombol Chat (Muncul saat di-hover) */}
                        <button 
                            onClick={() => onSelectUser(user)}
                            className="bg-green-100 text-green-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition transform hover:scale-110 shadow-sm"
                            title="Kirim Pesan"
                        >
                            💬
                        </button>
                    </div>
                );
            })
        )}
      </div>

      {/* Footer Kecil */}
      <div className="mt-4 pt-4 border-t border-gray-50 text-center">
        <p className="text-[10px] text-gray-400">
            Total {users.length} warga terdaftar di Pear.
        </p>
      </div>
    </div>
  );
}