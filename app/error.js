'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react'; // Pakai Ikon Keren

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 p-6 text-center transition-colors">
      
      {/* Ikon Error dengan Efek Glow Merah */}
      <div className="mb-6 relative">
         <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full"></div>
         <AlertTriangle size={80} className="text-red-500 relative z-10 animate-pulse" />
      </div>

      <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-3">
        Ups, Ada Masalah Teknis!
      </h2>
      
      <p className="text-gray-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
        Sistem kami sedikit tersedak biji pir. Jangan khawatir, ini bukan salahmu.
      </p>

      {/* Menampilkan Pesan Error (Opsional, untuk debugging) */}
      <div className="mb-8 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-sm mx-auto">
        <p className="text-xs font-mono text-red-600 dark:text-red-400 break-words">
            {error.message || "Unknown Error Occurred"}
        </p>
      </div>

      <button
        onClick={reset}
        className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:scale-105 active:scale-95 transition shadow-lg"
      >
        <RefreshCcw size={20} /> Coba Refresh
      </button>
    </div>
  );
}