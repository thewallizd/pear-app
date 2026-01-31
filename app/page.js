"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

// Import Komponen
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

import Toast from "@/components/Toast";
import IncomingCall from "@/components/IncomingCall";

export default function Home() {
  const [myName, setMyName] = useState("");
  const [activeTab, setActiveTab] = useState("feed");
  const [targetProfile, setTargetProfile] = useState(""); 
  
  // State Chat
  const [chatMode, setChatMode] = useState("dashboard");
  const [chatPartner, setChatPartner] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  const [posts, setPosts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // State Notifikasi & Call
  const [toastMsg, setToastMsg] = useState(null); 
  const [incomingCall, setIncomingCall] = useState(null); // Telepon MASUK (Ringing)
  const [ongoingCall, setOngoingCall] = useState(null);   // Telepon BERLANGSUNG (Connected)

  const [realtimeStatus, setRealtimeStatus] = useState("🔴");

  useEffect(() => {
    const savedUser = localStorage.getItem("pear_username");
    if (savedUser) setMyName(savedUser);
  }, []);

  useEffect(() => {
    if (!myName) return;
    
    // Cek Panggilan "Nyangkut" Saat Refresh
    const checkActiveCall = async () => {
        const { data } = await supabase
            .from("calls")
            .select("*")
            .ilike("receiver", myName)
            .eq("status", "ringing")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
        if (data) setIncomingCall(data);
    };
    checkActiveCall();

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
                // Logika Penerima Telepon
                if (payload.new.receiver.toLowerCase() === myName.toLowerCase() && payload.new.status === 'ringing') {
                    setIncomingCall(payload.new);
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

    fetchPosts();
    return () => { supabase.removeChannel(channel); };
  }, [myName, chatMode, chatPartner]);

  const fetchPosts = async () => {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (data) setPosts(data);
  };

  const showToast = (msg, type="info") => { setToastMsg({ message: msg, type }); };

  const handleLogout = () => {
    if(confirm("Yakin ingin logout?")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  const openProfile = (username) => { setTargetProfile(username); setActiveTab("profile"); window.scrollTo(0,0); };
  const openPrivateChat = (username) => { setChatPartner(username); setChatMode("private"); setActiveTab("chat"); };

  // --- LOGIC ANSWER CALL (PERBAIKAN DISINI) ---
  const handleAnswerCall = async () => {
      if(!incomingCall) return;
      
      // 1. Update DB jadi accepted
      await supabase.from("calls").update({ status: 'accepted' }).eq("id", incomingCall.id);
      
      // 2. Simpan sesi telepon agar PrivateChat tahu
      setOngoingCall(incomingCall); 

      // 3. Pindah ke halaman chat
      setChatPartner(incomingCall.caller);
      setChatMode("private");
      setActiveTab("chat");
      
      // 4. Tutup overlay notifikasi
      setIncomingCall(null);
  };

  const handleRejectCall = async () => {
      if(!incomingCall) return;
      await supabase.from("calls").update({ status: 'rejected' }).eq("id", incomingCall.id);
      setIncomingCall(null);
  };

  if (!myName) return <Onboarding onFinish={setMyName} />;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 font-sans">
      {toastMsg && <Toast message={toastMsg.message} type={toastMsg.type} onClose={() => setToastMsg(null)} />}
      {incomingCall && <IncomingCall caller={incomingCall.caller} onAnswer={handleAnswerCall} onReject={handleRejectCall} />}

      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("feed")}>
            <span className="text-2xl">🍐</span>
            <div className="flex flex-col">
                <h1 className="text-xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent leading-none">PEAR</h1>
                <span className="text-[9px] text-gray-400 flex items-center gap-1">
                    {realtimeStatus === "🟢" ? "Server Connected" : "Connecting..."} {realtimeStatus}
                </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setActiveTab("feedback")} className="hidden md:block text-xs font-bold text-gray-400 hover:text-orange-500 transition">💡 Saran</button>
             <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition text-sm">Logout 🚪</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto flex gap-6 p-4 md:p-6">
        <aside className="hidden md:flex flex-col w-1/4 gap-6 sticky top-24 h-fit">
          <ProfileDashboard myName={myName} onLogout={handleLogout} onViewProfile={() => openProfile(myName)} />
          <Leaderboard />
          <FriendList myName={myName} onlineUsers={onlineUsers} onSelectUser={openPrivateChat} />
        </aside>

        <section className="flex-1 min-w-0">
          {activeTab === "feed" && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <CreatePost myName={myName} onPostSuccess={fetchPosts} />
              <div className="space-y-4">{posts.map(post => <PostCard key={post.id} {...post} myName={myName} onUserClick={openProfile} />)}</div>
            </div>
          )}
          {activeTab === "spaces" && <Spaces myName={myName} />}
          {activeTab === "notifications" && <div className="animate-in fade-in"><h2 className="text-xl font-black mb-4 px-2">Aktivitas Terbaru 🔔</h2><NotificationList myName={myName} /></div>}
          
          {activeTab === "chat" && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 h-[calc(100vh-180px)] md:h-[600px] overflow-hidden">
                {chatMode === "dashboard" && (
                    <div className="p-4 h-full overflow-y-auto">
                        <ChatDashboard myName={myName} onSelectChat={openPrivateChat} onOpenGlobal={() => { setActiveGroup({id:'global', name:'Global'}); setChatMode('group'); }} onSelectGroup={(g) => { setActiveGroup(g); setChatMode('group'); }} onlineUsers={onlineUsers} />
                    </div>
                )}
                {chatMode === "private" && (
                    <PrivateChat 
                        myName={myName} 
                        partnerName={chatPartner} 
                        onBack={() => setChatMode("dashboard")} 
                        onlineUsers={onlineUsers}
                        activeSession={ongoingCall} // <-- PENTING: Oper data telepon kesini
                    />
                )}
                {chatMode === "group" && <GroupChat group={activeGroup} myName={myName} onBack={() => setChatMode("dashboard")} />}
            </div>
          )}

          {activeTab === "profile" && <UserProfile targetUsername={targetProfile} myName={myName} onBack={() => setActiveTab("feed")} onChat={openPrivateChat} />}
          {activeTab === "feedback" && <FeedbackForum myName={myName} />}
          {activeTab === "leaderboard" && <div className="animate-in fade-in"><h2 className="text-xl font-black mb-4 px-2">Peringkat Warga 🏆</h2><Leaderboard /><div className="mt-6"><FriendList myName={myName} onlineUsers={onlineUsers} onSelectUser={openPrivateChat} /></div></div>}
        </section>

        <aside className="hidden lg:flex flex-col w-1/4 gap-6 sticky top-24 h-fit">
          <NotificationList myName={myName} />
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
             <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">💬 Pesan Cepat</h3>
             <div className="h-[400px] overflow-hidden"><ChatDashboard myName={myName} onSelectChat={openPrivateChat} onSelectGroup={(g)=>{setActiveGroup(g); setChatMode('group'); setActiveTab('chat')}} onlineUsers={onlineUsers} /></div>
          </div>
        </aside>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center p-3 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab("feed")} className={`flex flex-col items-center gap-1 transition ${activeTab === 'feed' ? 'text-green-600 scale-110' : 'text-gray-400'}`}><span className="text-xl">🏠</span><span className="text-[10px] font-bold">Home</span></button>
        <button onClick={() => setActiveTab("chat")} className={`flex flex-col items-center gap-1 transition ${activeTab === 'chat' ? 'text-blue-600 scale-110' : 'text-gray-400'}`}><div className="relative"><span className="text-xl">💬</span></div><span className="text-[10px] font-bold">Chat</span></button>
        <button onClick={() => setActiveTab("spaces")} className={`flex flex-col items-center gap-1 transition ${activeTab === 'spaces' ? 'text-purple-600 scale-110' : 'text-gray-400'}`}><span className="text-xl">🎙️</span><span className="text-[10px] font-bold">Spaces</span></button>
        <button onClick={() => setActiveTab("notifications")} className={`flex flex-col items-center gap-1 transition ${activeTab === 'notifications' ? 'text-orange-500 scale-110' : 'text-gray-400'}`}><span className="text-xl">🔔</span><span className="text-[10px] font-bold">Notif</span></button>
        <button onClick={() => setActiveTab("leaderboard")} className={`flex flex-col items-center gap-1 transition ${activeTab === 'leaderboard' ? 'text-yellow-600 scale-110' : 'text-gray-400'}`}><span className="text-xl">🏆</span><span className="text-[10px] font-bold">Rank</span></button>
      </nav>
    </div>
  );
}