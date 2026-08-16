// {{ProjectName}} — Next.js Konfigürasyonu
// AI: images.remotePatterns'a kullanılacak CDN/image domain'lerini ekle.
// API proxy için rewrites tanımla.

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Kullanılan CDN veya image domain'leri
      // { protocol: 'https', hostname: 'cdn.{DOMAIN}' },
    ],
  },

  // Backend API proxy (opsiyonel)
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: '{{API_BASE_URL}}/:path*',
  //     },
  //   ];
  // },
};

module.exports = nextConfig;
