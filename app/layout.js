import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Pear - Your Exclusive Space",
  description: "Platform sosial universal untuk diskusi, berbagi cerita, dan menemukan koneksi bermakna.",
  generator: 'Next.js',
  applicationName: 'Pear App',
  keywords: ['Pear', 'Social Media', 'Depok', 'Komunitas', 'Chat'],
  authors: [{ name: 'Pear Team' }],
  creator: 'Pear Team',
  openGraph: {
    title: "Pear - Your Exclusive Space",
    description: "Gabung dengan semesta Pear. Diskusi tanpa batas.",
    url: "https://pear-app.vercel.app",
    siteName: "Pear App",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pear App",
    description: "Ruang eksklusif untuk koneksi yang bermakna.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}