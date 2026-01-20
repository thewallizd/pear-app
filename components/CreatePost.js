'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function CreatePost() {
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState('thought') // Default: thought (Nyeletuk)
  const [loading, setLoading] = useState(false)
  const [authorName, setAuthorName] = useState('Anonim') // State buat nyimpen nama

  // Ambil nama dari LocalStorage begitu komponen muncul
  useEffect(() => {
    const savedName = localStorage.getItem('pear_username')
    if (savedName) setAuthorName(savedName)
  }, [])

  // Konfigurasi Mode (Nyeletuk, Deep Talk, Suhu)
  const modes = {
    thought: { 
      label: 'Nyeletuk', 
      placeholder: 'Tulis celetukan singkat...', 
      hasTitle: false,
      buttonColor: 'bg-black',
      limit: 280 
    },
    discussion: { 
      label: 'Deep Talk', 
      placeholder: 'Jabarkan opinimu...', 
      titlePlaceholder: 'Topik Bahasan',
      hasTitle: true,
      buttonColor: 'bg-orange-600',
      limit: 2000
    },
    question: { 
      label: 'Suhu', 
      placeholder: 'Kasih konteks masalahnya...', 
      titlePlaceholder: 'Mau tanya apa?',
      hasTitle: true,
      buttonColor: 'bg-blue-600', 
      limit: 1000
    }
  }

  const currentMode = modes[type]

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validasi Input
    if (!content.trim()) return alert("Isi postingan tidak boleh kosong!")
    if (currentMode.hasTitle && !title.trim()) return alert("Judul wajib diisi!")

    setLoading(true)

    // Kirim ke Supabase
    const { error } = await supabase
      .from('posts')
      .insert([{ 
        title: currentMode.hasTitle ? title : null, 
        content, 
        type, 
        votes: 0,
        author: authorName // Menggunakan nama dari state
      }])

    setLoading(false)

    if (error) {
      alert('Gagal posting: ' + error.message)
    } else {
      // Sukses: Reset Form
      setContent('')
      setTitle('')
    }
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 mb-6 shadow-sm transition-all duration-300">
      
      {/* 1. TAB MODE SWITCHER */}
      <div className="flex gap-2 mb-4 bg-gray-50 p-1 rounded-lg">
        {Object.keys(modes).map((key) => (
          <button
            key={key}
            onClick={() => { 
              setType(key); 
              setTitle(''); 
              setContent(''); 
            }}
            className={`flex-1 text-xs font-bold py-2 rounded-md transition-all duration-200 ${
              type === key 
                ? 'bg-white text-gray-800 shadow-sm border border-gray-200' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {modes[key].label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* 2. INPUT JUDUL (Hanya muncul di Deep Talk & Suhu) */}
        {currentMode.hasTitle && (
          <div className="mb-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <input
              type="text"
              placeholder={currentMode.titlePlaceholder}
              className="w-full p-3 bg-gray-50 rounded-lg text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-100 transition border border-transparent focus:border-green-300"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        )}

        {/* 3. INPUT KONTEN */}
        <div className="relative">
          <textarea
            className="w-full p-3 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-100 transition resize-none border border-transparent focus:border-green-300"
            placeholder={currentMode.placeholder}
            rows={type === 'thought' ? 2 : 5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={currentMode.limit}
          />
          {/* Counter Karakter */}
          <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 font-mono bg-white/80 px-1 rounded">
            {content.length}/{currentMode.limit}
          </div>
        </div>

        {/* 4. FOOTER & TOMBOL KIRIM */}
        <div className="flex justify-between items-center mt-3">
          
          {/* Indikator Identitas (Baru!) */}
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400">Posting sebagai:</span>
            <span className="text-xs font-bold text-gray-700 truncate max-w-[100px]">
              {authorName}
            </span>
          </div>

          <button
            disabled={loading}
            className={`${currentMode.buttonColor} text-white px-6 py-2 rounded-full text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-md transform hover:scale-105 active:scale-95`}
          >
            {loading ? 'Mengirim...' : `Post ${modes[type].label}`}
          </button>
        </div>

      </form>
    </div>
  )
}