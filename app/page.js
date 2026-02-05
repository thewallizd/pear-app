'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion'; // Untuk animasi smooth
import { Send, Users, Sparkles } from 'lucide-react'; // Ikon
import Image from 'next/image'; // Pastikan ada icon.png di folder public

export default function Home() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    // Simpan username ke localStorage (simulasi session sederhana)
    localStorage.setItem('pear_username', username);

    // Simulasi loading sebentar biar keren
    setTimeout(() => {
      router.push('/dashboard'); // Ganti dengan route tujuanmu (misal: /chat)
    }, 1500);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-green-400 via-cyan-300 to-yellow-200 flex items-center justify-center font-sans">
      
      {/* --- BACKGROUND DECORATION (Floating Blobs) --- */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 left-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
        />
        <motion.div 
          animate={{ x: [0, -100, 0], y: [0, 100, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
        />
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
        />
      </div>

      {/* --- FLOATING ICONS (Hiasan Pear) --- */}
      <FloatingIcon icon="🍐" delay={0} x={-200} y={-150} />
      <FloatingIcon icon="🍐" delay={2} x={250} y={100} />
      <FloatingIcon icon="✨" delay={1} x={-150} y={200} size={30} />
      <FloatingIcon icon="🍐" delay={3} x={300} y={-200} />

      {/* --- MAIN CARD (Glassmorphism) --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md p-8 bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl mx-4"
      >
        
        {/* LOGO AREA */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="mb-4 p-4 bg-white rounded-2xl shadow-lg border-2 border-green-100"
          >
             {/* Ganti src ini dengan path logo aslimu jika ada, atau pakai emoji dulu */}
             <span className="text-5xl">🍐</span> 
          </motion.div>
          
          <h1 className="text-4xl font-black tracking-tight text-gray-800 mb-1 drop-shadow-sm">
            PEAR APP
          </h1>
          <p className="text-gray-600 font-medium flex items-center gap-2">
            Komunitas Digital Seru-seruan <Sparkles size={16} className="text-yellow-600" />
          </p>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative group">
            <input
              type="text"
              placeholder="Ketik username kamu..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-6 py-4 bg-white/60 border-2 border-white/50 rounded-2xl outline-none text-gray-800 placeholder-gray-500 font-semibold focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-400/20 transition-all text-center text-lg shadow-inner"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading || !username}
            type="submit"
            className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-2 transition-all
              ${isLoading || !username 
                ? 'bg-gray-400 cursor-not-allowed opacity-70' 
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/40 hover:brightness-110'
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Masuk...
              </span>
            ) : (
              <>
                Lanjut <Send size={20} />
              </>
            )}
          </motion.button>
        </form>

        {/* FOOTER INFO */}
        <div className="mt-8 pt-6 border-t border-gray-200/30 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/30 rounded-full border border-white/40 shadow-sm">
            <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] overflow-hidden">
                   🎲
                </div>
              ))}
            </div>
            <span className="text-xs font-bold text-gray-700">120+ Warga Aktif</span>
          </div>
          
          <p className="text-xs text-gray-500 font-medium opacity-70">
            Made with ❤️ for Community
          </p>
        </div>

      </motion.div>
    </div>
  );
}

// Komponen Kecil untuk Ikon Melayang di Background
function FloatingIcon({ icon, delay, x, y, size = 40 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: y + 50 }}
      animate={{ 
        opacity: [0, 1, 1, 0], 
        y: [y + 50, y, y - 50],
        x: [x, x + 20, x] 
      }}
      transition={{ 
        duration: 8, 
        delay: delay, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
      className="absolute z-0 pointer-events-none text-4xl filter blur-[1px]"
      style={{ left: '50%', top: '50%', fontSize: size }}
    >
      {icon}
    </motion.div>
  );
}