import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "sonner"; // Import Sonner

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "PEAR APP",
  description: "Komunitas Digital Seru-seruan",
  manifest: "/manifest.json", 
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      {/* Tambahkan dark:bg-slate-900 agar background full hitam di HP/Laptop */}
      <body className={`${inter.className} bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300`}>
        {children}
        
        {/* Notifikasi (Sonner) */}
        <Toaster position="top-center" richColors closeButton /> 
      </body>
    </html>
  );
}