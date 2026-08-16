/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      // {{ProjectName}} tasarım token'ları burada tanımlanır
      colors: {
        // primary: { ... },
        // secondary: { ... },
      },
      fontFamily: {
        // sans: ['Inter', 'sans-serif'],
        // heading: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
};
