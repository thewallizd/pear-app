'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; // Pastikan path ini benar
import { motion } from 'framer-motion';
import { Send, Sparkles, AlertCircle } from 'lucide-react';

export default function Home() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    // 1. Validasi Input
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage("Username minimal 3 huruf ya! 🍐");
      return;
    }

    setIsLoading(true);

    try {
      // 2. Cek apakah user sudah ada di database?
      const { data: existingUser, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', cleanUsername)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // Error koneksi atau database (bukan karena user tidak ketemu)
        throw fetchError;
      }

      if (existingUser) {
        // --- KONDISI LOGIN (User Ditemukan) ---
        console.log("User found, logging in...");
        localStorage.setItem('pear_username', existingUser.username); // Simpan sesi
        router.push('/dashboard');
      } else {
        // --- KONDISI REGISTER (User Baru) ---
        console.log("User not found, registering...");
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            { 
              username: cleanUsername, 
              full_name: username, // Pakai input asli sebagai nama awal
              avatar_url: `https://ui-avatars.com/api/?name=${cleanUsername}&background=random`,
              bio: "Warga baru di Pear App 🍐",
              is_online: true
            }
          ]);

        if (insertError) throw insertError;

        // Jika sukses register
        localStorage.setItem('pear_username', cleanUsername);
        router.push('/dashboard');
      }

    } catch (error) {
      console.error("Login Error:", error);
      setErrorMessage(error.message || "Gagal terhubung ke server. Coba lagi ya!");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-green-400 via-cyan-300 to-yellow-200 flex items-center justify-center font-sans">
      
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div animate={{ x: [0, 100, 0], y: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-10 left-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70" />
        <motion.div animate={{ x: [0, -100, 0], y: [0, 100, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} className="absolute top-0 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70" />
      </div>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md p-8 bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl mx-4"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div whileHover={{ rotate: 10, scale: 1.1 }} className="mb-4 p-4 bg-white rounded-2xl shadow-lg border-2 border-green-100">
             <span className="text-5xl">🍐</span> 
          </motion.div>
          <h1 className="text-4xl font-black text-gray-800 mb-1 drop-shadow-sm">PEAR APP</h1>
          <p className="text-gray-600 font-medium flex items-center gap-2">Komunitas Digital Seru <Sparkles size={16} className="text-yellow-600" /></p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2 border border-red-200 animate-pulse">
              <AlertCircle size={16} /> {errorMessage}
            </div>
          )}

          <input
            type="text"
            placeholder="Buat username unik..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-6 py-4 bg-white/60 border-2 border-white/50 rounded-2xl outline-none text-gray-800 placeholder-gray-500 font-semibold focus:bg-white focus:border-green-400 transition-all text-center text-lg shadow-inner"
          />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading || !username}
            type="submit"
            className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-2 transition-all
              ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/40'}
            `}
          >
            {isLoading ? "Memproses..." : <>Masuk / Daftar <Send size={20} /></>}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}