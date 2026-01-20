"use client";
import { useState, useEffect } from 'react';

export default function TimeAgo({ timestamp }) {
  const [timeText, setTimeText] = useState('');

  useEffect(() => {
    const updateTime = () => {
      if (!timestamp) return;
      
      const now = new Date();
      const time = new Date(timestamp);
      const diff = Math.floor((now - time) / 1000); // Selisih dalam detik

      if (diff < 10) {
        setTimeText('Baru saja');
      } else if (diff < 60) {
        setTimeText(`${diff} detik lalu`);
      } else if (diff < 3600) {
        setTimeText(`${Math.floor(diff / 60)} menit lalu`);
      } else if (diff < 86400) {
        setTimeText(`${Math.floor(diff / 3600)} jam lalu`);
      } else if (diff < 604800) {
        setTimeText(`${Math.floor(diff / 86400)} hari lalu`);
      } else {
        // Kalau lebih dari seminggu, tampilkan tanggal biasa
        setTimeText(time.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
      }
    };

    updateTime(); // Jalankan langsung
    const interval = setInterval(updateTime, 10000); // Update setiap 10 detik

    return () => clearInterval(interval); // Bersihkan timer saat komponen hilang
  }, [timestamp]);

  return <span>{timeText}</span>;
}