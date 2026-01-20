"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Auth({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false); // Toggle Login/Daftar
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Isi dulu username & passwordnya, kawan! 🍐");
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        // --- LOGIKA REGISTER ---
        
        // 1. Cek dulu apakah username sudah ada?
        const { data: existingUser } = await supabase
          .from("users")
          .select("*")
          .eq("username", username)
          .single();

        if (existingUser) {
          throw new Error("Yah, Username itu sudah dipakai orang lain. Cari yang lain ya!");
        }

        // 2. Kalau belum ada, simpan data baru
        const { error: insertError } = await supabase
          .from("users")
          .insert([{ username, password }]);

        if (insertError) throw insertError;

        alert("Pendaftaran berhasil! Silakan Login. 🎉");
        setIsRegister(false); // Pindah ke mode login otomatis

      } else {
        // --- LOGIKA LOGIN ---
        
        // Cek apakah kombinasi username & password cocok?
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("username", username)
          .eq("password", password) // *Catatan: Untuk production, harusnya pakai hash password
          .single();

        if (error || !data) {
          throw new Error("Username atau Password salah. Coba ingat-ingat lagi! 🤔");
        }

        // Login Sukses!
        onLoginSuccess(data.username);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border border-green-100">
        
        {/* LOGO & JUDUL */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🍐</div>
          <h1 className="text-3xl font-bold text-gray-800">Pear</h1>
          <p className="text-gray-500 text-sm mt-1">Sirkel Eksklusif Warga Depok & Sekitarnya</p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2 animate-pulse">
            ⚠️ {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">Username</label>
            <input
              type="text"
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-green-500 focus:bg-white transition"
              placeholder="Contoh: kanggabut99"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} // Huruf kecil & tanpa spasi
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">Password</label>
            <input
              type="password"
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-green-500 focus:bg-white transition"
              placeholder="Rahasia negara..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition transform active:scale-95 disabled:opacity-50 shadow-lg shadow-green-200"
          >
            {loading ? "Sabar ya..." : isRegister ? "Daftar Sekarang 🚀" : "Masuk 🚪"}
          </button>
        </form>

        {/* TOGGLE LOGIN / REGISTER */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {isRegister ? "Sudah punya akun?" : "Belum jadi warga?"}{" "}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setUsername("");
              setPassword("");
            }}
            className="font-bold text-green-600 hover:underline"
          >
            {isRegister ? "Login aja" : "Bikin akun baru"}
          </button>
        </div>

      </div>
    </div>
  );
}