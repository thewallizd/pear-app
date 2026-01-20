"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function NotificationList({ myName }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fungsi Refresh Data
  const fetchNotifs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient", myName)
      .order("created_at", { ascending: false });
    
    if (data) setNotifs(data);
    setLoading(false);
    
    // Tandai sudah dibaca
    if (data && data.length > 0) {
      await supabase.from("notifications").update({ is_read: true }).eq("recipient", myName);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [myName]);

  // --- LOGIKA TERIMA / TOLAK TEMAN ---
  const handleFriendResponse = async (senderName, action, notifId) => {
    if (action === 'accept') {
      // 1. Update status di tabel friends jadi 'accepted'
      await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('requester', senderName)
        .eq('receiver', myName);
      
      // 2. Kirim notif balik "Diterima"
      await supabase.from('notifications').insert([{
        recipient: senderName, sender: myName, type: 'info', message: `menerima pertemananmu! 🤝`
      }]);
      
      alert(`Sekarang kamu berteman dengan ${senderName}!`);
    } else {
      // Kalau tolak, hapus aja requestnya
      await supabase.from('friends').delete().eq('requester', senderName).eq('receiver', myName);
    }

    // 3. Hapus notifikasi ini biar bersih
    await supabase.from('notifications').delete().eq('id', notifId);
    fetchNotifs(); // Refresh list
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[50vh]">
      <div className="bg-red-500 p-6 text-white">
        <h2 className="text-xl font-bold mb-1">Notifikasi 🔔</h2>
        <p className="text-red-100 text-sm">Permintaan pertemanan & interaksi.</p>
      </div>

      <div className="p-4 space-y-2">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-4">Memuat...</p>
        ) : notifs.length === 0 ? (
          <div className="text-center py-8 text-gray-400 italic">Kosong melompong... 🍂</div>
        ) : (
          notifs.map((n) => (
            <div key={n.id} className={`p-3 rounded-xl flex flex-col gap-2 border ${n.is_read ? 'bg-white border-gray-100' : 'bg-red-50 border-red-100'}`}>
              <div className="flex gap-3 items-start">
                <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${n.sender}&radius=50`} className="w-10 h-10 rounded-full bg-white border border-gray-200"/>
                <div>
                  <p className="text-sm text-gray-800">
                    <span className="font-bold text-gray-900">{n.sender}</span> {n.message}
                  </p>
                  <span className="text-[10px] text-gray-400">
                    {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>

              {/* TOMBOL AKSI KHUSUS FRIEND REQUEST */}
              {n.type === 'friend_request' && (
                <div className="flex gap-2 ml-14">
                  <button 
                    onClick={() => handleFriendResponse(n.sender, 'accept', n.id)}
                    className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-green-700"
                  >
                    Terima ✅
                  </button>
                  <button 
                    onClick={() => handleFriendResponse(n.sender, 'reject', n.id)}
                    className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-gray-300"
                  >
                    Tolak ❌
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}