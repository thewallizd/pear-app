"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

// --- IMPORT SEMUA KOMPONEN ---
import Onboarding from "@/components/Onboarding";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import ProfileDashboard from "@/components/ProfileDashboard";
import Leaderboard from "@/components/Leaderboard";
import FriendList from "@/components/BukuWarga"; 
import NotificationList from "@/components/NotificationList";
import ChatDashboard from "@/components/ChatDashboard";
import PrivateChat from "@/components/PrivateChat";
import GroupChat from "@/components/GroupChat";
import Spaces from "@/components/Spaces";
import FeedbackForum from "@/components/FeedbackForum";
import UserProfile from "@/components/UserProfile";

// Import Fitur Overlay & Menu
import Toast from "@/components/Toast";
import IncomingCall from "@/components/IncomingCall";
import MenuSidebar from "@/components/MenuSidebar";
import Settings from "@/components/Settings";
import LogoutModal from "@/components/LogoutModal";

export default function Home() {
  const [myName, setMyName] = useState("");
  const [activeTab, setActiveTab] = useState("feed");
  const [targetProfile, setTargetProfile] = useState(""); 
  
  // State Menu & Fitur Tambahan
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);

  // State Chat
  const [chatMode, setChatMode] = useState("dashboard");
  const [chatPartner, setChatPartner] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  // State Data & Realtime
  const [posts, setPosts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [toastMsg, setToastMsg] = useState(null); 
  const [incomingCall, setIncomingCall] = useState(null); 
  const [realtimeStatus, setRealtimeStatus] = useState("🔴");

  // 1. Cek Login
  useEffect(() => {
    const savedUser = localStorage.getItem("pear_username");
    if (savedUser) setMyName(savedUser);
  }, []);

  // 🌟 LOGIKA TOMBOL BACK (SISTEM ANTI-KELUAR) 🔙
  useEffect(() => {
    // Fungsi yang dijalankan saat tombol Back ditekan
    const handleBackButton = (event) => {
        if (activeTab !== "feed") {
            // Kalau sedang BUKAN di Home, jangan keluar web, tapi balik ke Home
            setActiveTab("feed");
            setChatMode("dashboard"); // Reset chat juga kalau ada
        }
    };

    // Setiap kali pindah tab selain 'feed', kita tumpuk history browser
    // Supaya tombol Back punya sesuatu untuk 'dimundo' (undo)
    if (activeTab !== "feed") {
        window.history.pushState(null, "", window.location.pathname);
    }

    // Pasang telinga untuk mendengar tombol Back
    window.addEventListener("popstate", handleBackButton);

    // Bersihkan saat komponen di-refresh
    return () => window.removeEventListener("popstate", handleBackButton);
  }, [activeTab]); // Jalankan ulang setiap tab berubah


  // 2. GLOBAL REALTIME LISTENER
  useEffect(() => {
    if (!myName) return;

    fetchPosts();

    const channel = supabase.channel("super_channel_pear_app")
        .on("presence", { event: "sync" }, () => {
            const newState = channel.presenceState();
            const users = new Set();
            for (let id in newState) { newState[id].forEach(u => users.add(u.username)); }
            setOnlineUsers(users);
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => fetchPosts())
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `recipient=eq.${myName}` }, 
            (payload) => showToast(`🔔 ${payload.new.content}`, "info")
        )
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "private_messages", filter: `receiver=eq.${myName}` }, 
            (payload) => {
                if (chatMode !== 'private' || chatPartner !== payload.new.sender) {
                    showToast(`💬 ${payload.new.sender}: ${payload.new.content}`, "message");
                }
            }
        )
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "calls" }, 
            (payload) => {
                if (payload.new.receiver.toLowerCase() === myName.toLowerCase() && payload.new.status === 'ringing') {
                    setIncomingCall(payload.new);
                    const isSoundOn = localStorage.getItem("pear_sound") !== "off";
                    if (isSoundOn) {
                        const ringtone = new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3");
                        ringtone.loop = true;
                        ringtone.play().catch(e => console.log("Autoplay blocked:", e));
                        window.currentRingtone = ringtone; 
                    }
                }
            }
        )
        .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
                setRealtimeStatus("🟢"); 
                await channel.track({ username: myName, online_at: new Date().toISOString() });
            } else {
                setRealtimeStatus("🔴");
            }
        });

    return () => { supabase.removeChannel(channel); };
  }, [myName, chatMode, chatPartner]);

  const fetchPosts = async () => {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (data) setPosts(data);
  };

  const fetchBookmarks = async () => {
      const { data: marks } = await supabase.from("bookmarks").select("post_id").eq("username", myName);
      if (marks && marks.length > 0) {
          const postIds = marks.map(m => m.post_id);
          const { data: posts } = await supabase.from("posts").select("*").in("id", postIds).order("created_at", { ascending: false });
          if(posts) setBookmarkedPosts(posts);
      } else {
          setBookmarkedPosts([]);
      }
  };

  const showToast = (msg, type="info") => { 
      setToastMsg({ message: msg, type }); 
      const isSoundOn = localStorage.getItem("pear_sound") !== "off";
      if (isSoundOn) {
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
          audio.volume = 0.6;
          audio.play().catch(e => console.log(e));
      }
  };
  
  const handleLogoutTrigger = () => { setIsLogoutOpen(true); };
  const handleConfirmLogout = () => { localStorage.clear(); window.location.reload(); };

  const openProfile = (username) => { setTargetProfile(username); setActiveTab("profile"); window.scrollTo(0,0); };
  const openPrivateChat = (username) => { setChatPartner(username); setChatMode("private"); setActiveTab("chat"); };

  const stopRingtone = () => {
      if (window.currentRingtone) {
          window.currentRingtone.pause();
          window.currentRingtone.currentTime = 0;
          window.currentRingtone = null;
      }
  };

  const handleAnswerCall = async () => {
      stopRingtone(); 
      if(!incomingCall) return;
      await supabase.from("calls").update({ status: 'accepted' }).eq("id", incomingCall.id);
      setChatPartner(incomingCall.caller); setChatMode("private"); setActiveTab("chat"); setIncomingCall(null);
  };
  
  const handleRejectCall = async () => {
      stopRingtone(); 
      if(!incomingCall) return;
      await supabase.from("calls").update({ status: 'rejected' }).eq("id", incomingCall.id); setIncomingCall(null);
  };

  const handleMenuNavigate = (menuId) => {
      if(menuId === 'profile') openProfile(myName);
      if(menuId === 'bookmarks') { fetchBookmarks(); setActiveTab("bookmarks"); }
      if(menuId === 'settings') setActiveTab("settings");
      if(menuId === 'help') setActiveTab("feedback");
  };

  if (!myName) return <Onboarding onFinish={setMyName} />;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 font-sans">
      
      {/* GLOBAL OVERLAYS */}
      {toastMsg && <Toast message={toastMsg.message} type={toastMsg.type} onClose={() => setToastMsg(null)} />}
      {incomingCall && <IncomingCall caller={incomingCall.caller} onAnswer={handleAnswerCall} onReject={handleRejectCall} />}
      
      <LogoutModal isOpen={isLogoutOpen} onClose={() => setIsLogoutOpen(false)} onConfirm={handleConfirmLogout} />

      <MenuSidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} myName={myName} onNavigate={handleMenuNavigate} onLogout={handleLogoutTrigger} />

      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>

            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("feed")}>
                <span className="text-2xl">🍐</span>
                <div className="flex flex-col">
                    <h1 className="text-xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent leading-none">PEAR</h1>
                    <span className="text-[9px] text-gray-400 flex items-center gap-1">
                        {realtimeStatus === "🟢" ? "Online" : "Connecting..."} {realtimeStatus}
                    </span>
                </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button onClick={() => setActiveTab("feedback")} className="hidden md:block text-xs font-bold text-gray-400 hover:text-orange-500 transition">💡 Saran</button>
             <div onClick={() => openProfile(myName)} className="cursor-pointer">
                 <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${myName}`} className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200"/>
             </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto flex gap-6 p-4 md:p-6">
        
        {/* LEFT SIDEBAR (Desktop) */}
        <aside className="hidden md:flex flex-col w-1/4 gap-6 sticky top-24 h-fit">
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
             <button onClick={() => handleMenuNavigate('bookmarks')} className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl text-gray-700 font-bold hover:text-orange-600 transition">
                 <span>🔖</span> Markah
             </button>
             <button onClick={() => handleMenuNavigate('settings')} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl text-gray-700 font-bold hover:text-blue-600 transition">
                 <span>⚙️</span> Pengaturan
             </button>
          </div>
          <ProfileDashboard myName={myName} onLogout={handleLogoutTrigger} onViewProfile={() => openProfile(myName)} />
          <Leaderboard />
        </aside>

        {/* CENTER FEED */}
        <section className="flex-1 min-w-0">
          
          {/* 1. TAB FEED (HOME) */}
          {activeTab === "feed" && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <CreatePost myName={myName} onPostSuccess={fetchPosts} />
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard key={post.id} {...post} myName={myName} onUserClick={openProfile} />
                ))}
              </div>
            </div>
          )}

          {/* 2. TAB MARKAH */}
          {activeTab === "bookmarks" && (
              <div className="animate-in fade-in">
                  <div className="flex items-center gap-2 mb-4">
                      <button onClick={() => setActiveTab("feed")} className="text-gray-400 text-xl">←</button>
                      <h2 className="text-xl font-black">Markah Saya 🔖</h2>
                  </div>
                  {bookmarkedPosts.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                          <span className="text-4xl block mb-2">🏷️</span>
                          <p className="text-gray-500">Belum ada postingan yang disimpan.</p>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {bookmarkedPosts.map(post => (
                              <PostCard key={post.id} {...post} myName={myName} onUserClick={openProfile} />
                          ))}
                      </div>
                  )}
              </div>
          )}

          {/* 3. TAB PENGATURAN */}
          {activeTab === "settings" && (
            <div className="animate-in fade-in">
                 <div className="flex items-center gap-2 mb-4">
                      <button onClick={() => setActiveTab("feed")} className="text-gray-400 text-xl">←</button>
                      <h2 className="text-xl font-black">Pengaturan ⚙️</h2>
                 </div>
                 <Settings myName={myName} />
            </div>
          )}

          {/* 4. TAB LAINNYA */}
          {activeTab === "spaces" && <Spaces myName={myName} />}
          {activeTab === "notifications" && <div className="animate-in fade-in"><h2 className="text-xl font-black mb-4 px-2">Aktivitas Terbaru 🔔</h2><NotificationList myName={myName} /></div>}
          
          {activeTab === "chat" && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 h-[calc(100vh-180px)] md:h-[600px] overflow-hidden">
                {chatMode === "dashboard" && <div className="p-0 h-full overflow-hidden"><ChatDashboard myName={myName} onSelectChat={openPrivateChat} onOpenGlobal={() => { setActiveGroup({id:'global', name:'Global'}); setChatMode('group'); }} onSelectGroup={(g) => { setActiveGroup(g); setChatMode('group'); }} onlineUsers={onlineUsers} /></div>}
                {chatMode === "private" && <PrivateChat myName={myName} partnerName={chatPartner} onBack={() => setChatMode("dashboard")} onlineUsers={onlineUsers} />}
                {chatMode === "group" && <GroupChat group={activeGroup} myName={myName} onBack={() => setChatMode("dashboard")} />}
            </div>
          )}

          {activeTab === "profile" && <UserProfile targetUsername={targetProfile} myName={myName} onBack={() => setActiveTab("feed")} onChat={openPrivateChat} />}
          {activeTab === "feedback" && <FeedbackForum myName={myName} />}
          {activeTab === "leaderboard" && <div className="animate-in fade-in"><h2 className="text-xl font-black mb-4 px-2">Peringkat Warga 🏆</h2><Leaderboard /><div className="mt-6"><FriendList myName={myName} onlineUsers={onlineUsers} onSelectUser={openPrivateChat} /></div></div>}
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-1/4 gap-6 sticky top-24 h-fit">
          <NotificationList myName={myName} />
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
             <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">💬 Pesan Cepat</h3>
             <div className="h-[400px] overflow-hidden">
                 <ChatDashboard myName={myName} onSelectChat={openPrivateChat} onSelectGroup={(g)=>{setActiveGroup(g); setChatMode('group'); setActiveTab('chat')}} onlineUsers={onlineUsers} />
             </div>
          </div>
        </aside>

      </main>

      {/* MOBILE NAV (Bottom Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center p-3 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab("feed")} className={`flex flex-col items-center gap-1 transition ${activeTab === 'feed' ? 'text-green-600 scale-110' : 'text-gray-400'}`}><span className="text-xl">🏠</span><span className="text-[10px] font-bold">Home</span></button>
        <button onClick={() => setActiveTab("chat")} className={`flex flex-col items-center gap-1 transition ${activeTab === 'chat' ? 'text-blue-600 scale-110' : 'text-gray-400'}`}><div className="relative"><span className="text-xl">💬</span></div><span className="text-[10px] font-bold">Chat</span></button>
        <button onClick={() => setActiveTab("spaces")} className={`flex flex-col items-center gap-1 transition ${activeTab === 'spaces' ? 'text-purple-600 scale-110' : 'text-gray-400'}`}><span className="text-xl">🎙️</span><span className="text-[10px] font-bold">Spaces</span></button>
        <button onClick={() => setActiveTab("notifications")} className={`flex flex-col items-center gap-1 transition ${activeTab === 'notifications' ? 'text-orange-500 scale-110' : 'text-gray-400'}`}><span className="text-xl">🔔</span><span className="text-[10px] font-bold">Notif</span></button>
        <button onClick={() => setIsMenuOpen(true)} className={`flex flex-col items-center gap-1 transition ${isMenuOpen ? 'text-gray-800 scale-110' : 'text-gray-400'}`}><span className="text-xl">🍔</span><span className="text-[10px] font-bold">Menu</span></button>
      </nav>
    </div>
  );
}