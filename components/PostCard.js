import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import Modal from "@/components/Modal"; 
import TimeAgo from "@/components/TimeAgo"; 
import { getAvatarUrl } from "@/lib/avatarUtils"; 

const linkify = (text) => {
  if (!text) return "";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-green-600 font-bold hover:underline hover:text-green-800 transition break-all" onClick={(e) => e.stopPropagation()}>
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function PostCard({ id, type = 'thought', user = 'Anonim', author, title, content, image_url, rating = 0, is_pinned = false, is_anonymous = false, votes = 0, createdAt, onUserClick, myName }) {
  
  const realAuthor = (user !== 'Anonim' && user) ? user : (author || 'Anonim');
  const [authorData, setAuthorData] = useState(null);

  const [isVoting, setIsVoting] = useState(false);
  const [showComments, setShowComments] = useState(false); 
  const [comments, setComments] = useState([]); 
  const [newComment, setNewComment] = useState(''); 
  const [loadingComments, setLoadingComments] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isOwner, setIsOwner] = useState(false);
  const [pinnedStatus, setPinnedStatus] = useState(is_pinned);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
        if (is_anonymous || realAuthor === 'Anonim') return;
        const { data } = await supabase.from("users").select("is_early_user, is_verified").eq("username", realAuthor).single();
        if (data) setAuthorData(data);
    };
    fetchUserData();
  }, [realAuthor, is_anonymous]);

  const displayName = is_anonymous ? "Warga Gelap" : realAuthor;
  let avatarUrl;
  if (is_anonymous) {
      avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=anon-${id}&radius=50`;
  } else {
      avatarUrl = getAvatarUrl(realAuthor); 
  }

  useEffect(() => {
    const isAdmin = myName === 'superadmin';
    setIsOwner(realAuthor === myName || isAdmin);
    setEditContent(content);
    setPinnedStatus(is_pinned);
  }, [realAuthor, myName, content, is_pinned]);

  const handleUpdatePost = async () => {
    if (!editContent.trim()) return;
    await supabase.from('posts').update({ content: editContent }).eq('id', id);
    setIsEditing(false); 
  };

  const confirmDelete = async () => {
    await supabase.from('posts').delete().eq('id', id);
    setShowDeleteModal(false);
  };

  const handleTogglePin = async () => {
    const newStatus = !pinnedStatus;
    setPinnedStatus(newStatus); 
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
    const currentAuthor = localStorage.getItem('pear_username') || 'Anonim'; 
    const temp = { id: Date.now(), content: newComment, author: currentAuthor, created_at: new Date().toISOString() };
    setComments([...comments, temp]); setNewComment(''); 
    await supabase.from('comments').insert([{ post_id: id, content: newComment, author: currentAuthor }]);
    if (realAuthor !== currentAuthor) {
      await supabase.from('notifications').insert([{ recipient: realAuthor, sender: currentAuthor, type: 'comment', post_id: id, message: `komen: "${newComment.substring(0, 10)}..."` }]);
    }
  };

  const handleVote = async (val) => {
    if (isVoting) return; setIsVoting(true);
    await supabase.from('posts').update({ votes: votes + val }).eq('id', id);
    setIsVoting(false);
  };

  const styles = {
    thought: { badge: 'bg-gray-100 text-gray-500', label: '💭 Nyeletuk', border: 'border-gray-200' },
    review: { badge: 'bg-purple-50 text-purple-600', label: '⭐ Review', border: 'border-purple-100' },
    discussion: { badge: 'bg-orange-50 text-orange-600', label: '☕ Deep Talk', border: 'border-orange-100' },
    question: { badge: 'bg-blue-50 text-blue-600', label: '☝️ Tanya', border: 'border-blue-100' }
  };
  const currentStyle = styles[type] || styles.thought;

  return (
    <div className={`group bg-white rounded-2xl p-5 mb-5 border transition-all duration-300 relative ${pinnedStatus ? 'border-green-400 bg-green-50/20 shadow-sm' : 'border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5'}`}>
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Hapus Postingan?" message="Yakin mau hapus?" type="confirm" onConfirm={confirmDelete} />

      {/* HEADER: USER INFO */}
      <div className="flex items-start justify-between mb-4">
        <div 
           onClick={() => !is_anonymous && onUserClick && onUserClick(realAuthor)}
           className={`flex items-center gap-3 ${!is_anonymous ? 'cursor-pointer' : ''}`}
        >
          <img src={avatarUrl} className="w-11 h-11 rounded-full border-2 border-white shadow-sm bg-gray-50 object-cover"/>
          <div>
             <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900 text-sm md:text-base hover:underline decoration-green-500 decoration-2 underline-offset-2">
                    @{displayName}
                </span>
                {/* BADGES */}
                {!is_anonymous && authorData && (
                  <div className="flex items-center gap-1">
                    {authorData.is_verified && <span className="text-blue-500 text-[10px] bg-blue-50 px-1 rounded border border-blue-100" title="Verified">✓</span>}
                    {authorData.is_early_user && <span className="text-sm drop-shadow-sm" title="🏅 Warga Perintis">🏅</span>}
                  </div>
                )}
             </div>
             <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
                <span><TimeAgo timestamp={createdAt} /></span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded-full border ${currentStyle.badge} ${currentStyle.border}`}>
                    {currentStyle.label}
                </span>
             </div>
          </div>
        </div>

        {/* MENU EDIT/DELETE (HOVER ONLY) */}
        {isOwner && !isEditing && (
            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden">
               {realAuthor === myName && (
                  <button onClick={handleTogglePin} className={`p-2 hover:bg-gray-50 ${pinnedStatus ? 'text-green-600' : 'text-gray-400'}`} title="Pin Post">📌</button>
               )}
               <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-yellow-50 text-gray-400 hover:text-yellow-600" title="Edit">✏️</button>
               <button onClick={() => setShowDeleteModal(true)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600" title="Hapus">🗑️</button>
            </div>
        )}
      </div>

      {/* CONTENT BODY */}
      <div className="mb-4">
        {type !== 'thought' && title && <h3 className="text-lg font-black text-gray-800 mb-2 leading-tight">{title}</h3>}
        
        {isEditing ? (
          <div className="bg-gray-50 p-2 rounded-xl border border-green-200">
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full p-2 bg-transparent focus:outline-none text-sm" rows="3"/>
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setIsEditing(false)} className="text-xs text-gray-500 font-bold px-3 py-1">Batal</button>
              <button onClick={handleUpdatePost} className="text-xs bg-green-600 text-white font-bold px-3 py-1 rounded-lg">Simpan</button>
            </div>
          </div>
        ) : (
          <div className="text-sm md:text-[15px] leading-relaxed text-gray-700 whitespace-pre-wrap">
            {linkify(content)}
          </div>
        )}

        {image_url && (
            <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                <img src={image_url} className="w-full h-auto max-h-[500px] object-cover hover:scale-105 transition duration-700 cursor-pointer" onClick={() => window.open(image_url, '_blank')}/>
            </div>
        )}

        {type === 'review' && rating > 0 && (
            <div className="mt-2 inline-flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                <span className="text-xs font-bold text-green-700">Rating:</span>
                <div className="flex text-orange-400 text-sm">{'★'.repeat(rating)}{'☆'.repeat(5-rating)}</div>
            </div>
        )}
      </div>

      {/* ACTION FOOTER */}
      <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-100">
        {/* VOTE BUTTONS */}
        <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
          <button onClick={() => handleVote(1)} disabled={isVoting} className="p-1.5 px-2 text-gray-400 hover:text-green-600 hover:bg-white rounded-lg transition shadow-none hover:shadow-sm">
             ▲
          </button>
          <span className={`text-xs font-black min-w-[20px] text-center ${votes > 0 ? 'text-green-600' : votes < 0 ? 'text-red-500' : 'text-gray-600'}`}>
            {votes}
          </span>
          <button onClick={() => handleVote(-1)} disabled={isVoting} className="p-1.5 px-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition shadow-none hover:shadow-sm">
             ▼
          </button>
        </div>

        {/* COMMENT BUTTON */}
        <button 
            onClick={fetchComments} 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition text-xs font-bold ${showComments ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          💬 <span className="hidden md:inline">{showComments ? 'Tutup Komentar' : 'Komentar'}</span>
        </button>
      </div>

      {/* COMMENTS SECTION */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {comments.length === 0 ? <div className="text-center text-xs text-gray-400 py-2">Belum ada komentar.</div> :
            comments.map((c) => (
              <div key={c.id} className="flex gap-2 text-sm group/comment">
                  <div className="w-0.5 bg-gray-200 rounded-full self-stretch"></div>
                  <div className="flex-1">
                      <span className="font-bold text-green-700 text-xs mr-2">@{c.author}</span>
                      <span className="text-gray-700 text-xs leading-relaxed">{c.content}</span>
                  </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendComment} className="flex gap-2 relative">
            <input type="text" placeholder="Tulis balasan..." className="flex-1 text-xs p-3 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition" value={newComment} onChange={(e) => setNewMessage(e.target.value)}/>
            <button disabled={!newComment.trim()} className="absolute right-1 top-1 bottom-1 bg-green-600 text-white px-3 rounded-lg font-bold text-xs hover:bg-green-700 transition">➤</button>
          </form>
        </div>
      )}
    </div>
  );
}