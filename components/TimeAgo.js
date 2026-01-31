"use client";
import { useState, useEffect } from "react";

export default function TimeAgo({ timestamp }) {
  const [timeString, setTimeString] = useState("");

  useEffect(() => {
    // Fungsi pembantu menghitung selisih waktu
    const calculateTime = () => {
      if (!timestamp) return;

      const now = new Date();
      const past = new Date(timestamp);
      const diffInSeconds = Math.floor((now - past) / 1000);

      if (diffInSeconds < 30) {
        setTimeString("Baru saja");
      } else if (diffInSeconds < 60) {
        setTimeString(`${diffInSeconds} detik lalu`);
      } else if (diffInSeconds < 3600) {
        setTimeString(`${Math.floor(diffInSeconds / 60)} menit lalu`);
      } else if (diffInSeconds < 86400) {
        setTimeString(`${Math.floor(diffInSeconds / 3600)} jam lalu`);
      } else if (diffInSeconds < 604800) {
        // Kurang dari 7 hari
        setTimeString(`${Math.floor(diffInSeconds / 86400)} hari lalu`);
      } else {
        // Kalau sudah lama banget, tampilkan tanggal asli (misal: 12 Jan 2026)
        setTimeString(
          past.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        );
      }
    };

    calculateTime(); // Hitung langsung saat pertama muncul

    // Update otomatis setiap 60 detik (biar gak berat)
    const interval = setInterval(calculateTime, 60000);

    return () => clearInterval(interval); // Bersihkan memori saat komponen hilang
  }, [timestamp]);

  return (
    <span className="text-[10px] text-gray-400 font-medium">{timeString}</span>
  );
}
