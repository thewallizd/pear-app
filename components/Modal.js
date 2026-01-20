"use client";

export default function Modal({ isOpen, onClose, title, message, type = "success", onConfirm }) {
  if (!isOpen) return null;

  // Tentukan Warna & Ikon berdasarkan Tipe
  let colorClass = "text-green-600 bg-green-100";
  let icon = "✅";
  let btnClass = "bg-green-600 hover:bg-green-700";

  if (type === "error") {
    colorClass = "text-red-600 bg-red-100";
    icon = "⚠️";
    btnClass = "bg-red-600 hover:bg-red-700";
  } else if (type === "confirm") {
    colorClass = "text-yellow-600 bg-yellow-100";
    icon = "🤔";
    btnClass = "bg-yellow-600 hover:bg-yellow-700";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity animate-in fade-in duration-200">
      
      {/* KOTAK MODAL */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100">
        
        {/* IKON */}
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 ${colorClass}`}>
          {icon}
        </div>

        {/* TEXT */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-black text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
        </div>

        {/* TOMBOL AKSI */}
        <div className="flex gap-3 justify-center">
          {type === "confirm" ? (
            <>
              <button 
                onClick={onClose} 
                className="px-5 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition text-sm"
              >
                Batal
              </button>
              <button 
                onClick={() => { onConfirm(); onClose(); }} 
                className={`px-6 py-2.5 rounded-xl text-white font-bold shadow-lg shadow-gray-200 transition transform active:scale-95 text-sm ${btnClass}`}
              >
                Ya, Lanjutkan
              </button>
            </>
          ) : (
            <button 
              onClick={onClose} 
              className={`w-full py-3 rounded-xl text-white font-bold shadow-lg shadow-gray-200 transition transform active:scale-95 ${btnClass}`}
            >
              Oke, Mengerti
            </button>
          )}
        </div>

      </div>
    </div>
  );
}