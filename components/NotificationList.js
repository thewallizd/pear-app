"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import TimeAgo from "./TimeAgo"; // Pakai komponen waktu pintar kita

export default function NotificationList({ myName }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    // Realtime Listener: Kalau ada notif baru, langsung muncul
    const channel = supabase
      .channel("my_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient=eq.${myName}`, // Cuma dengar notif buat SAYA
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          // Optional: Mainkan suara ting
          new Audio(
            "https://cdn.freesound.org/previews/536/536108_11306637-lq.mp3",
          )
            .play()
            .catch(() => {});
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [myName]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient", myName)
      .order("created_at", { ascending: false })
      .limit(20); // Ambil 20 terakhir aja biar gak berat

    if (data) setNotifications(data);
    setLoading(false);
  };

  const markAsRead = async (id) => {
    // Update tampilan dulu (Optimistic)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    // Update DB
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  // Helper Ikon & Text
  const getNotifContent = (notif) => {
    switch (notif.type) {
      case "like":
        return {
          icon: "❤️",
          text: `menyukai postinganmu: "${notif.content || "..."}"`,
        };
      case "comment":
        return { icon: "💬", text: `mengomentari: "${notif.content}"` };
      case "follow":
        return { icon: "👤", text: `mulai mengikuti kamu` };
      default:
        return { icon: "🔔", text: "ada notifikasi baru" };
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm h-fit sticky top-24 animate-in fade-in">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>🔔</span> Aktivitas
      </h3>

      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="text-center text-xs text-gray-400 py-4">
            Memuat...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-4">
            Belum ada aktivitas. Sepi nih.
          </div>
        ) : (
          notifications.map((notif) => {
            const { icon, text } = getNotifContent(notif);
            return (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`flex gap-3 p-3 rounded-xl transition cursor-pointer ${notif.is_read ? "bg-white opacity-60" : "bg-blue-50 border border-blue-100"}`}
              >
                <div className="relative">
                  <img
                    src={`https://api.dicebear.com/9.x/notionists/svg?seed=${notif.actor}`}
                    className="w-8 h-8 rounded-full bg-white border border-gray-200"
                  />
                  <span className="absolute -bottom-1 -right-1 text-[10px]">
                    {icon}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-700 leading-snug">
                    <span className="font-bold">@{notif.actor}</span> {text}
                  </p>
                  <div className="mt-1">
                    <TimeAgo timestamp={notif.created_at} />
                  </div>
                </div>
                {!notif.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
