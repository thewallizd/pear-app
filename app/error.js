'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
      <div className="text-6xl mb-4">💥</div>
      <h2 className="text-2xl font-black text-gray-800 mb-2">Ups, Ada Gangguan Teknis!</h2>
      <p className="text-gray-500 mb-6">
        Sistem kami sedikit tersedak. Jangan khawatir, ini bukan salahmu.
      </p>
      <button
        onClick={reset}
        className="px-6 py-2 bg-gray-800 text-white rounded-lg font-bold hover:bg-black transition"
      >
        Coba Refresh 🔄
      </button>
    </div>
  );
}