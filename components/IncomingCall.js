"use client";

export default function IncomingCall({ caller, onAnswer, onReject }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-8">
            <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>
            <img 
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${caller}`} 
                className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 relative z-10"
                alt="Caller"
            />
        </div>

        <h2 className="text-3xl font-black text-white mb-2 tracking-wide">@{caller}</h2>
        <p className="text-green-400 font-bold animate-pulse mb-12">📞 Memanggilmu...</p>

        <div className="flex gap-10 items-center">
            {/* Tombol Tolak */}
            <button 
                onClick={onReject}
                className="flex flex-col items-center gap-2 group"
            >
                <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-3xl shadow-lg shadow-red-500/50 group-hover:scale-110 transition">
                    ❌
                </div>
                <span className="text-white text-xs font-bold opacity-70">Tolak</span>
            </button>

            {/* Tombol Terima */}
            <button 
                onClick={onAnswer}
                className="flex flex-col items-center gap-2 group"
            >
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-4xl shadow-lg shadow-green-500/50 group-hover:scale-110 transition animate-bounce">
                    📞
                </div>
                <span className="text-white text-xs font-bold opacity-70">Angkat</span>
            </button>
        </div>
      </div>
    </div>
  );
}