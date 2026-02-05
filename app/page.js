"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

// Import Components
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

// Import Utils
import { toast } from "sonner"; 
import IncomingCall from "@/components/IncomingCall";
import MenuSidebar from "@/components/MenuSidebar";
import Settings from "@/components/Settings";
import LogoutModal from "@/components/LogoutModal";

// 1. IMPORT LUCIDE ICONS (Agar navigasi terlihat profesional)
import { 
  Home as HomeIcon, 
  MessageCircle, 
  Settings as SettingsIcon, 
  Bookmark, 
  Menu, 
  Bell, 
  Trophy,
  HelpCircle
} from "lucide-react";

export default function Home() {
  const [myName, setMyName] = useState("");
  const [activeTab, setActiveTab] = useState("feed");
  const [targetProfile, setTargetProfile] = useState(""); 
  const [darkMode, setDarkMode] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  
  // State Bookmark & Logic Fetching Sederhana
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);

  const [chatMode, setChatMode] = useState("dashboard");
  const [chatPartner, setChatPartner] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  const [posts, setPosts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [incomingCall, setIncomingCall] = useState(null); 
  const [realtimeStatus, setRealtimeStatus] = useState("🔴");

  useEffect(() => {
    const savedUser = localStorage.getItem("pear_username");
    if (savedUser) setMyName(savedUser);

    const savedTheme = localStorage.getItem("pear_theme");
    if (savedTheme === "dark") {
        setDarkMode(true);
        document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
      const newMode = !darkMode;
      setDarkMode(newMode);
      if (newMode) {
          document.documentElement.classList.add("dark");
          localStorage.setItem("pear_theme", "dark");
      } else {
          document.documentElement.classList.remove("dark");
          localStorage.setItem("pear_theme", "light");
      }
  };

  useEffect(() => {
    const handleBackButton = (event) => {
        if (activeTab !== "feed") { setActiveTab("feed"); setChatMode("dashboard"); }
    };
    if (activeTab !== "feed") { window.history.pushState(null, "", window.location.pathname); }
    window.addEventListener("popstate", handleBackButton);
    return () => window.removeEventListener("popstate", handleBackButton);
  }, [activeTab]);

  useEffect(() => {
    if (!myName) return;
    fetchPosts();
    fetchBookmarks(); // Fetch bookmark awal

    const channel = supabase.channel("super_channel_pear_app")
        .on("presence", { event: "sync" }, () => {
            const newState = channel.presenceState();
            const users = new Set();
            for (let id in newState) { newState[id].forEach(u => users.add(u.username)); }
            setOnlineUsers(users);
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => fetchPosts())
        // NOTIFIKASI SONNER
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `recipient=eq.${myName}` }, 
            (payload) => showToast(payload.new.content, "info") 
        )
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "private_messages", filter: `receiver=eq.${myName}` }, 
            (payload) => { 
                if (chatMode !== 'private' || chatPartner !== payload.new.sender) {
                    showToast(`${payload.new.sender}: ${payload.new.content}`, "message");
                }
            }
        )
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "calls" }, 
            (payload) => {
                if (payload.new.receiver.toLowerCase() === myName.toLowerCase() && payload.new.status === 'ringing') {
                    setIncomingCall(payload.new);
                    if (localStorage.getItem("pear_sound") !== "off") {
                        const ringtone = new Audio("https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3");
                        ringtone.loop = true; ringtone.play().catch(console.error);
                        window.currentRingtone = ringtone; 
                    }
                }
            }
        )
        .subscribe(async (status) => {
            if (status === "SUBSCRIBED") { setRealtimeStatus("🟢"); await channel.track({ username: myName, online_at: new Date().toISOString() }); } 
            else { setRealtimeStatus("🔴"); }
        });

    return () => { supabase.removeChannel(channel); };
  }, [myName, chatMode, chatPartner]);

  const fetchPosts = async () => { const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }); if (data) setPosts(data); };
  
  // Logic Fetch Bookmarks Sederhana
  const fetchBookmarks = async () => {
      // Logic ini bisa disesuaikan nanti dengan tabel bookmarks yang sebenarnya
      // Untuk sekarang kita biarkan array kosong atau ambil dari tabel jika sudah ada
      const { data } = await supabase.from("bookmarks").select("post_id").eq("username", myName);
      if(data && data.length > 0) {
          const ids = data.map(b => b.post_id);
          const { data: postData } = await supabase.from("posts").select("*").in("id", ids);
          if(postData) setBookmarkedPosts(postData);
      }
  };

  const showToast = (msg, type="info") => { 
      if (localStorage.getItem("pear_sound") !== "off") {
          new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play().catch(console.error);
      }
      if (type === 'message') toast.info(msg, { icon: '💬' });
      else toast.success(msg);
  };
  
  const handleLogoutTrigger = () => { setIsLogoutOpen(true); };
  const handleConfirmLogout = () => { localStorage.clear(); window.location.reload(); };
  const openProfile = (username) => { setTargetProfile(username); setActiveTab("profile"); window.scrollTo(0,0); };
  const openPrivateChat = (username) => { setChatPartner(username); setChatMode("private"); setActiveTab("chat"); };

  const stopRingtone = () => { if (window.currentRingtone) { window.currentRingtone.pause(); window.currentRingtone.currentTime = 0; window.currentRingtone = null; } };
  const handleAnswerCall = async () => { stopRingtone(); if(!incomingCall) return; await supabase.from("calls").update({ status: 'accepted' }).eq("id", incomingCall.id); setChatPartner(incomingCall.caller); setChatMode("private"); setActiveTab("chat"); setIncomingCall(null); };
  const handleRejectCall = async () => { stopRingtone(); if(!incomingCall) return; await supabase.from("calls").update({ status: 'rejected' }).eq("id", incomingCall.id); setIncomingCall(null); };
  const handleMenuNavigate = (menuId) => { if(menuId === 'profile') openProfile(myName); if(menuId === 'bookmarks') { fetchBookmarks(); setActiveTab("bookmarks"); } if(menuId === 'settings') setActiveTab("settings"); if(menuId === 'help') setActiveTab("feedback"); };

  if (!myName) return <Onboarding onFinish={setMyName} />;

  return (
    <div className={`min-h-screen pb-20 md:pb-0 font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
      
      {incomingCall && <IncomingCall caller={incomingCall.caller} onAnswer={handleAnswerCall} onReject={handleRejectCall} />}
      <LogoutModal isOpen={isLogoutOpen} onClose={() => setIsLogoutOpen(false)} onConfirm={handleConfirmLogout} />
      <MenuSidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} myName={myName} onNavigate={handleMenuNavigate} onLogout={handleLogoutTrigger} />

      {/* HEADER */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40 p-4 transition-colors">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition">
                <Menu size={24} />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("feed")}>
                <span className="text-2xl">🍐</span>
                <div className="flex flex-col">
                    <h1 className="text-xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent leading-none">PEAR</h1>
                    <span className="text-[9px] text-gray-400 dark:text-slate-500 flex items-center gap-1">{realtimeStatus === "🟢" ? "Online" : "Connecting..."} {realtimeStatus}</span>
                </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div onClick={() => openProfile(myName)} className="cursor-pointer">
                 <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${myName}`} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:scale-105 transition"/>
             </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto flex gap-6 p-4 md:p-6">
        
        {/* LEFT SIDEBAR (Desktop) */}
        <aside className="hidden md:flex flex-col w-1/4 gap-6 sticky top-24 h-fit">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm transition-colors">
             <button onClick={() => handleMenuNavigate('bookmarks')} className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 dark:hover:bg-slate-700 rounded-xl text-gray-700 dark:text-slate-200 font-bold hover:text-orange-600 transition">
                 <Bookmark size={20} /> Markah
             </button>
             <button onClick={() => handleMenuNavigate('settings')} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl text-gray-700 dark:text-slate-200 font-bold hover:text-blue-600 transition">
                 <SettingsIcon size={20} /> Pengaturan
             </button>
          </div>
          <ProfileDashboard myName={myName} onLogout={handleLogoutTrigger} onViewProfile={() => openProfile(myName)} />
          <Leaderboard />
        </aside>

        {/* CENTER FEED */}
        <section className="flex-1 min-w-0">
          
          {activeTab === "feed" && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <CreatePost myName={myName} onPostSuccess={fetchPosts} />
              <div className="space-y-4">
                {posts.map(post => <PostCard key={post.id} {...post} myName={myName} onUserClick={openProfile} />)}
              </div>
            </div>
          )}

          {activeTab === "bookmarks" && (
              <div className="animate-in fade-in">
                  <h2 className="text-xl font-black mb-4 flex items-center gap-2"><Bookmark size={24} /> Markah Saya</h2>
                  {bookmarkedPosts.length === 0 ? <p className="text-gray-500 dark:text-slate-400 text-center py-10">Belum ada postingan yang disimpan.</p> : bookmarkedPosts.map(post => <PostCard key={post.id} {...post} myName={myName} onUserClick={openProfile} />)}
              </div>
          )}

          {activeTab === "settings" && (
            <div className="animate-in fade-in">
                 <h2 className="text-xl font-black mb-4 flex items-center gap-2"><SettingsIcon size={24} /> Pengaturan</h2>
                 <Settings myName={myName} isDark={darkMode} toggleTheme={toggleTheme} />
            </div>
          )}

          {activeTab === "spaces" && <Spaces myName={myName} />}
          {activeTab === "notifications" && <div className="animate-in fade-in"><h2 className="text-xl font-black mb-4 px-2 flex items-center gap-2"><Bell size={24} /> Aktivitas Terbaru</h2><NotificationList myName={myName} /></div>}
          
          {activeTab === "chat" && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 h-[calc(100vh-180px)] md:h-[600px] overflow-hidden transition-colors">
                {chatMode === "dashboard" && <div className="p-0 h-full overflow-hidden"><ChatDashboard myName={myName} onSelectChat={openPrivateChat} onOpenGlobal={() => { setActiveGroup({id:'global', name:'Global'}); setChatMode('group'); }} onSelectGroup={(g) => { setActiveGroup(g); setChatMode('group'); }} onlineUsers={onlineUsers} /></div>}
                {chatMode === "private" && <PrivateChat myName={myName} partnerName={chatPartner} onBack={() => setChatMode("dashboard")} onlineUsers={onlineUsers} />}
                {chatMode === "group" && <GroupChat group={activeGroup} myName={myName} onBack={() => setChatMode("dashboard")} />}
            </div>
          )}

          {activeTab === "profile" && <UserProfile targetUsername={targetProfile} myName={myName} onBack={() => setActiveTab("feed")} onChat={openPrivateChat} />}
          {activeTab === "feedback" && <FeedbackForum myName={myName} />}
          {activeTab === "leaderboard" && <div className="animate-in fade-in"><h2 className="text-xl font-black mb-4 px-2 flex items-center gap-2"><Trophy size={24} /> Peringkat</h2><Leaderboard /><FriendList myName={myName} onlineUsers={onlineUsers} onSelectUser={openPrivateChat} /></div>}
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-1/4 gap-6 sticky top-24 h-fit">
          <NotificationList myName={myName} />
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm transition-colors">
             <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><MessageCircle size={18} /> Pesan Cepat</h3>
             <div className="h-[400px] overflow-hidden">
                 <ChatDashboard myName={myName} onSelectChat={openPrivateChat} onSelectGroup={(g)=>{setActiveGroup(g); setChatMode('group'); setActiveTab('chat')}} onlineUsers={onlineUsers} />
             </div>
          </div>
        </aside>

      </main>

      {/* MOBILE NAV (Bottom Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-gray-100 dark:border-slate-800 flex justify-around items-center p-3 z-50">
        <button onClick={() => setActiveTab("feed")} className={`flex flex-col items-center gap-1 transition ${activeTab === 'feed' ? 'text-green-600' : 'text-gray-400 dark:text-slate-500'}`}>
            <HomeIcon size={24} />
            <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => setActiveTab("chat")} className={`flex flex-col items-center gap-1 transition ${activeTab === 'chat' ? 'text-blue-600' : 'text-gray-400 dark:text-slate-500'}`}>
            <MessageCircle size={24} />
            <span className="text-[10px] font-bold">Chat</span>
        </button>
        <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center gap-1 transition ${activeTab === 'settings' ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>
            <SettingsIcon size={24} />
            <span className="text-[10px] font-bold">Setting</span>
        </button>
      </nav>
    </div>
  );
}