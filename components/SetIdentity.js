'use client'
import { useState, useEffect } from 'react'

export default function SetIdentity() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    // Cek apakah sudah ada nama di penyimpanan browser (Local Storage)
    const savedName = localStorage.getItem('pear_username')
    if (!savedName) {
      setIsOpen(true) // Kalau belum ada, munculkan popup
    }
  }, [])

  const handleSave = (e) => {
    e.preventDefault()
    if (!name.trim()) return alert("Nama panggilan wajib diisi!")
    
    // Simpan ke browser biar gak ditanya lagi
    localStorage.setItem('pear_username', name)
    setIsOpen(false)
    window.location.reload() // Refresh halaman biar nama langsung aktif
  }

  if (!isOpen) return null

  return (
    // Overlay Hitam Transparan
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      
      {/* Kotak Popup */}
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-300">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🍐</div>
          <h2 className="text-xl font-bold text-gray-800">Selamat Datang di Pear!</h2>
          <p className="text-gray-500 text-sm mt-1">Biar sirkel tau ini siapa, pakai nama panggilanmu ya.</p>
        </div>

        <form onSubmit={handleSave}>
          <input
            type="text"
            placeholder="Contoh: Budi Gemez"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mb-4 text-center font-bold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={15}
            autoFocus
          />
          
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-lg transform active:scale-95">
            Masuk ke Sirkel 🚀
          </button>
        </form>
      </div>
    </div>
  )
}