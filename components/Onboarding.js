"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Onboarding({ onFinish }) {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    // Validasi: Gak boleh kosong, gak boleh ada spasi, harus huruf kecil
    const cleanUsername = username.trim().toLowerCase().replace(/\s/g, '');
    
    if (!cleanUsername || cleanUsername.length < 3) {
        alert("Username minimal 3 karakter & tanpa spasi ya! 🙏");
        return;
    }

    setIsLoading(true);

    try {
        // 1. Simpan user ke tabel 'profiles' (Auto Register)
        // Kita pakai 'upsert': Kalau belum ada dibuatkan, kalau sudah ada biarkan.
        const { error } = await supabase.from("profiles").upsert(
            { username: cleanUsername }, 
            { onConflict: "username" } // Abaikan error kalau username sudah ada
        );

        if (error) throw error;

        // 2. Simpan ke LocalStorage biar gak login-login terus kalau refresh
        localStorage.setItem("pear_username", cleanUsername);

        // 3. Masuk ke Aplikasi
        onFinish(cleanUsername);

    } catch (error) {
        console.error("Login error:", error);
        alert("Gagal masuk. Coba lagi ya.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-cyan-500 to-blue-600 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Dekorasi Background Bergerak */}
      <div className="absolute top-10 left-10 text-9xl opacity-20 animate-bounce delay-1000">🍐</div>
      <div className="absolute bottom-20 right-10 text-8xl opacity-20 animate-bounce">🌍</div>
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-pulse"></div>

      {/* Kartu Login Kaca (Glassmorphism) */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-500">
        
        <div className="text-center mb-8">
            <h1 className="text-5xl mb-2">🍐</h1>
            <h2 className="text-3xl font-black text-white tracking-tight">Pear App</h2>
            <p className="text-blue-50 text-sm mt-2 opacity-90">
                Tempat nongkrong digital paling asik se-Indonesia.
                <br/>Chat, Diskusi, dan Siaran Radio bareng teman.
            </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-blue-50 mb-2 ml-1 uppercase tracking-wider">
                    Siapa nama panggilanmu?
                </label>
                <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/20 border border-white/30 rounded-2xl px-5 py-4 text-white placeholder-white/50 font-bold text-lg focus:outline-none focus:ring-4 focus:ring-white/30 focus:bg-white/30 transition text-center"
                    placeholder="Contoh: raka"
                    autoFocus
                />
            </div>

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-blue-50 hover:scale-[1.02] active:scale-95 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoading ? "Menyiapkan Pesawat... 🚀" : "Masuk Sekarang ➤"}
            </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-[10px] text-blue-100 opacity-60">
                v2.0 Professional Edition • Built with Next.js & Supabase
            </p>
        </div>

      </div>
    </div>
  );
}