"use client";
import { useEffect } from "react";

export default function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    // Hilang otomatis setelah 3 detik
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  const bgColors = {
    info: "bg-gray-800",
    success: "bg-green-600",
    message: "bg-blue-600",
    alert: "bg-red-500"
  };

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-top-5 fade-in ${bgColors[type] || "bg-gray-800"}`}>
      <span className="text-xl">
        {type === 'message' ? '💬' : type === 'success' ? '✅' : '🔔'}
      </span>
      <p className="text-white text-sm font-bold">{message}</p>
      <button onClick={onClose} className="text-white/50 hover:text-white ml-2">✕</button>
    </div>
  );
}