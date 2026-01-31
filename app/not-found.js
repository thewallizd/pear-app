import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 p-4">
      <h1 className="text-6xl font-black text-green-500 mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-4">Halaman Tidak Ditemukan 🍐</h2>
      <p className="text-gray-500 mb-8 text-center max-w-md">
        Sepertinya kamu tersesat di kebun pir. Halaman yang kamu cari tidak ada.
      </p>
      <Link 
        href="/" 
        className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition shadow-lg shadow-green-200"
      >
        Kembali ke Home 🏠
      </Link>
    </div>
  );
}