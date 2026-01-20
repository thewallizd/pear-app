"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Modal from "@/components/Modal"; 

export default function Auth({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "success" });
  const closeModal = () => setModal({ ...modal, isOpen: false });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setModal({ isOpen: true, title: "Waduh!", message: "Isi dulu username & passwordnya, kawan! 🍐", type: "error" });
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        // --- LOGIKA DAFTAR ---
        const { data: existingUser } = await supabase.from("users").select("*").eq("username", username).single();
        if (existingUser) throw new Error("Yah, Username itu sudah dipakai. Cari yang lain ya!");

        // Insert User Baru (Tanpa mengatur avatar_style manual, biar default DB yang kerja)
        const { error: insertError } = await supabase.from("users").insert([{ username, password }]);
        
        if (insertError) throw insertError;

        setModal({ 
          isOpen: true, 
          title: "Berhasil Daftar! 🎉", 
          message: "Akunmu sudah jadi dengan avatar unik! Silakan login.", 
          type: "success" 
        });
        setIsRegister(false);

      } else {
        // --- LOGIKA LOGIN ---
        const { data, error } = await supabase.from("users").select("*").eq("username", username).eq("password", password).single();
        if (error || !data) throw new Error("Username atau Password salah. Coba ingat-ingat lagi! 🤔");

        onLoginSuccess(data.username);
      }
    } catch (err) {
      setModal({ isOpen: true, title: "Gagal Masuk", message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setModal({ isOpen: true, title: "Lupa Sandi?", message: "Silakan hubungi Admin (Developer) untuk mereset passwordmu secara manual. 🔧", type: "confirm" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Modal isOpen={modal.isOpen} onClose={closeModal} title={modal.title} message={modal.message} type={modal.type} onConfirm={closeModal} />

      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border border-green-100">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🍐</div>
          <h1 className="text-3xl font-bold text-gray-800">Pear</h1>
          <p className="text-gray-500 text-sm mt-1">Sirkel Eksklusif Warga Depok & Sekitarnya</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">Username</label>
            <input type="text" className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium focus:outline-none focus:border-green-500 transition" placeholder="Contoh: kanggabut99" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">Password</label>
            <input type="password" className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium focus:outline-none focus:border-green-500 transition" placeholder="Rahasia negara..." value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {!isRegister && (
            <div className="flex justify-end">
              <button type="button" onClick={handleForgotPassword} className="text-xs text-green-600 hover:text-green-800 font-bold hover:underline">Lupa Kata Sandi?</button>
            </div>
          )}
          <button disabled={loading} className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition transform active:scale-95 disabled:opacity-50 shadow-lg shadow-green-200">
            {loading ? "Sabar ya..." : isRegister ? "Daftar Sekarang 🚀" : "Masuk 🚪"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isRegister ? "Sudah punya akun?" : "Belum jadi warga?"}{" "}
          <button onClick={() => { setIsRegister(!isRegister); setUsername(""); setPassword(""); }} className="font-bold text-green-600 hover:underline">
            {isRegister ? "Login aja" : "Bikin akun baru"}
          </button>
        </div>
      </div>
    </div>
  );
}