"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Auth({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (isSignUp) {
      // SIGN UP LOKAL (Simpan ke tabel 'users' sendiri)
      // 1. Cek username kembar
      const { data: existingUser } = await supabase.from('users').select('username').eq('username', username).single();
      if (existingUser) { alert("Username sudah dipakai, cari yang lain ya!"); setLoading(false); return; }
      
      // 2. Masukkan data baru
      const { error } = await supabase.from('users').insert([{ username, password }]); // Password plaintext (HANYA UNTUK DEMO/BETA)
      if (error) { alert(error.message); } else { alert("Akun berhasil dibuat! Silakan login."); setIsSignUp(false); }
    } else {
      // LOGIN LOKAL (Cek ke tabel 'users')
      const { data, error } = await supabase.from('users').select('*').eq('username', username).eq('password', password).single();
      if (error || !data) { alert("Username atau password salah!"); } 
      else { 
        // Cek apakah dia superadmin (hardcoded sementara)
        if (username === 'superadmin' && password === 'admin123') {
            onLoginSuccess('superadmin');
        } else {
            onLoginSuccess(data.username); 
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 px-4 py-12 overflow-hidden relative">
      {/* Hiasan Background Blur */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      
      {/* Card Utama dengan Efek Glassmorphism */}
      <div className="relative bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-xl border border-white/40 w-full max-w-[420px] transition-all duration-500 hover:shadow-2xl">
        <div className="text-center mb-8">
          {/* Logo Pear dengan Animasi Halus */}
          <div className="inline-block p-3 rounded-full bg-green-50 mb-3 shadow-sm animate-bounce-slow">
             <span className="text-5xl drop-shadow-sm">🍐</span>
          </div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight mb-2">Pear</h1>
          
          {/* --- TAGLINE BARU YANG LEBIH ELEGAN & UNIVERSAL --- */}
          <p className="text-gray-500 text-sm font-medium leading-relaxed">
            Your Exclusive Space for <br className="hidden md:block"/> Meaningful Connections.
          </p>
          {/* -------------------------------------------------- */}
          
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-4">
            {/* Input Username yang Lebih Bersih */}
            <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Username"
                  className="w-full px-4 py-3.5 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-800 placeholder-gray-400 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all duration-300 outline-none text-sm font-medium"
                  value={username} 
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} 
                  required 
                />
                 <span className="absolute right-4 top-3.5 text-gray-400 opacity-50 group-focus-within:opacity-100 transition">👤</span>
            </div>

            {/* Input Password yang Lebih Bersih */}
            <div className="relative group">
                <input 
                  type="password" 
                  placeholder="Password"
                  className="w-full px-4 py-3.5 rounded-xl bg-gray-50/80 border border-gray-200 text-gray-800 placeholder-gray-400 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all duration-300 outline-none text-sm font-medium"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <span className="absolute right-4 top-3.5 text-gray-400 opacity-50 group-focus-within:opacity-100 transition">🔒</span>
            </div>
          </div>
          
          {!isSignUp && (
            <div className="text-right">
                <button type="button" className="text-xs font-bold text-green-600 hover:text-green-700 hover:underline transition">Lupa Kata Sandi?</button>
            </div>
          )}

          {/* Tombol Modern dengan Gradasi & Shadow */}
          <button 
            disabled={loading} 
            className="w-full py-3.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold text-[15px] shadow-lg shadow-green-500/30 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Memproses...
              </>
            ) : (isSignUp ? "Buat Akun Baru ✨" : "Masuk ke Pear 🚪")}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-500 font-medium">
          {isSignUp ? "Sudah punya akun warga?" : "Belum jadi warga?"} 
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-green-600 font-bold hover:underline ml-1 transition">
            {isSignUp ? "Login aja" : "Bikin akun baru"}
          </button>
        </div>
      </div>
      
      {/* Footer Kecil */}
      <div className="absolute bottom-4 text-center text-xs text-gray-400 font-medium">
        © 2024 Pear App. All rights reserved.
      </div>
    </div>
  );
}