import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    strictPort: false,
  },
  resolve: {
    alias: {
      $lib: '/src/lib',
      $stores: '/src/lib/stores',
      $types: '/src/lib/types',
    },
  },
});
