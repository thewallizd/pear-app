"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Onboarding({ onFinish }) {
  // View: 'menu', 'login', 'register'
  const [view, setView] = useState("menu"); 
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [recentUsers, setRecentUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const showError = (msg) => {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 4000);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .order("updated_at", { ascending: false }) 
      .limit(8);

    if (data) {
        // Filter username valid
        const unique = [...new Map(data.map(item => [item['username'], item])).values()];
        setRecentUsers(unique.filter(u => u.username && u.username.length > 2));
    }
    setIsLoadingUsers(false);
  };

  // --- LOGIC REGISTER ---
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return showError("⚠️ Isi semua kolom!");
    if (password.length < 3) return showError("⚠️ Password terlalu pendek!");

    setLoading(true);
    const cleanName = username.trim().toLowerCase().replace(/\s+/g, "");

    // 1. Cek apakah username sudah ada?
    const { data: existing } = await supabase.from("profiles").select("username").eq("username", cleanName).single();
    
    if (existing) {
        setLoading(false);
        return showError("❌ Username sudah dipakai orang lain!");
    }

    // 2. Buat User Baru
    const { error } = await supabase.from("profiles").insert({
        username: cleanName,
        password: password,
        updated_at: new Date()
    });

    if (!error) {
        loginSuccess(cleanName);
    } else {
        setLoading(false);
        console.error(error);
        showError("❌ Gagal daftar. Cek koneksi internet.");
    }
  };

  // --- LOGIC LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return showError("⚠️ Isi username & password!");

    setLoading(true);
    const cleanName = username.trim().toLowerCase().replace(/\s+/g, "");

    const { data, error } = await supabase.from("profiles").select("password").eq("username", cleanName).single();

    if (error || !data) {
        setLoading(false);
        return showError("❌ Akun tidak ditemukan. Daftar dulu yuk!");
    }

    if (data.password === password) {
        // Update waktu login terakhir
        await supabase.from("profiles").update({ updated_at: new Date() }).eq("username", cleanName);
        loginSuccess(cleanName);
    } else {
        setLoading(false);
        showError("⛔ Password Salah!");
    }
  };

  const loginSuccess = (name) => {
      localStorage.setItem("pear_username", name);
      setTimeout(() => onFinish(name), 500);
  };

  // Helper: Reset form saat ganti menu
  const switchView = (target) => {
      setErrorMsg("");
      setUsername("");
      setPassword("");
      setView(target);
  };

  // Helper: Pilih dari Quick Login
  const handleQuickLogin = (selectedName) => {
      setUsername(selectedName);
      setView("login"); // Langsung arahkan ke form login
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-sans relative overflow-hidden">
      
      {/* ERROR TOAST */}
      {errorMsg && (
          <div className="absolute top-10 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
              <div className="bg-red-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold text-sm">
                  <span>{errorMsg}</span>
              </div>
          </div>
      )}

      {/* CARD UTAMA */}
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-8 border border-white/50 animate-in zoom-in duration-300 relative z-10">
        
        {/* HEADER LOGO */}
        <div className="text-center mb-8">
            <div className="text-7xl mb-2 animate-bounce">🍐</div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">PEAR APP</h1>
            <p className="text-gray-400 text-sm font-medium mt-1">Komunitas Digital Seru-seruan</p>
        </div>

        {/* === VIEW 1: MENU UTAMA === */}
        {view === "menu" && (
            <div className="space-y-4 animate-in slide-in-from-left">
                <button 
                    onClick={() => switchView("login")}
                    className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold text-lg shadow-blue-200 shadow-lg hover:scale-[1.02] transition active:scale-95 flex items-center justify-between group"
                >
                    <span>🔑 Masuk Akun</span>
                    <span className="group-hover:translate-x-1 transition">➤</span>
                </button>

                <button 
                    onClick={() => switchView("register")}
                    className="w-full bg-white border-2 border-gray-100 text-gray-700 p-4 rounded-2xl font-bold text-lg hover:bg-gray-50 hover:border-gray-200 transition active:scale-95 flex items-center justify-between"
                >
                    <span>✨ Daftar Baru</span>
                    <span className="text-gray-300">+</span>
                </button>

                {/* Quick Login Grid */}
                <div className="pt-8 mt-4 border-t border-gray-100">
                    <p className="text-center text-xs font-bold text-gray-400 mb-4 tracking-widest">WARGA YANG SIBUK</p>
                    {isLoadingUsers ? <div className="text-center text-xs text-gray-300">Memuat...</div> : (
                        <div className="grid grid-cols-4 gap-4">
                            {recentUsers.map((user) => (
                                <button key={user.username} onClick={() => handleQuickLogin(user.username)} className="flex flex-col items-center gap-2 group cursor-pointer">
                                    <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user.username}`} className="w-12 h-12 rounded-full bg-gray-100 border-2 border-transparent group-hover:border-blue-500 transition shadow-sm"/>
                                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-blue-600 truncate w-full text-center">{user.username}</span>
                                </button>
                            ))}
                            {recentUsers.length === 0 && <p className="col-span-4 text-center text-xs text-gray-300">Belum ada warga aktif.</p>}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* === VIEW 2: LOGIN FORM === */}
        {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-5 animate-in slide-in-from-right">
                <div className="flex items-center gap-2 mb-2">
                    <button type="button" onClick={() => switchView("menu")} className="text-gray-400 hover:text-gray-800 text-sm font-bold">← Kembali</button>
                    <h2 className="text-xl font-black text-gray-800 ml-auto">Login 🔑</h2>
                </div>

                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-blue-500 rounded-xl py-3 px-5 font-bold outline-none transition"
                    autoFocus
                />

                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-blue-500 rounded-xl py-3 px-5 font-bold outline-none transition"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? "🙈" : "👁️"}
                    </button>
                </div>

                <button disabled={loading} className="w-full bg-blue-600 text-white rounded-xl py-4 font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50">
                    {loading ? "Memproses..." : "Masuk Sekarang"}
                </button>
                
                <p className="text-center text-xs text-gray-400 mt-4">
                    Belum punya akun? <button type="button" onClick={() => switchView("register")} className="text-blue-500 font-bold hover:underline">Daftar dulu</button>
                </p>
            </form>
        )}

        {/* === VIEW 3: REGISTER FORM === */}
        {view === "register" && (
            <form onSubmit={handleRegister} className="space-y-5 animate-in slide-in-from-right">
                <div className="flex items-center gap-2 mb-2">
                    <button type="button" onClick={() => switchView("menu")} className="text-gray-400 hover:text-gray-800 text-sm font-bold">← Kembali</button>
                    <h2 className="text-xl font-black text-gray-800 ml-auto">Daftar Baru ✨</h2>
                </div>

                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Buat Username Unik"
                    className="w-full bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-green-500 rounded-xl py-3 px-5 font-bold outline-none transition"
                    autoFocus
                />

                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Buat Password"
                        className="w-full bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-green-500 rounded-xl py-3 px-5 font-bold outline-none transition"
                    />
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? "🙈" : "👁️"}
                    </button>
                </div>

                <button disabled={loading} className="w-full bg-green-600 text-white rounded-xl py-4 font-bold hover:bg-green-700 transition shadow-lg shadow-green-200 disabled:opacity-50">
                    {loading ? "Mendaftar..." : "Buat Akun"}
                </button>

                 <p className="text-center text-xs text-gray-400 mt-4">
                    Sudah punya akun? <button type="button" onClick={() => switchView("login")} className="text-green-600 font-bold hover:underline">Login disini</button>
                </p>
            </form>
        )}

      </div>
      
      <p className="mt-8 text-xs text-gray-400 font-medium">Made with ❤️ for Community</p>
    </div>
  );
}