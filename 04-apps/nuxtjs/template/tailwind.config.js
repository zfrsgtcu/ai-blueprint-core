// {{ProjectName}} — TailwindCSS Konfigürasyonu
// AI: Projenin renk paletini ve font ailesini burada özelleştir.
// Brand renklerini proje tasarımına göre güncelle.

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './error.vue',
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
