"use client";
import { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, children }) {
  // 1. Logic: Tutup Modal kalau tekan tombol ESC di keyboard
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Kalau isOpen false, jangan tampilkan apa-apa
  if (!isOpen) return null;

  return (
    // Backdrop (Latar Belakang Gelap & Blur)
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose} // Klik di luar kotak = Tutup
    >
      {/* Kotak Modal (Putih & Rounded) */}
      <div
        className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-gray-100"
        onClick={(e) => e.stopPropagation()} // Supaya klik di dalam kotak TIDAK menutup modal
      >
        {/* Header Modal */}
        <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-2">
          {title && (
            <h3 className="text-lg font-black text-gray-800">{title}</h3>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Isi Modal (Children) */}
        <div className="text-gray-600 text-sm">{children}</div>
      </div>
    </div>
  );
}
