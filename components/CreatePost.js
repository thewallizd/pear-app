"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CreatePost({ myName, onPostSuccess }) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Ref untuk input file yang disembunyikan
  const fileInputRef = useRef(null);

  // 1. Handle saat user memilih foto
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Buat preview URL agar bisa dilihat user sebelum upload
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 2. Handle hapus foto (tombol X)
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 3. Proses Upload & Posting
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;

    setIsUploading(true);
    let finalImageUrl = null;

    try {
      // A. Jika ada foto, upload dulu ke Supabase Storage
      if (imageFile) {
        const fileName = `${Date.now()}_${imageFile.name.replace(/\s/g, "_")}`; // Nama file unik

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("uploads") // Pastikan nama bucket di Supabase adalah 'uploads'
          .upload(fileName, imageFile);

        if (uploadError) {
          console.error("Gagal upload gambar:", uploadError);
          alert("Gagal upload gambar. Coba lagi.");
          setIsUploading(false);
          return;
        }

        // B. Ambil URL Publik gambar
        const { data: urlData } = supabase.storage
          .from("uploads")
          .getPublicUrl(fileName);

        finalImageUrl = urlData.publicUrl;
      }

      // C. Simpan Postingan ke Database (Sertakan link gambar)
      const { error } = await supabase.from("posts").insert([
        {
          content: content,
          author: myName,
          image_url: finalImageUrl, // Kolom baru di database
          votes: 0,
        },
      ]);

      if (error) throw error;

      // D. Reset Form
      setContent("");
      removeImage();
      if (onPostSuccess) onPostSuccess(); // Refresh feed di halaman utama
    } catch (error) {
      console.error("Error posting:", error);
      alert("Gagal memposting. Cek koneksi.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6 animate-in fade-in">
      <div className="flex gap-4">
        <img
          src={`https://api.dicebear.com/9.x/notionists/svg?seed=${myName}&backgroundColor=c0aede,b6e3f4&radius=50`}
          alt="avatar"
          className="w-10 h-10 rounded-full border border-gray-100 bg-gray-50"
        />

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Apa yang sedang terjadi, @${myName}?`}
            className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder-gray-400 resize-none h-20"
            disabled={isUploading}
          />

          {/* Area Preview Gambar */}
          {imagePreview && (
            <div className="relative mb-3 w-fit">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-60 rounded-xl border border-gray-200"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 bg-gray-900/50 hover:bg-gray-900 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs backdrop-blur-sm transition"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-gray-50 pt-3 mt-2">
            <div className="flex gap-2">
              {/* Tombol Upload Gambar */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-green-500 hover:bg-green-50 p-2 rounded-full transition"
                title="Upload Foto"
              >
                📷
              </button>
              {/* Input File Tersembunyi */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />

              {/* Tombol Dummy (GIF/Emoji) */}
              <button className="text-gray-400 hover:bg-gray-50 p-2 rounded-full transition">
                GIF
              </button>
              <button className="text-gray-400 hover:bg-gray-50 p-2 rounded-full transition">
                😊
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={(!content.trim() && !imageFile) || isUploading}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-full font-bold text-sm shadow-lg shadow-green-100 transition transform active:scale-95"
            >
              {isUploading ? "Mengirim..." : "Posting"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
