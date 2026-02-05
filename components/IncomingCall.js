"use client";
import { Phone, PhoneOff } from "lucide-react"; // Import Ikon Lucide

export default function IncomingCall({ caller, onAnswer, onReject }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
      
      {/* Background Gradient (Lebih aman daripada gambar eksternal) */}
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Avatar + Efek Ping */}
        <div className="relative mb-8">
            <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>
            <img 
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${caller}`} 
                className="w-32 h-32 rounded-full border-4 border-white/20 bg-gray-800 relative z-10 shadow-2xl"
                alt="Caller"
            />
        </div>

        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">@{caller}</h2>
        <p className="text-green-400 font-bold animate-pulse mb-16 tracking-widest text-sm uppercase">Panggilan Masuk...</p>

        <div className="flex gap-16 items-center">
            {/* Tombol Tolak */}
            <button 
                onClick={onReject}
                className="flex flex-col items-center gap-3 group"
            >
                <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-xl shadow-red-500/30 group-hover:scale-110 transition duration-300">
                    <PhoneOff size={28} />
                </div>
                <span className="text-white/70 text-xs font-bold tracking-widest uppercase group-hover:text-white transition">Tolak</span>
            </button>

            {/* Tombol Terima */}
            <button 
                onClick={onAnswer}
                className="flex flex-col items-center gap-3 group"
            >
                <div className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-xl shadow-green-500/50 group-hover:scale-110 transition duration-300 animate-bounce">
                    <Phone size={36} fill="currentColor" />
                </div>
                <span className="text-white/70 text-xs font-bold tracking-widest uppercase group-hover:text-white transition">Angkat</span>
            </button>
        </div>
      </div>
    </div>
  );
}