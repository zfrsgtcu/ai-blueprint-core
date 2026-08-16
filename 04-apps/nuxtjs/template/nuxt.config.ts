// {{ProjectName}} — Nuxt.js Konfigürasyonu
// AI: runtimeConfig.public.apiBase değerini gerçek backend URL'i ile değiştir.
// site.url değerini production domain ile değiştir.

export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],

  runtimeConfig: {
    public: {
      apiBase: '{{API_BASE_URL}}',
    },
  },

  // SSR varsayılan olarak aktif
  ssr: true,

  app: {
    head: {
      htmlAttrs: { lang: 'tr' },
      titleTemplate: '%s — {{ProjectName}}',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
    },
  },

  site: {
    url: 'https://{DOMAIN}',
  },

  // Nitro (server engine) konfigürasyonu
  nitro: {
    // Vercel için otomatik algılanır, manuel preset:
    // preset: 'vercel',
  },

  compatibilityDate: '2025-07-20',
});
