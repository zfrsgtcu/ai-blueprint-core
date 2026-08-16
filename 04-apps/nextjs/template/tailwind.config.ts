// {{ProjectName}} — TailwindCSS Konfigürasyonu
// AI: Projenin renk paletini ve font ailesini burada özelleştir.
// Brand renklerini proje tasarımına göre güncelle.

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand renkleri — proje tasarımına göre özelleştir
        // primary: {
        //   50: '#eff6ff',
        //   500: '#3b82f6',
        //   700: '#1d4ed8',
        // },
      },
      fontFamily: {
        // Brand font ailesi
        // sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
