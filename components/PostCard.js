import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 

export default function PostCard({ id, type = 'thought', user = 'Anonim', title, content, votes = 0, createdAt }) {
  
  // State Dasar
  const [isVoting, setIsVoting] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isRotten, setIsRotten] = useState(false);

  // State Komentar
  const [showComments, setShowComments] = useState(false); // Buka/Tutup
  const [comments, setComments] = useState([]); // Daftar komentar
  const [newComment, setNewComment] = useState(''); // Input komentar baru
  const [loadingComments, setLoadingComments] = useState(false);

  // --- LOGIKA 1: TIMER BUSUK (Sama seperti sebelumnya) ---
  useEffect(() => {
    const calculateTimeLeft = () => {
      const postDate = new Date(createdAt).getTime();
      const now = new Date().getTime();
      const expirationDate = postDate + (24 * 60 * 60 * 1000); 
      const difference = expirationDate - now;

      if (difference <= 0) {
        setIsRotten(true);
      } else {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}j ${minutes}m`);
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); 
    return () => clearInterval(timer);
  }, [createdAt]);

  // --- LOGIKA 2: FETCH KOMENTAR ---
  const fetchComments = async () => {
    if (!showComments) {
      // Kalau mau dibuka, ambil datanya dulu
      setLoadingComments(true);
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: true });
      
      if (data) setComments(data);
      setLoadingComments(false);
    }
    setShowComments(!showComments); // Toggle Buka/Tutup
  };

  // --- LOGIKA 3: KIRIM KOMENTAR ---
  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const authorName = localStorage.getItem('pear_username') || 'Anonim'; // Pakai nama asli

    // Optimistic Update (Biar terasa cepat, langsung tampilkan sebelum request selesai)
    const optimisticComment = {
      id: Date.now(), // ID sementara
      content: newComment,
      author: authorName,
      created_at: new Date().toISOString()
    };
    setComments([...comments, optimisticComment]);
    setNewComment(''); // Kosongkan input

    // Kirim ke Database
    const { error } = await supabase
      .from('comments')
      .insert([{ post_id: id, content: newComment, author: authorName }]);

    if (error) {
      alert('Gagal komentar!');
      // Kalau gagal, harusnya kita hapus lagi (tapi buat simpel biarkan dulu)
    }
  };

  // --- LOGIKA 4: VOTING ---
  const handleVote = async (value) => {
    if (isVoting) return; 
    setIsVoting(true);
    await supabase.from('posts').update({ votes: votes + value }).eq('id', id);
    setIsVoting(false);
  };

  if (isRotten) return null;

  // Style Configuration
  const styles = {
    thought: { 
      badge: 'bg-gray-100 text-gray-600', label: 'Nyeletuk 💬', 
      cardBorder: 'border-gray-200', bgColor: 'bg-white', titleColor: 'hidden' 
    },
    discussion: { 
      badge: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Deep Talk ☕', 
      cardBorder: 'border-orange-200', bgColor: 'bg-orange-50/30', titleColor: 'text-gray-900' 
    },
    question: { 
      badge: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Tanya Suhu ☝️', 
      cardBorder: 'border-blue-200 border-2', bgColor: 'bg-blue-50/50', titleColor: 'text-blue-900' 
    }
  };

  const currentStyle = styles[type] || styles.thought;
  const initial = user ? user.charAt(0).toUpperCase() : '?';

  return (
    <div className={`rounded-xl p-5 shadow-sm transition-all duration-500 mb-4 border ${currentStyle.cardBorder} ${currentStyle.bgColor} hover:shadow-md`}>
      
      {/* HEADER & BODY (Sama) */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-700 text-sm font-bold shadow-sm">
            {initial}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900">@{user}</span>
            <span className="text-[10px] text-gray-500">Baru saja</span>
          </div>
        </div>
        <span className={`text-[10px] px-3 py-1 rounded-full border font-bold ${currentStyle.badge}`}>
          {currentStyle.label}
        </span>
      </div>

      <div className="mb-4 pl-1">
        {type !== 'thought' && title && (
          <h3 className={`text-lg font-bold mb-2 leading-tight ${currentStyle.titleColor}`}>{title}</h3>
        )}
        <p className={`text-sm whitespace-pre-wrap leading-relaxed ${type === 'thought' ? 'text-gray-800 text-base font-medium' : 'text-gray-600'}`}>
          {content}
        </p>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between pt-3 border-t border-black/5">
        <div className="flex items-center bg-white/80 rounded-full px-1 border border-black/5 shadow-sm">
          <button onClick={() => handleVote(1)} disabled={isVoting} className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition active:scale-90">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          </button>
          <span className={`text-xs font-bold min-w-5 text-center transition-all ${votes < 0 ? 'text-red-500' : 'text-gray-700'}`}>{votes}</span>
          <button onClick={() => handleVote(-1)} disabled={isVoting} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition active:scale-90">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>

        <div className="flex gap-3">
          {/* TOMBOL BUKA KOMENTAR */}
          <button 
            onClick={fetchComments}
            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-green-600 hover:bg-green-50 px-2 rounded transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>{showComments ? 'Tutup' : 'Balas'}</span>
          </button>
          
          <div className={`flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded transition-colors ${timeLeft.includes('j') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
            <span>⏳ {timeLeft}</span>
          </div>
        </div>
      </div>

      {/* --- SECTION KOMENTAR (Muncul kalau diklik) --- */}
      {showComments && (
        <div className="mt-4 pt-3 border-t border-dashed border-gray-300 animate-in slide-in-from-top-2 duration-200">
          
          {/* List Komentar */}
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {loadingComments ? (
              <p className="text-xs text-center text-gray-400 italic">Memuat balasan...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-center text-gray-400 italic">Belum ada balasan. Jadilah yang pertama!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="bg-white/60 p-2.5 rounded-lg border border-gray-100 text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-green-700">{c.author}</span>
                    <span className="text-[9px] text-gray-400">Barusan</span>
                  </div>
                  <p className="text-gray-700 text-xs leading-relaxed">{c.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Form Input Komentar */}
          <form onSubmit={handleSendComment} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Tulis balasan..." 
              className="flex-1 text-xs p-2 rounded-lg border border-gray-300 focus:outline-none focus:border-green-500 bg-white"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button 
              disabled={!newComment.trim()}
              className="bg-green-600 text-white text-xs px-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
            >
              ➤
            </button>
          </form>

        </div>
      )}
    </div>
  );
}