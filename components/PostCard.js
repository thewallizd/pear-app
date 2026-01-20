import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 

export default function PostCard({ id, type = 'thought', user = 'Anonim', title, content, image_url, rating = 0, is_pinned = false, votes = 0, createdAt, onUserClick, myName }) {
  
  const [isVoting, setIsVoting] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [showComments, setShowComments] = useState(false); 
  const [comments, setComments] = useState([]); 
  const [newComment, setNewComment] = useState(''); 
  const [loadingComments, setLoadingComments] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isOwner, setIsOwner] = useState(false);
  const [pinnedStatus, setPinnedStatus] = useState(is_pinned); // Local state for immediate UI update

  const avatarUrl = `https://api.dicebear.com/9.x/notionists/svg?seed=${user}&backgroundColor=c0aede,b6e3f4,ffdfbf,ffd5dc&radius=50`;

  useEffect(() => {
    setIsOwner(user === myName);
    setEditContent(content);
    setPinnedStatus(is_pinned);

    const calculateTimeLeft = () => {
      const diff = new Date(createdAt).getTime() + (24 * 60 * 60 * 1000) - new Date().getTime();
      if (diff > 0) {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${h}j ${m}m`);
      } else setTimeLeft('Expired');
    };
    calculateTimeLeft();
    const t = setInterval(calculateTimeLeft, 60000); return () => clearInterval(t);
  }, [createdAt, user, myName, content, is_pinned]);

  const handleUpdatePost = async () => {
    if (!editContent.trim()) return;
    await supabase.from('posts').update({ content: editContent }).eq('id', id);
    setIsEditing(false); alert("Updated! 📝");
  };

  const handleDeletePost = async () => {
    if (window.confirm("Hapus selamanya?")) {
      await supabase.from('posts').delete().eq('id', id);
    }
  };

  // --- FITUR PIN POST ---
  const handleTogglePin = async () => {
    const newStatus = !pinnedStatus;
    setPinnedStatus(newStatus); // Update UI langsung biar cepet
    
    // Matikan pin postingan lain (opsional, kalau mau cuma 1 pin)
    // Tapi gaya Letterboxd bisa banyak fav, jadi kita biarkan multiple pin.
    
    await supabase.from('posts').update({ is_pinned: newStatus }).eq('id', id);
  };

  const fetchComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      const { data } = await supabase.from('comments').select('*').eq('post_id', id).order('created_at', { ascending: true });
      if (data) setComments(data);
      setLoadingComments(false);
    }
    setShowComments(!showComments); 
  };

  const handleSendComment = async (e) => {
    e.preventDefault(); if (!newComment.trim()) return;
    const author = localStorage.getItem('pear_username') || 'Anonim'; 
    const temp = { id: Date.now(), content: newComment, author, created_at: new Date().toISOString() };
    setComments([...comments, temp]); setNewComment(''); 
    await supabase.from('comments').insert([{ post_id: id, content: newComment, author }]);
    if (user !== author) await supabase.from('notifications').insert([{ recipient: user, sender: author, type: 'comment', post_id: id, message: `komen: "${newComment.substring(0, 10)}..."` }]);
  };

  const handleVote = async (val) => {
    if (isVoting) return; setIsVoting(true);
    await supabase.from('posts').update({ votes: votes + val }).eq('id', id);
    setIsVoting(false);
  };

  if (timeLeft === 'Expired') return null;

  const styles = {
    thought: { badge: 'bg-gray-100 text-gray-600', label: 'Nyeletuk' },
    review: { badge: 'bg-green-100 text-green-700', label: 'Review ⭐' },
    discussion: { badge: 'bg-orange-100 text-orange-700', label: 'Deep Talk' },
    question: { badge: 'bg-blue-100 text-blue-700', label: 'Tanya' }
  };
  const currentStyle = styles[type] || styles.thought;

  return (
    <div className={`rounded-xl p-5 shadow-sm transition-all mb-4 border bg-white border-gray-200 hover:shadow-md relative group ${pinnedStatus ? 'ring-2 ring-green-400 bg-green-50/30' : ''}`}>
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => onUserClick && onUserClick(user)} className="flex items-center gap-3 hover:bg-black/5 p-1 -ml-1 pr-3 rounded-full transition text-left">
          <img src={avatarUrl} className="w-10 h-10 rounded-full border border-gray-200"/>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 flex items-center gap-1">
              @{user}
              {pinnedStatus && <span className="text-[10px] bg-green-500 text-white px-1.5 rounded font-bold" title="Pinned by User">📌 PIN</span>}
            </span>
            <span className="text-[10px] text-gray-500">Baru saja</span>
          </div>
        </button>

        <div className="flex items-center gap-2">
           {/* RATING BINTANG ALA LETTERBOXD */}
           {type === 'review' && rating > 0 && (
            <div className="flex text-green-500 text-sm tracking-tighter drop-shadow-sm">
              {'★'.repeat(rating)}{'☆'.repeat(5-rating)}
            </div>
          )}

          <span className={`text-[10px] px-3 py-1 rounded-full border font-bold ${currentStyle.badge}`}>{currentStyle.label}</span>
          
          {isOwner && !isEditing && (
            <div className="flex bg-white/80 backdrop-blur rounded-lg border border-black/10 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 shadow-lg z-10">
              {/* TOMBOL PIN */}
              <button 
                onClick={handleTogglePin} 
                className={`p-2 transition ${pinnedStatus ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-400'}`}
                title={pinnedStatus ? "Unpin Post" : "Pin to Profile"}
              >
                📌
              </button>
              <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-yellow-100 text-yellow-600 transition">✏️</button>
              <button onClick={handleDeletePost} className="p-2 hover:bg-red-100 text-red-600 transition">🗑️</button>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="mb-4 pl-1">
        {type !== 'thought' && title && <h3 className="text-lg font-bold mb-2 leading-tight">{title}</h3>}
        
        {isEditing ? (
          <div>
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full p-3 rounded-lg border border-green-500 text-sm" rows="3"/>
            <div className="flex gap-2 mt-2 justify-end">
              <button onClick={() => setIsEditing(false)} className="text-xs text-gray-500 px-3 py-1 hover:bg-gray-100 rounded">Batal</button>
              <button onClick={handleUpdatePost} className="text-xs bg-green-600 text-white px-3 py-1 rounded">Simpan</button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-700">{content}</p>
            {image_url && (
              <div className="mt-3 rounded-lg overflow-hidden border border-gray-100">
                <img src={image_url} className="w-full h-auto max-h-[400px] object-cover hover:scale-105 transition duration-500 cursor-pointer" onClick={() => window.open(image_url, '_blank')}/>
              </div>
            )}
          </>
        )}
      </div>

      {/* FOOTER (Actions) */}
      <div className="flex items-center justify-between pt-3 border-t border-black/5">
        <div className="flex items-center bg-gray-50 rounded-full px-1 border border-black/5">
          <button onClick={() => handleVote(1)} disabled={isVoting} className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-full transition">▲</button>
          <span className={`text-xs font-bold min-w-5 text-center ${votes < 0 ? 'text-red-500' : 'text-gray-700'}`}>{votes}</span>
          <button onClick={() => handleVote(-1)} disabled={isVoting} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition">▼</button>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchComments} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-green-600">💬 {showComments ? 'Tutup' : 'Balas'}</button>
          <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded text-gray-400 bg-gray-50">⏳ {timeLeft}</div>
        </div>
      </div>

      {showComments && (
        <div className="mt-4 pt-3 border-t border-dashed border-gray-300 animate-in slide-in-from-top-2">
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {comments.map((c) => (
              <div key={c.id} className="bg-gray-50 p-2 rounded-lg text-sm flex gap-2">
                  <span className="font-bold text-green-700 text-xs">{c.author}:</span>
                  <span className="text-gray-700 text-xs">{c.content}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendComment} className="flex gap-2">
            <input type="text" placeholder="Tulis..." className="flex-1 text-xs p-2 rounded border" value={newComment} onChange={(e) => setNewComment(e.target.value)}/>
            <button disabled={!newComment.trim()} className="bg-green-600 text-white text-xs px-3 rounded font-bold">➤</button>
          </form>
        </div>
      )}
    </div>
  );
}