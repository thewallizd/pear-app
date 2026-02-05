"use client";
import {
  X,
  Home,
  Bookmark,
  Settings,
  HelpCircle,
  LogOut,
  User,
} from "lucide-react"; // Ikon Baru

export default function MenuSidebar({
  isOpen,
  onClose,
  myName,
  onNavigate,
  onLogout,
}) {
  // Kalau sidebar tertutup, jangan render apa-apa biar ringan
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop Gelap (Klik untuk tutup) */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] animate-in fade-in"
      ></div>

      {/* Sidebar Content */}
      <div className="fixed top-0 left-0 h-full w-[280px] bg-white dark:bg-slate-900 shadow-2xl z-[100] p-6 flex flex-col animate-in slide-in-from-left duration-300">
        {/* Header Profil */}
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100 dark:border-slate-800">
          <div className="relative">
            <img
              src={`https://api.dicebear.com/9.x/notionists/svg?seed=${myName}`}
              className="w-14 h-14 rounded-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700"
            />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800 dark:text-white">
              @{myName}
            </h2>
            <p className="text-xs text-gray-400">Warga Teladan</p>
          </div>
          {/* Tombol Tutup X */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 dark:hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu Items */}
        <div className="space-y-2 flex-1">
          <button
            onClick={() => {
              onNavigate("profile");
              onClose();
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold transition"
          >
            <User size={20} /> Profil Saya
          </button>
          <button
            onClick={() => {
              onNavigate("bookmarks");
              onClose();
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold transition"
          >
            <Bookmark size={20} /> Markah
          </button>
          <button
            onClick={() => {
              onNavigate("settings");
              onClose();
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold transition"
          >
            <Settings size={20} /> Pengaturan
          </button>
          <button
            onClick={() => {
              onNavigate("help");
              onClose();
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold transition"
          >
            <HelpCircle size={20} /> Bantuan
          </button>
        </div>

        {/* Footer Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition mt-auto"
        >
          <LogOut size={20} /> Keluar Aplikasi
        </button>
      </div>
    </>
  );
}
