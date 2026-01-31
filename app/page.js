"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

// --- IMPORT SEMUA KOMPONEN ---
import Onboarding from "@/components/Onboarding";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import ProfileDashboard from "@/components/ProfileDashboard";
import Leaderboard from "@/components/Leaderboard";
import FriendList from "@/components/FriendList";
import NotificationList from "@/components/NotificationList";
import ChatDashboard from "@/components/ChatDashboard";
import PrivateChat from "@/components/PrivateChat";
import GroupChat from "@/components/GroupChat";
import Spaces from "@/components/Spaces";
import FeedbackForum from "@/components/FeedbackForum";
import UserProfile from "@/components/UserProfile";

export default function Home() {
  const [myName, setMyName] = useState("");
  const [activeTab, setActiveTab] = useState("feed"); // 'feed', 'spaces', 'feedback', 'profile'
  const [targetProfile, setTargetProfile] = useState(""); // Username profil yang sedang dilihat

  // State untuk Chat (Sidebar Kanan)
  const [chatMode, setChatMode] = useState("dashboard"); // 'dashboard', 'private', 'group'
  const [chatPartner, setChatPartner] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  // State Data Global
  const [posts, setPosts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // 1. Cek Login saat pertama buka
  useEffect(() => {
    const savedUser = localStorage.getItem("pear_username");
    if (savedUser) setMyName(savedUser);
  }, []);

  // 2. Setup Realtime Presence (Cek siapa yang Online)
  useEffect(() => {
    if (!myName) return;

    // Gabung ke channel global 'presence'
    const channel = supabase.channel("global_presence");

    channel
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState();
        const users = new Set();
        // Loop semua user yang connect
        for (let id in newState) {
          newState[id].forEach((u) => users.add(u.username));
        }
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            username: myName,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Load Postingan Awal
    fetchPosts();

    // Listener Post Baru
    const postChannel = supabase
      .channel("public:posts_feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          setPosts((prev) => [payload.new, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(postChannel);
    };
  }, [myName]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPosts(data);
  };

  // --- HANDLERS ---

  const handleLogout = () => {
    if (confirm("Yakin mau keluar?")) {
      localStorage.removeItem("pear_username");
      setMyName("");
      window.location.reload();
    }
  };

  const openProfile = (username) => {
    setTargetProfile(username);
    setActiveTab("profile");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openPrivateChat = (username) => {
    setChatPartner(username);
    setChatMode("private");
  };

  const openGroupChat = (group) => {
    setActiveGroup(group);
    setChatMode("group");
  };

  // --- RENDER UTAMA ---

  // 1. Kalau belum login, tampilkan Onboarding
  if (!myName) {
    return <Onboarding onFinish={(name) => setMyName(name)} />;
  }

  // 2. Kalau sudah login, tampilkan Dashboard Pear
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-gray-800 font-sans">
      {/* Container Utama (Max Width 1280px) */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 p-4 md:p-6">
        {/* --- KOLOM KIRI (Sidebar) --- */}
        <div className="hidden md:flex flex-col w-1/4 gap-6 sticky top-6 h-fit overflow-y-auto max-h-screen no-scrollbar">
          {/* Widget Profil Saya */}
          <ProfileDashboard
            myName={myName}
            onLogout={handleLogout}
            onViewProfile={() => openProfile(myName)}
          />

          {/* Leaderboard */}
          <Leaderboard />

          {/* Friend List (Buku Warga) */}
          <FriendList
            myName={myName}
            onlineUsers={onlineUsers}
            onSelectUser={openPrivateChat}
          />
        </div>

        {/* --- KOLOM TENGAH (Main Content) --- */}
        <div className="flex-1 w-full min-w-0">
          {/* Tab Navigasi Atas */}
          <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 p-2 rounded-2xl mb-6 shadow-sm flex justify-between items-center border border-gray-100">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("feed")}
                className={`px-6 py-2 rounded-xl font-bold text-sm transition ${activeTab === "feed" ? "bg-green-500 text-white shadow-lg shadow-green-200" : "text-gray-500 hover:bg-gray-100"}`}
              >
                🏠 Home
              </button>
              <button
                onClick={() => setActiveTab("spaces")}
                className={`px-6 py-2 rounded-xl font-bold text-sm transition ${activeTab === "spaces" ? "bg-purple-600 text-white shadow-lg shadow-purple-200" : "text-gray-500 hover:bg-gray-100"}`}
              >
                🎙️ Spaces
              </button>
              <button
                onClick={() => setActiveTab("feedback")}
                className={`px-6 py-2 rounded-xl font-bold text-sm transition ${activeTab === "feedback" ? "bg-orange-500 text-white shadow-lg shadow-orange-200" : "text-gray-500 hover:bg-gray-100"}`}
              >
                💡 Saran
              </button>
            </div>

            {/* Mobile Logout (Hidden on Desktop) */}
            <button
              onClick={handleLogout}
              className="md:hidden text-gray-400 p-2 text-xl"
            >
              🚪
            </button>
          </div>

          {/* KONTEN BERDASARKAN TAB */}
          <div className="min-h-[500px]">
            {/* 1. Tab Home Feed */}
            {activeTab === "feed" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <CreatePost myName={myName} onPostSuccess={fetchPosts} />
                <div className="space-y-6">
                  {posts.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                      <div className="text-4xl animate-bounce">🍐</div>
                      <p className="mt-4">
                        Belum ada postingan. Jadilah yang pertama!
                      </p>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <PostCard
                        key={post.id}
                        {...post}
                        myName={myName}
                        onUserClick={openProfile} // Klik avatar -> Buka Profil
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 2. Tab Spaces */}
            {activeTab === "spaces" && <Spaces myName={myName} />}

            {/* 3. Tab Feedback */}
            {activeTab === "feedback" && <FeedbackForum myName={myName} />}

            {/* 4. Tab User Profile */}
            {activeTab === "profile" && (
              <UserProfile
                targetUsername={targetProfile}
                myName={myName}
                onBack={() => setActiveTab("feed")}
                onChat={(target) => {
                  openPrivateChat(target); // Buka chat di sidebar kanan
                }}
              />
            )}
          </div>
        </div>

        {/* --- KOLOM KANAN (Chat & Notif) --- */}
        <div className="hidden lg:flex flex-col w-1/4 gap-6 sticky top-6 h-fit">
          {/* List Notifikasi */}
          <NotificationList myName={myName} />

          {/* Widget Chat */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-1 h-[600px] overflow-hidden">
            {chatMode === "dashboard" && (
              <div className="p-3 h-full overflow-y-auto">
                <h3 className="font-bold text-gray-800 mb-3 px-2">💬 Pesan</h3>
                <ChatDashboard
                  myName={myName}
                  onSelectChat={openPrivateChat}
                  onOpenGlobal={() =>
                    openGroupChat({
                      id: "global",
                      name: "Global Semesta",
                      admin: "system",
                    })
                  }
                  onSelectGroup={openGroupChat}
                  onlineUsers={onlineUsers}
                />
              </div>
            )}

            {chatMode === "private" && (
              <PrivateChat
                myName={myName}
                partnerName={chatPartner}
                onBack={() => setChatMode("dashboard")}
                onlineUsers={onlineUsers}
              />
            )}

            {chatMode === "group" && (
              <GroupChat
                group={activeGroup}
                myName={myName}
                onBack={() => setChatMode("dashboard")}
              />
            )}
          </div>
        </div>
      </div>

      {/* --- FOOTER MOBILE (Optional) --- */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 p-3 flex justify-around items-center z-50 pb-safe">
        <button onClick={() => setActiveTab("feed")} className="text-2xl">
          🏠
        </button>
        <button onClick={() => setActiveTab("spaces")} className="text-2xl">
          🎙️
        </button>
        <button onClick={() => openProfile(myName)} className="text-2xl">
          👤
        </button>
      </div>
    </div>
  );
}
