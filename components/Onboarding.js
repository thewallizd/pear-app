"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Onboarding({ myName, onFinish }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    // Update database: User ini sudah selesai onboarding
    await supabase.from("users").update({ has_onboarded: true }).eq("username", myName);
    setLoading(false);
    onFinish(); // Tutup modal di parent
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
        
        {/* Progress Bar Atas */}
        <div className="h-1.5 bg-gray-100 w-full flex">
          <div className={`h-full bg-green-500 transition-all duration-500 ${step === 1 ? 'w-1/4' : step === 2 ? 'w-2/4' : step === 3 ? 'w-3/4' : 'w-full'}`}></div>
        </div>

        <div className="p-8 text-center">
          
          {/* STEP 1: KEBIJAKAN PENGGUNA */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-6xl mb-2">🍐</div>
              <h2 className="text-2xl font-black text-gray-800">Selamat Datang!</h2>
              <p className="text-gray-500 text-sm">Hai <span className="font-bold text-green-600">@{myName}</span>, selamat bergabung di Pear. Sebelum lanjut, baca aturan warga dulu ya.</p>
              
              <div className="bg-gray-50 p-4 rounded-xl text-left h-48 overflow-y-auto border border-gray-100 text-xs text-gray-600 space-y-2 custom-scrollbar">
                <p className="font-bold text-gray-800">1. Kebijakan Konten</p>
                <p>Dilarang memposting konten SARA, pornografi, ujaran kebencian, atau spam. Jagalah kenyamanan sesama warga.</p>
                
                <p className="font-bold text-gray-800">2. Etika Chatting</p>
                <p>Gunakan fitur chat dan telepon dengan sopan. Dilarang melakukan pelecehan atau penipuan.</p>
                
                <p className="font-bold text-gray-800">3. Privasi</p>
                <p>Data kamu aman, tapi hati-hati membagikan info pribadi (alamat/no hp) di ruang publik.</p>
                
                <p className="font-bold text-gray-800">4. Wewenang Admin</p>
                <p>Superadmin berhak menghapus konten atau memblokir akun yang melanggar aturan tanpa peringatan.</p>
              </div>

              <button onClick={() => setStep(2)} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition">
                Saya Setuju & Lanjut ➤
              </button>
            </div>
          )}

          {/* STEP 2: FITUR FEED */}
          {step === 2 && (
            <div className="space-y-6 py-4">
              <div className="text-8xl animate-bounce">📢</div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Suarakan Pikiranmu</h2>
                <p className="text-gray-500 text-sm mt-2">
                  Kamu bisa posting tulisan, review bintang ⭐, atau sekadar "Nyeletuk". 
                  Jangan lupa kasih <strong>Vote</strong> ke postingan warga lain biar Aura-mu naik! ✨
                </p>
              </div>
              <button onClick={() => setStep(3)} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">
                Oke, Paham!
              </button>
            </div>
          )}

          {/* STEP 3: FITUR CHAT & CALL */}
          {step === 3 && (
            <div className="space-y-6 py-4">
              <div className="text-8xl animate-pulse">📞</div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Nongkrong Virtual</h2>
                <p className="text-gray-500 text-sm mt-2">
                  Bisa chat personal, bikin grup komunitas, atau gabung di Global Chat. 
                  Sekarang juga udah bisa <strong>Telponan Gratis</strong> lho! 
                </p>
              </div>
              <button onClick={() => setStep(4)} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition">
                Wih, Keren!
              </button>
            </div>
          )}

          {/* STEP 4: SIAP */}
          {step === 4 && (
            <div className="space-y-6 py-4">
              <div className="text-8xl">🚀</div>
              <div>
                <h2 className="text-2xl font-black text-gray-800">Siap Menjelajah?</h2>
                <p className="text-gray-500 text-sm mt-2">
                  Profilmu sudah dibuat dengan gaya unik. Jadilah warga yang asik dan dapatkan lencana eksklusif!
                </p>
              </div>
              <button onClick={handleFinish} disabled={loading} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition">
                {loading ? "Menyiapkan..." : "Gas Masuk! 🍐"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}