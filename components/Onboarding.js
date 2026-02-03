"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Onboarding({ onFinish }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(""); // Ganti PIN jadi Password
  const [showPassword, setShowPassword] = useState(false);

  // Mode: 'check' (awal), 'login' (masuk), 'register' (daftar)
  const [mode, setMode] = useState("check");
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
    // Ambil daftar user terbaru
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .order("updated_at", { ascending: false })
      .limit(10);

    if (data) {
      const unique = [
        ...new Map(data.map((item) => [item["username"], item])).values(),
      ];
      setRecentUsers(unique.filter((u) => u.username && u.username.length > 2));
    }
    setIsLoadingUsers(false);
  };

  // 1. CEK USERNAME
  const handleCheckUser = async (e) => {
    e?.preventDefault();
    if (!username.trim()) return showError("⚠️ Isi username dulu ya!");

    setLoading(true);
    const cleanName = username.trim().toLowerCase().replace(/\s+/g, "");
    setUsername(cleanName);

    try {
      // Cek kolom 'password' bukan 'pin' lagi
      const { data, error } = await supabase
        .from("profiles")
        .select("password")
        .eq("username", cleanName)
        .single();

      if (error && error.code !== "PGRST116") {
        // Error koneksi, anggap register biar gak macet
        console.error(error);
      }

      setLoading(false);

      if (data && data.password) {
        setMode("login"); // User Lama
      } else {
        setMode("register"); // User Baru
      }
    } catch (err) {
      setLoading(false);
      setMode("register");
    }
  };

  // 2. SUBMIT (LOGIN / DAFTAR)
  const handleFinalSubmit = async (e) => {
    e?.preventDefault();
    if (!password || password.length < 3)
      return showError("⚠️ Password minimal 3 karakter!");

    setLoading(true);

    if (mode === "register") {
      // --- DAFTAR BARU ---
      const { error } = await supabase.from("profiles").upsert({
        username: username,
        password: password, // Kirim ke kolom password
        updated_at: new Date(),
      });

      if (!error) {
        loginSuccess();
      } else {
        setLoading(false);
        console.error(error);
        showError("❌ Gagal daftar. Pastikan script SQL sudah dijalankan!");
      }
    } else {
      // --- LOGIN ---
      const { data } = await supabase
        .from("profiles")
        .select("password")
        .eq("username", username)
        .single();

      if (data && data.password === password) {
        await supabase
          .from("profiles")
          .update({ updated_at: new Date() })
          .eq("username", username);
        loginSuccess();
      } else {
        setLoading(false);
        setPassword("");
        showError("⛔ Password Salah! Coba lagi.");
      }
    }
  };

  const loginSuccess = () => {
    localStorage.setItem("pear_username", username);
    setTimeout(() => onFinish(username), 500);
  };

  const handleSelectUser = (selectedName) => {
    setUsername(selectedName);
    setMode("login");
  };

  const resetFlow = () => {
    setMode("check");
    setPassword("");
    setUsername("");
    setErrorMsg("");
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
        {/* LOGO */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-2 animate-bounce">🍐</div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">
            PEAR APP
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">
            {mode === "check" && "Komunitas Digital Seru-seruan"}
            {mode === "register" && "User baru! Buat Password dulu."}
            {mode === "login" && "Halo lagi! Masukkan Password."}
          </p>
        </div>

        {/* STEP 1: CEK USERNAME */}
        {mode === "check" && (
          <div className="space-y-6 animate-in slide-in-from-right">
            <form onSubmit={handleCheckUser}>
              <div className="relative">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ketik username..."
                  className="w-full bg-gray-100 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl py-4 px-6 text-center text-lg font-bold text-gray-800 outline-none transition-all"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading || !username.trim()}
                  className="w-full mt-4 bg-gray-900 text-white rounded-2xl py-4 font-bold hover:scale-[1.02] active:scale-95 transition disabled:opacity-50"
                >
                  {loading ? "Mengecek..." : "Lanjut ➤"}
                </button>
              </div>
            </form>

            {/* GRID WARGA */}
            <div className="pt-6 border-t border-gray-100">
              <p className="text-center text-xs font-bold text-gray-400 mb-4 tracking-widest">
                WARGA AKTIF
              </p>
              {isLoadingUsers ? (
                <div className="text-center text-xs text-gray-300">...</div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {recentUsers.map((user) => (
                    <button
                      key={user.username}
                      onClick={() => handleSelectUser(user.username)}
                      className="flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <img
                        src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user.username}`}
                        className="w-12 h-12 rounded-full bg-gray-100 border-2 border-transparent group-hover:border-blue-500 transition shadow-sm"
                      />
                      <span className="text-[10px] font-bold text-gray-500 group-hover:text-blue-600 truncate w-full text-center">
                        {user.username}
                      </span>
                    </button>
                  ))}
                  {recentUsers.length === 0 && (
                    <p className="col-span-4 text-center text-xs text-gray-300">
                      Belum ada warga aktif.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: PASSWORD */}
        {mode !== "check" && (
          <form
            onSubmit={handleFinalSubmit}
            className="space-y-6 animate-in slide-in-from-right"
          >
            <div className="flex justify-center">
              <button
                type="button"
                onClick={resetFlow}
                className="bg-gray-100 px-4 py-2 rounded-full flex items-center gap-2 hover:bg-gray-200 transition group"
              >
                <img
                  src={`https://api.dicebear.com/9.x/notionists/svg?seed=${username}`}
                  className="w-6 h-6 rounded-full bg-white"
                />
                <span className="font-bold text-sm text-gray-700">
                  @{username}
                </span>
                <span className="text-xs text-red-500 font-bold ml-2 opacity-50 group-hover:opacity-100 transition">
                  ✕ Ganti
                </span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "register"
                    ? "Buat Password Bebas"
                    : "Masukkan Password"
                }
                className="w-full bg-white border-2 border-gray-200 focus:border-blue-500 rounded-2xl py-4 px-6 text-center text-lg font-bold text-gray-800 outline-none transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className={`w-full rounded-2xl py-4 font-bold text-white transition hover:scale-[1.02] active:scale-95 shadow-lg ${mode === "register" ? "bg-blue-600 shadow-blue-200" : "bg-green-600 shadow-green-200"}`}
            >
              {loading
                ? "Memproses..."
                : mode === "register"
                  ? "✨ Daftar Akun"
                  : "🔓 Masuk Aplikasi"}
            </button>
          </form>
        )}
      </div>

      <p className="mt-8 text-xs text-gray-400 font-medium">
        Made with ❤️ for Community
      </p>
    </div>
  );
}
