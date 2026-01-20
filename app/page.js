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
import Leaderboard from "@/components/Leaderboard"; // <--- IMPORT BARU

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Home");
  const [sortBy, setSortBy] = useState("trending");
  const [myName, setMyName] = useState(null); 
  const [chatPartner, setChatPartner] = useState(null); 
  const [unreadCount, setUnreadCount] = useState(0);

  // STATE PENCARIAN
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('pear_username');
    if (savedName) {
      setMyName(savedName);
      fetchData(savedName); 
    } else {
      setLoading(false); 
    }
  }, []);

  const fetchData = (name, query = "") => { 
    const fetchPosts = async () => {
      setLoading(true);
      let dbQuery = supabase.from("posts").select("*");

      if (query.trim()) {
        dbQuery = dbQuery.or(`content.ilike.%${query}%,author.ilike.%${query}%,title.ilike.%${query}%`);
      } else {
        const yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString();
        dbQuery = dbQuery.gt("created_at", yesterday);
      }

      if (sortBy === "trending") dbQuery = dbQuery.order("votes", { ascending: false });
      else dbQuery = dbQuery.order("created_at", { ascending: false });

      const { data } = await dbQuery;
      if (data) setPosts(data);
      setLoading(false);
    };

    const fetchUnreadNotifs = async () => {
      if (!name) return;
      const { count } = await supabase.from("notifications").select("*", { count: 'exact', head: true }).eq("recipient", name).eq("is_read", false);
      setUnreadCount(count || 0);
    };

    fetchPosts();
    fetchUnreadNotifs();

    const channel = supabase.channel("realtime_main")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, (payload) => {
          if (query) return; 
          if (payload.eventType === "INSERT") setPosts((prev) => [payload.new, ...prev]);
          else if (payload.eventType === "UPDATE") setPosts((prev) => prev.map((post) => (post.id === payload.new.id ? payload.new : post)).sort((a, b) => b.votes - a.votes));
          else if (payload.eventType === "DELETE") setPosts((prev) => prev.filter((post) => post.id !== payload.old.id));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
          if (payload.new.recipient === name) setUnreadCount((prev) => prev + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearching(true);
    fetchData(myName, searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    fetchData(myName, "");
  };

  const handleLoginSuccess = (username) => {
    localStorage.setItem('pear_username', username);
    setMyName(username);
    fetchData(username); 
  };

  const handleLogout = () => {
    if (window.confirm("Yakin mau logout?")) {
      localStorage.removeItem('pear_username');
      setMyName(null);
      setPosts([]); 
    }
  };

  if (!myName) return <Auth onLoginSuccess={handleLoginSuccess} />;

  const startPrivateChat = (targetUser) => {
    if (targetUser === myName) return alert("Gabut ya chat diri sendiri?");
    setChatPartner(targetUser);
    setActiveTab("Private");
  };
  const openGlobalChat = () => { setActiveTab("GlobalChat"); };
  const handleOpenNotif = () => { setActiveTab("Notifications"); setUnreadCount(0); };
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-6xl mx-auto flex gap-6 px-4 pt-6">
        
        {/* --- NAVBAR / SIDEBAR --- */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 space-y-2 sticky top-6 h-fit">
          <div className="text-2xl font-bold text-green-600 mb-6 flex items-center gap-2">
            🍐 Pear <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Beta</span>
          </div>
          <button onClick={() => setActiveTab("Home")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === "Home" ? "bg-green-50 text-green-700 font-bold border border-green-100" : "text-gray-700 hover:bg-white"}`}>Home</button>
          <button onClick={() => setActiveTab("Chat 💬")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === "Chat 💬" || activeTab === "Private" || activeTab === "GlobalChat" ? "bg-green-50 text-green-700 font-bold border border-green-100" : "text-gray-700 hover:bg-white"}`}>Chat 💬</button>
          
          {/* MENU BARU: KLASEMEN */}
          <button onClick={() => setActiveTab("Leaderboard")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === "Leaderboard" ? "bg-green-50 text-green-700 font-bold border border-green-100" : "text-gray-700 hover:bg-white"}`}>
            Klasemen 🏆
          </button>
          
          <button onClick={handleOpenNotif} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium justify-between ${activeTab === "Notifications" ? "bg-green-50 text-green-700 font-bold border border-green-100" : "text-gray-700 hover:bg-white"}`}>
            <span>Notifications</span>
            {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">{unreadCount}</span>}
          </button>
          <button onClick={() => setActiveTab("Profile")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === "Profile" ? "bg-green-50 text-green-700 font-bold border border-green-100" : "text-gray-700 hover:bg-white"}`}>Profile</button>
        </aside>

        <main className="flex-1 w-full max-w-2xl pb-20 relative">
          
          {/* MOBILE HEADER */}
          <div className="md:hidden flex justify-between items-center mb-4 sticky top-0 bg-gray-50/95 backdrop-blur z-10 py-2">
            <h1 className="text-xl font-bold text-green-600">Pear 🍐</h1>
            <div className="flex gap-2">
              <button onClick={() => setActiveTab("Leaderboard")} className="text-xs font-bold border px-2 py-1 rounded">🏆</button>
              <button onClick={() => setActiveTab('Chat 💬')} className="text-xs font-bold border px-2 py-1 rounded">💬</button>
              <button onClick={handleOpenNotif} className="text-xs font-bold border px-2 py-1 rounded relative">
                🔔 {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full border-2 border-white"></span>}
              </button>
              <button onClick={() => setActiveTab('Profile')} className="text-xs font-bold border px-2 py-1 rounded">👤</button>
            </div>
          </div>

          {/* --- CONTENT AREA --- */}

          {activeTab === "Leaderboard" && <Leaderboard myName={myName} onUserClick={startPrivateChat} />}

          {activeTab === "Notifications" && <NotificationList myName={myName} />}
          {activeTab === "Chat 💬" && <ChatDashboard myName={myName} onSelectChat={startPrivateChat} onOpenGlobal={openGlobalChat} />}
          {activeTab === "GlobalChat" && (
            <>
               <button onClick={() => setActiveTab("Chat 💬")} className="mb-2 text-xs font-bold text-gray-500 hover:text-green-600 flex items-center gap-1">⬅ Kembali</button>
               <ChatRoom myName={myName} onUserClick={startPrivateChat} />
            </>
          )}
          {activeTab === "Private" && chatPartner && <PrivateChat myName={myName} partnerName={chatPartner} onBack={() => setActiveTab("Chat 💬")} />}
          {activeTab === "Profile" && <ProfileDashboard myName={myName} onLogout={handleLogout} onUserClick={startPrivateChat} />}
          
          {activeTab === "Home" && (
            <>
              <form onSubmit={handleSearch} className="mb-4 relative group">
                <input type="text" placeholder="Cari postingan, topik, atau user..." className="w-full p-3 pl-10 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
                {searchQuery && <button type="button" onClick={clearSearch} className="absolute right-3 top-2.5 text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-full transition">✖</button>}
              </form>

              {!isSearching && (
                <div className="flex gap-4 mb-4 border-b border-gray-200 pb-2 overflow-x-auto">
                  <button onClick={() => setSortBy("trending")} className={`text-sm font-bold pb-2 whitespace-nowrap transition ${sortBy === "trending" ? "text-green-600 border-b-2 border-green-600" : "text-gray-400 hover:text-gray-600"}`}>🔥 Lagi Panas</button>
                  <button onClick={() => setSortBy("newest")} className={`text-sm font-bold pb-2 whitespace-nowrap transition ${sortBy === "newest" ? "text-green-600 border-b-2 border-green-600" : "text-gray-400 hover:text-gray-600"}`}>✨ Baru Mateng</button>
                </div>
              )}

              {isSearching && <div className="mb-4 flex items-center justify-between"><span className="text-sm font-bold text-gray-600">Hasil pencarian: "{searchQuery}"</span><button onClick={clearSearch} className="text-xs text-green-600 font-bold hover:underline">Reset</button></div>}

              {!isSearching && <CreatePost myName={myName} />}
              
              <div className="space-y-4">
                {loading ? <div className="text-center py-10 text-gray-400">Loading Pear...</div> : posts.length === 0 ? <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300 p-8">{isSearching ? `Tidak ditemukan postingan tentang "${searchQuery}".` : "Belum ada postingan."}</div> : posts.map((post) => (<PostCard key={post.id} {...post} createdAt={post.created_at} onUserClick={startPrivateChat} myName={myName} />))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}