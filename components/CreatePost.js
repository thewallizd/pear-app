"use client";
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function CreatePost({ myName }) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('thought'); 
  const [isPosting, setIsPosting] = useState(false);
  
  // STATE BARU: GAMBAR & RATING
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rating, setRating] = useState(0); // 0 - 5
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("File kegedean! Maksimal 2MB ya.");
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;

    setIsPosting(true);
    const authorName = myName || 'Anonim'; 
    let uploadedImageUrl = null;

    if (imageFile) {
      const fileName = `${Date.now()}-${authorName}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage.from('post-images').upload(fileName, imageFile);
      if (uploadError) { alert("Gagal upload gambar"); setIsPosting(false); return; }
      const { data: publicData } = supabase.storage.from('post-images').getPublicUrl(fileName);
      uploadedImageUrl = publicData.publicUrl;
    }

    const { error } = await supabase.from('posts').insert([{ 
      title: type === 'thought' ? null : title,
      content, 
      type,
      votes: 0,
      author: authorName,
      image_url: uploadedImageUrl,
      rating: type === 'review' ? rating : 0, // Simpan rating cuma kalau tipe Review
      is_pinned: false
    }]);

    if (!error) {
      setContent(''); setTitle(''); setType('thought'); setImageFile(null); setPreviewUrl(null); setRating(0);
    } else {
      alert("Gagal posting!");
    }
    setIsPosting(false);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 transition-all">
      
      {/* Tipe Post: Tambah 'Review' */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'thought', label: '💭 Nyeletuk', color: 'bg-gray-100 text-gray-600' },
          { id: 'review', label: '⭐ Review', color: 'bg-green-100 text-green-700' }, // <--- TIPE BARU
          { id: 'discussion', label: '☕ Deep Talk', color: 'bg-orange-100 text-orange-700' },
          { id: 'question', label: '☝️ Tanya', color: 'bg-blue-100 text-blue-700' }
        ].map((t) => (
          <button key={t.id} onClick={() => setType(t.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${type === t.id ? 'bg-green-600 text-white shadow-md transform scale-105' : `${t.color} hover:opacity-80`}`}>{t.label}</button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Input Judul (Untuk Review, Discussion, Question) */}
        {type !== 'thought' && (
          <input type="text" placeholder={type === 'review' ? "Apa yang mau di-review?" : "Topik bahasannya apa?"} className="w-full mb-2 p-2 text-sm font-bold border-b border-gray-100 focus:outline-none focus:border-green-500 bg-transparent" value={title} onChange={(e) => setTitle(e.target.value)} />
        )}

        {/* INPUT BINTANG (Khusus Review) */}
        {type === 'review' && (
          <div className="flex gap-1 mb-2 animate-in slide-in-from-left-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star} 
                type="button" 
                onClick={() => setRating(star)}
                className={`text-2xl transition hover:scale-125 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
              >
                ★
              </button>
            ))}
            <span className="text-xs text-gray-400 self-center ml-2">({rating}/5)</span>
          </div>
        )}

        <textarea className="w-full p-2 text-sm bg-transparent focus:outline-none resize-none placeholder-gray-400" rows="3" placeholder={`Tulis sesuatu...`} value={content} onChange={(e) => setContent(e.target.value)} />

        {previewUrl && (
          <div className="relative mt-2 mb-2 w-fit">
            <img src={previewUrl} className="max-h-40 rounded-lg border border-gray-200" />
            <button type="button" onClick={() => { setImageFile(null); setPreviewUrl(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">✖</button>
          </div>
        )}

        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current.click()} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition">🖼️</button>
            <span className="text-[10px] text-gray-400">Posting sebagai: <span className="font-bold text-green-600">@{myName}</span></span>
          </div>
          <button disabled={isPosting || (!content.trim() && !imageFile)} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition disabled:opacity-50">{isPosting ? '...' : 'Post 🚀'}</button>
        </div>
      </form>
    </div>
  );
}