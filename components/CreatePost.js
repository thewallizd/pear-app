"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CreatePost({ myName }) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("File terlalu besar! Maksimal 2MB.");
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;
    setIsSubmitting(true);

    let finalImageUrl = null;

    // 1. Upload Gambar ke Supabase Storage (Jika ada)
    if (imageFile) {
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { data, error } = await supabase.storage.from('uploads').upload(fileName, imageFile);
        
        if (error) {
            console.error("Upload error:", error);
            alert("Gagal upload gambar, coba lagi.");
            setIsSubmitting(false);
            return;
        }
        
        // Dapatkan Public URL
        const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
    }

    // 2. Simpan Postingan ke Database
    const { error } = await supabase.from("posts").insert([
      { 
        content, 
        author: myName, 
        image_url: finalImageUrl, // Kolom baru (pastikan tabel posts punya kolom image_url text)
        votes: 0 
      },
    ]);

    if (error) {
      alert("Gagal memposting!");
    } else {
      setContent("");
      setImageFile(null);
      setPreviewUrl(null);
      // Reset input file
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6 transition-all focus-within:ring-2 focus-within:ring-green-100">
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full bg-transparent p-2 outline-none text-gray-700 placeholder-gray-400 resize-none"
          rows="3"
          placeholder={`Apa yang sedang terjadi, @${myName}?`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        
        {/* Preview Gambar */}
        {previewUrl && (
            <div className="relative mt-2 mb-4">
                <img src={previewUrl} className="w-full max-h-60 object-cover rounded-xl border border-gray-200" />
                <button 
                    type="button"
                    onClick={() => { setImageFile(null); setPreviewUrl(null); }}
                    className="absolute top-2 right-2 bg-gray-900/50 text-white rounded-full p-1 hover:bg-red-500 transition"
                >
                    ✕
                </button>
            </div>
        )}

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
          <div className="flex gap-2">
            {/* Tombol Upload Hidden */}
            <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*" 
                onChange={handleImageChange} 
                className="hidden" 
            />
            <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="text-green-500 hover:bg-green-50 p-2 rounded-full transition" 
                title="Tambah Foto"
            >
              📷
            </button>
            <button type="button" className="text-gray-400 hover:bg-gray-50 p-2 rounded-full transition cursor-not-allowed">📍</button>
          </div>
          
          <button
            disabled={isSubmitting || (!content && !imageFile)}
            className="bg-green-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-green-200"
          >
            {isSubmitting ? "Mengirim..." : "Post 🚀"}
          </button>
        </div>
      </form>
    </div>
  );
}