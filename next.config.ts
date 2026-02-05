/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Opsi ini mematikan pengecekan error ketat saat Build */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  /* Opsi gambar agar tidak error saat load avatar dari luar */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
