import Link from 'next/link';
import { Home, FileQuestion } from 'lucide-react'; // Import Ikon Lucide

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white p-4 transition-colors">
      
      {/* Ikon Besar Animasi */}
      <div className="mb-6 relative">
         <div className="absolute inset-0 bg-green-400 blur-3xl opacity-20 rounded-full"></div>
         <FileQuestion size={120} className="text-green-500 dark:text-green-400 relative z-10 animate-bounce" />
      </div>

      <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-600 mb-2">
        404
      </h1>
      
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        Halaman Hilang <span className="text-2xl">🍐</span>
      </h2>
      
      <p className="text-gray-500 dark:text-slate-400 mb-8 text-center max-w-md leading-relaxed">
        Sepertinya kamu tersesat di kebun pir yang salah. Halaman yang kamu cari mungkin sudah dipanen atau memang tidak pernah ada.
      </p>
      
      <Link 
        href="/" 
        className="bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-700 hover:scale-105 transition shadow-lg shadow-green-200 dark:shadow-none flex items-center gap-2"
      >
        <Home size={20} /> Kembali ke Home
      </Link>
    </div>
  );
}