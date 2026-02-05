"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatDistanceToNow } from "date-fns";
import { id as indonesia } from "date-fns/locale";
import { Heart, MessageCircle, UserPlus, Bell, Loader2 } from "lucide-react"; // Import Ikon Lucide

export default function NotificationList({ myName }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("my_notifications_list")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient=eq.${myName}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
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
      .limit(20);

    if (data) setNotifications(data);
    setLoading(false);
  };

  const markAsRead = async (id) => {
    // Optimistic Update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    // Update DB
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  // Helper Ikon Lucide
  const getNotifIcon = (type) => {
    switch (type) {
      case "like":
        return <Heart size={14} className="text-red-500 fill-red-500" />;
      case "comment":
        return <MessageCircle size={14} className="text-blue-500 fill-blue-500" />;
      case "follow":
        return <UserPlus size={14} className="text-green-500 fill-green-500" />;
      default:
        return <Bell size={14} className="text-gray-500" />;
    }
  };

  const getNotifText = (notif) => {
      switch (notif.type) {
        case "like": return `menyukai postinganmu`;
        case "comment": return `mengomentari postinganmu`;
        case "follow": return `mulai mengikuti kamu`;
        default: return "ada notifikasi baru";
      }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm h-fit sticky top-24 animate-in fade-in transition-colors">
      <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Bell size={20} className="text-orange-500" /> Aktivitas
      </h3>

      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="text-center text-xs text-gray-400 dark:text-slate-500 py-4 flex flex-col items-center gap-2">
             <Loader2 size={20} className="animate-spin" />
             <span>Memuat...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-xs text-gray-400 dark:text-slate-500 py-4">
            Belum ada aktivitas. Sepi nih.
          </div>
        ) : (
          notifications.map((notif) => {
            return (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`flex gap-3 p-3 rounded-xl transition cursor-pointer border ${
                  notif.is_read
                    ? "bg-transparent border-transparent opacity-60 hover:bg-gray-50 dark:hover:bg-slate-700"
                    : "bg-blue-50 dark:bg-slate-700/50 border-blue-100 dark:border-slate-600"
                }`}
              >
                <div className="relative">
                  <img
                    src={`https://api.dicebear.com/9.x/notionists/svg?seed=${notif.actor}`}
                    className="w-9 h-9 rounded-full bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500"
                  />
                  {/* Ikon Tipe Notifikasi */}
                  <span className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5 shadow-sm">
                    {getNotifIcon(notif.type)}
                  </span>
                </div>
                
                <div className="flex-1">
                  <p className="text-xs text-gray-700 dark:text-slate-200 leading-snug">
                    <span className="font-bold">@{notif.actor}</span> {getNotifText(notif)}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: indonesia })}
                  </p>
                </div>

                {!notif.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 shrink-0"></div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}