"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; 
import CreatePost from "@/components/CreatePost"; 
import PostCard from "@/components/PostCard"; 
import Auth from "@/components/Auth"; 
import ChatRoom from "@/components/ChatRoom"; 
import PrivateChat from "@/components/PrivateChat";
import ChatDashboard from "@/components/ChatDashboard"; 
import NotificationList from "@/components/NotificationList";
import ProfileDashboard from "@/components/ProfileDashboard";
import Leaderboard from "@/components/Leaderboard";
import UserProfile from "@/components/UserProfile"; 
import FriendsList from "@/components/FriendsList"; 
import GroupChat from "@/components/GroupChat"; 
import Onboarding from "@/components/Onboarding"; 
import FeedbackForum from "@/components/FeedbackForum";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Home");
  const [sortBy, setSortBy] = useState("trending");
  const [limit, setLimit] = useState(10); // STATE LIMIT BARU

  const [myName, setMyName] = useState(null); 
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [chatPartner, setChatPartner] = useState(null); 
  const [unreadCount, setUnreadCount] = useState(0);

  const [selectedGroup, setSelectedGroup] = useState(null); 
  const [viewProfileUser, setViewProfileUser] = useState(null); 
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    const savedName = localStorage.getItem('pear_username');
    if (savedName) { setMyName(savedName); fetchData(savedName); } else { setLoading(false); }
  }, []);

  const fetchData = (name, query = "") => { 
    const checkUserStatus = async () => {
       const { data } = await supabase.from("users").select("has_onboarded").eq("username", name).single();
       if (data && !data.has_onboarded) { setShowOnboarding(true); }
    };
    if (!query) checkUserStatus();

    const fetchPosts = async () => {
      setLoading(true);
      let dbQuery = supabase.from("posts").select("*");

      if (query.trim()) {
        // Mode Pencarian
        dbQuery = dbQuery.or(`content.ilike.%${query}%,author.ilike.%${query}%,title.ilike.%${query}%`);
      } else {
        // Mode Normal (Sortir)
        if (sortBy === "trending") {
            // Hot this week (7 hari terakhir)
            const sevenDaysAgo = new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();
            dbQuery = dbQuery.gt("created_at", sevenDaysAgo).order("votes", { ascending: false });
        } else {
            // Newest
            dbQuery = dbQuery.order("created_at", { ascending: false });
        }
      }

      // Pagination Limit
      dbQuery = dbQuery.limit(limit);

      const { data } = await dbQuery;
      if (data) setPosts(data);
      setLoading(false);
    };

    const fetchUnreadNotifs = async () => {
      if (!name) return;
      const { count } = await supabase.from("notifications").select("*", { count: 'exact', head: true }).eq("recipient", name).eq("is_read", false);
      setUnreadCount(count || 0);
    };

    fetchPosts(); fetchUnreadNotifs();

    const presenceChannel = supabase.channel('global_presence').on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        const users = new Set();
        for (const id in newState) { newState[id].forEach(u => users.add(u.user)); }
        setOnlineUsers(users);
      }).subscribe(async (status) => { if (status === 'SUBSCRIBED') { await presenceChannel.track({ user: name, online_at: new Date().toISOString() }); } });

    const channel = supabase.channel("realtime_main")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, (payload) => {
          if (query) return; 
          if (payload.eventType === "INSERT") { setPosts((prev) => [payload.new, ...prev]); } 
          else if (payload.eventType === "UPDATE") { setPosts((prev) => prev.map((post) => (post.id === payload.new.id ? payload.new : post)).sort((a, b) => b.votes - a.votes)); } 
          else if (payload.eventType === "DELETE") { setPosts((prev) => prev.filter((post) => post.id !== payload.old.id)); }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
          if (payload.new.recipient === name) setUnreadCount((prev) => prev + 1);
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); supabase.removeChannel(presenceChannel); };
  };

  // Re-fetch saat sortBy atau limit berubah
  useEffect(() => {
      if (myName) fetchData(myName, searchQuery);
  }, [sortBy, limit]);

  const handleLoadMore = () => {
      setLimit(prev => prev + 10);
      // Fetch akan dipanggil otomatis oleh useEffect di atas karena 'limit' berubah
  };

  const handleSearch = (e) => { e.preventDefault(); setIsSearching(true); fetchData(myName, searchQuery); };
  const clearSearch = () => { setSearchQuery(""); setIsSearching(false); fetchData(myName, ""); };
  const handleLoginSuccess = (username) => { localStorage.setItem('pear_username', username); setMyName(username); fetchData(username); };
  const handleLogout = () => { if (window.confirm("Yakin mau logout?")) { localStorage.removeItem('pear_username'); setMyName(null); setPosts([]); } };

  if (!myName) return <Auth onLoginSuccess={handleLoginSuccess} />;

  const startPrivateChat = (targetUser) => {
    if (targetUser === myName) return alert("Gabut ya chat diri sendiri?");
    setChatPartner(targetUser); setActiveTab("Private");
  };
  const handleSelectGroup = (group) => { setSelectedGroup(group); setActiveTab("GroupChat"); };
  const handleVisitProfile = (targetUser) => { if (targetUser === myName) { setActiveTab("Profile"); } else { setViewProfileUser(targetUser); setActiveTab("UserProfile"); } };
  const openGlobalChat = () => { setActiveTab("GlobalChat"); };
  const handleOpenNotif = () => { setActiveTab("Notifications"); setUnreadCount(0); };
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {showOnboarding && <Onboarding myName={myName} onFinish={() => setShowOnboarding(false)} />}

      <div className="max-w-6xl mx-auto flex gap-6 px-4 pt-6">
        
        {/* --- NAVBAR / SIDEBAR (DESKTOP) --- */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 space-y-2 sticky top-6 h-fit">
          <button onClick={() => setActiveTab("Home")} className="text-2xl font-bold text-green-600 mb-6 flex items-center gap-2 hover:scale-105 transition text-left w-fit" title="Kembali ke Beranda">
            🍐 Pear <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Beta</span>
          </button>
          
          <button onClick={() => setActiveTab("Friends")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === "Friends" ? "bg-green-50 text-green-700 font-bold border border-green-100" : "text-gray-700 hover:bg-white"}`}>Friends 👥</button>
          <button onClick={() => setActiveTab("Chat 💬")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === "Chat 💬" || activeTab === "Private" || activeTab === "GlobalChat" || activeTab === "GroupChat" ? "bg-green-50 text-green-700 font-bold border border-green-100" : "text-gray-700 hover:bg-white"}`}>Chat 💬</button>
          
          <button onClick={() => setActiveTab("Feedback")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === "Feedback" ? "bg-green-50 text-green-700 font-bold border border-green-100" : "text-gray-700 hover:bg-white"}`}>
             Saran & Keluhan 📢
          </button>

          <button onClick={() => setActiveTab("Leaderboard")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === "Leaderboard" ? "bg-green-50 text-green-700 font-bold border border-green-100" : "text-gray-700 hover:bg-white"}`}>Klasemen 🏆</button>
          <button onClick={handleOpenNotif} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium justify-between ${activeTab === "Notifications" ? "bg-green-50 text-green-700 font-bold border border-green-100" : "text-gray-700 hover:bg-white"}`}><span>Notifications</span>{unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">{unreadCount}</span>}</button>
          <button onClick={() => setActiveTab("Profile")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === "Profile" ? "bg-green-50 text-green-700 font-bold border border-green-100" : "text-gray-700 hover:bg-white"}`}>Profile</button>
        </aside>

        <main className="flex-1 w-full max-w-2xl pb-20 relative">
          <div className="md:hidden flex justify-between items-center mb-4 sticky top-0 bg-gray-50/95 backdrop-blur z-10 py-2">
            <button onClick={() => setActiveTab("Home")} className="text-xl font-bold text-green-600 hover:opacity-80">Pear 🍐</button>
            <div className="flex gap-2">
              <button onClick={() => setActiveTab("Feedback")} className="text-xs font-bold border px-2 py-1 rounded">📢</button>
              <button onClick={() => setActiveTab("Friends")} className="text-xs font-bold border px-2 py-1 rounded">👥</button>
              <button onClick={() => setActiveTab('Chat 💬')} className="text-xs font-bold border px-2 py-1 rounded">💬</button>
              <button onClick={handleOpenNotif} className="text-xs font-bold border px-2 py-1 rounded relative">🔔 {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full border-2 border-white"></span>}</button>
              <button onClick={() => setActiveTab('Profile')} className="text-xs font-bold border px-2 py-1 rounded">👤</button>
            </div>
          </div>

          {activeTab === "Feedback" && <FeedbackForum myName={myName} />}
          {activeTab === "Friends" && <FriendsList myName={myName} onlineUsers={onlineUsers} onVisitProfile={handleVisitProfile} onChat={startPrivateChat} />}
          {activeTab === "UserProfile" && viewProfileUser && <UserProfile targetUsername={viewProfileUser} myName={myName} onBack={() => setActiveTab("Home")} onChat={startPrivateChat} />}
          {activeTab === "Leaderboard" && <Leaderboard myName={myName} onUserClick={handleVisitProfile} />}
          {activeTab === "Notifications" && <NotificationList myName={myName} />}
          {activeTab === "Chat 💬" && <ChatDashboard myName={myName} onSelectChat={startPrivateChat} onOpenGlobal={openGlobalChat} onSelectGroup={handleSelectGroup} onlineUsers={onlineUsers} />}
          {activeTab === "GlobalChat" && (<><button onClick={() => setActiveTab("Chat 💬")} className="mb-2 text-xs font-bold text-gray-500 hover:text-green-600 flex items-center gap-1">⬅ Kembali</button><ChatRoom myName={myName} onUserClick={handleVisitProfile} /></>)}
          {activeTab === "GroupChat" && selectedGroup && (<><button onClick={() => setActiveTab("Chat 💬")} className="mb-2 text-xs font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1">⬅ Kembali ke Dashboard</button><GroupChat myName={myName} group={selectedGroup} onBack={() => setActiveTab("Chat 💬")} onVisitProfile={handleVisitProfile} /></>)}
          {activeTab === "Private" && chatPartner && <PrivateChat myName={myName} partnerName={chatPartner} onBack={() => setActiveTab("Chat 💬")} onlineUsers={onlineUsers} />}
          {activeTab === "Profile" && <ProfileDashboard myName={myName} onLogout={handleLogout} onUserClick={handleVisitProfile} />}
          
          {activeTab === "Home" && (
            <>
              <form onSubmit={handleSearch} className="mb-4 relative group">
                <input type="text" placeholder="Cari postingan, topik, atau user..." className="w-full p-3 pl-10 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
                {searchQuery && <button type="button" onClick={clearSearch} className="absolute right-3 top-2.5 text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-full transition">✖</button>}
              </form>

              {/* SORTING BAR BARU & MODERN */}
              {!isSearching && (
                <div className="flex items-center gap-2 mb-6 p-1 bg-white rounded-xl border border-gray-100 w-fit shadow-sm">
                  <button onClick={() => setSortBy("trending")} className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${sortBy === "trending" ? "bg-orange-100 text-orange-700" : "text-gray-500 hover:bg-gray-50"}`}>
                    🔥 Lagi Panas (Minggu Ini)
                  </button>
                  <button onClick={() => setSortBy("newest")} className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${sortBy === "newest" ? "bg-green-100 text-green-700" : "text-gray-500 hover:bg-gray-50"}`}>
                    ✨ Baru Mateng
                  </button>
                </div>
              )}

              {isSearching && <div className="mb-4 flex items-center justify-between"><span className="text-sm font-bold text-gray-600">Hasil pencarian: "{searchQuery}"</span><button onClick={clearSearch} className="text-xs text-green-600 font-bold hover:underline">Reset</button></div>}
              
              {!isSearching && <CreatePost myName={myName} />}
              
              <div className="space-y-4">
                {loading && posts.length === 0 ? (
                    // LOADING SKELETON
                    <div className="animate-pulse space-y-4">
                        {[1,2].map(i => <div key={i} className="h-40 bg-gray-200 rounded-2xl"></div>)}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="text-4xl mb-2">📭</div>
                        {isSearching ? `Tidak ada hasil untuk "${searchQuery}".` : "Belum ada postingan minggu ini."}
                    </div>
                ) : (
                    <>
                        {posts.map((post) => (
                            <PostCard key={post.id} {...post} createdAt={post.created_at} onUserClick={handleVisitProfile} myName={myName} />
                        ))}
                        
                        {/* TOMBOL LOAD MORE */}
                        {!isSearching && (
                            <button onClick={handleLoadMore} className="w-full py-3 bg-white border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition text-sm">
                                Muat Lebih Banyak ⬇️
                            </button>
                        )}
                    </>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}