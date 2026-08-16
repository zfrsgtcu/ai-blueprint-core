import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
// import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
export default defineConfig({
  // site: 'https://{DOMAIN}', // Production URL — deployment öncesi doldurun
  integrations: [tailwind()],

  // Çıktı modu: 'static' | 'server' | 'hybrid'
  // 'static' → Tamamen statik HTML (varsayılan, çoğu site için yeterli)
  // 'server' → SSR — her istekte server'da render (dinamik içerik için)
  // 'hybrid'  → Varsayılan static, belirli sayfalar SSR
  output: 'static',

  // Vercel adapter (SSR/hybrid mod için)
  // adapter: vercel(),

  // View Transitions API — sayfa geçiş animasyonları
  // experimental: {
  //   viewTransitions: true,
  // },
});
