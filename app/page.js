// Bismillah deploy fix

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; 
import CreatePost from "@/components/CreatePost"; 
import PostCard from "@/components/PostCard"; 
import SetIdentity from "@/components/SetIdentity"; 

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. STATE BARU: Untuk mengatur Tab yang aktif (Home atau Profile)
  const [activeTab, setActiveTab] = useState("Home");
  const [myName, setMyName] = useState("");

  useEffect(() => {

    setMyName(localStorage.getItem('pear_username') || "");

    const fetchPosts = async () => {

      const yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString();

      const { data } = await supabase
        .from("posts")
        .select("*")
        .gt("created_at", yesterday) 
        .order("votes", { ascending: false });

      if (data) setPosts(data);
      setLoading(false);
    };

    fetchPosts();

    const channel = supabase
      .channel("realtime posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPosts((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setPosts((prev) =>
              prev.map((post) => (post.id === payload.new.id ? payload.new : post))
                  .sort((a, b) => b.votes - a.votes)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. LOGIKA FILTER: Tentukan postingan mana yang ditampilkan
  const displayedPosts = activeTab === "Profile" 
    ? posts.filter((post) => post.author === myName) // Kalau tab Profile, ambil punya sendiri
    : posts; // Kalau Home, ambil semua

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-6xl mx-auto flex gap-6 px-4 pt-6">
        
        {/* --- Sidebar Kiri (Menu Aktif) --- */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 space-y-2 sticky top-6 h-fit">
          <div className="text-2xl font-bold text-green-600 mb-6 flex items-center gap-2">
            🍐 Pear <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Beta</span>
          </div>
          
          {["Home", "Explore", "Notifications", "Profile"].map((item) => (
            <button
              key={item}
              onClick={() => setActiveTab(item)} // Ganti Tab saat diklik
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
                activeTab === item 
                  ? "bg-green-50 text-green-700 shadow-sm font-bold border border-green-100" // Style Tab Aktif
                  : "text-gray-700 hover:bg-white hover:shadow-sm"
              }`}
            >
              <span>{item}</span>
            </button>
          ))}
        </aside>

        {/* --- Feed Tengah --- */}
        <main className="flex-1 w-full max-w-2xl pb-20 relative">
          <SetIdentity />
          
          {/* Header Mobile */}
          <div className="md:hidden flex justify-between items-center mb-4 sticky top-0 bg-gray-50/95 backdrop-blur z-10 py-2">
            <h1 className="text-xl font-bold text-green-600">Pear 🍐</h1>
            {/* Menu Mobile Sederhana */}
            <button onClick={() => setActiveTab(activeTab === 'Home' ? 'Profile' : 'Home')} className="text-xs font-bold border px-2 py-1 rounded">
              {activeTab === 'Home' ? 'Ke Profil 👤' : 'Ke Home 🏠'}
            </button>
          </div>

          {/* JUDUL HALAMAN (Biar tau lagi di mana) */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === "Home" ? "Sirkel Feed 🌎" : `Postingan ${myName} 👤`}
            </h2>
            <p className="text-sm text-gray-500">
              {activeTab === "Home" 
                ? "Apa yang sedang trending di sirkelmu." 
                : "Koleksi celoteh dan diskusi yang kamu buat."}
            </p>
          </div>

          {/* CreatePost hanya muncul di Home */}
          {activeTab === "Home" && <CreatePost />}

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10 text-gray-400">Loading Pear...</div>
            ) : displayedPosts.length === 0 ? (
              <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300 p-8">
                {activeTab === "Profile" 
                  ? "Kamu belum pernah posting apa-apa. Yuk mulai nyeletuk! 🍐" 
                  : "Belum ada postingan."}
              </div>
            ) : (
              displayedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  type={post.type}
                  user={post.author || "Anonim"}
                  title={post.title}
                  content={post.content}
                  votes={post.votes || 0}
                  timeLeft="24h"   
                  createdAt={post.created_at} 
                />
              ))
            )}
          </div>
        </main>

        {/* --- Widget Kanan --- */}
        <aside className="hidden lg:block w-80 shrink-0 space-y-4 sticky top-6 h-fit">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3">Statistik Kamu 📊</h3>
            <div className="text-sm text-gray-600 flex justify-between mb-2">
              <span>Total Post:</span>
              <span className="font-bold">{posts.filter(p => p.author === myName).length}</span>
            </div>
            <div className="text-sm text-gray-600 flex justify-between">
              <span>Status:</span>
              <span className="text-green-600 font-bold bg-green-50 px-2 rounded">Online</span>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}