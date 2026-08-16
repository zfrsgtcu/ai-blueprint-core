<!--
  BU DOSYANIN AMACI:
  AI ajanlarına Nuxt.js 3.x (Vue 3) ile proje geliştirirken uyması gereken best practice kurallarını öğretir.
  Composition API, SSR/SSG stratejisi, Pinia state yönetimi, server routes,
  performans optimizasyonu, SEO ve Vercel deployment kurallarını kapsar.
-->

# NUXT.JS 3.X — BEST PRACTICE RULES

## 1. GENEL PRENSİPLER

Nuxt.js, Vue 3 ekosisteminin en güçlü meta-framework'üdür. Temel felsefe: **SSR öncelikli, gerektiğinde SSG veya SPA, her zaman Composition API.**

1. 🔴 **ZORUNLU:** Server-side rendering (SSR) tercih edilmeli (SEO için kritik).
2. 🔴 **ZORUNLU:** `useFetch` veya `useAsyncData` ile SEO dostu veri çekme yapılmalı.
3. 🔴 **ZORUNLU:** Component'ler `components/` klasöründe organize edilmeli.
4. 🔴 **ZORUNLU:** Performance: `v-if` vs `v-show` doğru kullanımı (koşullu render).

## 2. COMPOSITION API KURALLARI

1. 🔴 **ZORUNLU:** Tüm component'ler `<script setup lang="ts">` ile yazılmalı. Options API kullanılmamalı.
2. 🔴 **ZORUNLU:** TypeScript kullanılmalı (`lang="ts"`).
3. 🟡 **ÖNERİLEN:** Composable'lar `use` prefix'i ile başlamalı (`useAuth`, `useProducts`).
4. 🟡 **ÖNERİLEN:** Props `defineProps<T>()` ile type-safe tanımlanmalı.

## 3. DATA FETCHING KURALLARI

| Hook | Kullanım Alanı | SSR'da Çalışır? |
|------|---------------|-----------------|
| `useFetch` | Basit API çağrıları, auto-refetch | ✅ Evet |
| `useAsyncData` | Karmaşık veri çekme, custom logic | ✅ Evet |
| `$fetch` | Event handler içinde (tıklama vb.) | ❌ Sadece client |
| `useLazyFetch` | Blocking olmayan, lazy loading | ✅ Evet (lazy) |

1. 🔴 **ZORUNLU:** Sayfa yüklenirken çekilen veriler için `useFetch` veya `useAsyncData` kullan. `$fetch` sadece event handler'larda.
2. 🔴 **ZORUNLU:** `useFetch`'in döndürdüğü `pending`, `error`, `data`, `refresh` değerlerini kullan.
3. 🟠 **YASAK:** Client-side'da `onMounted` içinde SSR gerektiren veriyi çekmek — hydration mismatch.
4. 🟡 **ÖNERİLEN:** `useFetch` base URL'sini `nuxt.config.ts`'te `runtimeConfig` ile tanımla.

```typescript
// nuxt.config.ts — API base URL
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: '{{API_BASE_URL}}'
    }
  }
})
```

## 4. STATE MANAGEMENT (PINIA) KURALLARI

1. 🔴 **ZORUNLU:** Pinia kullan, `@pinia/nuxt` modülünü `nuxt.config.ts`'e ekle.
2. 🔴 **ZORUNLU:** Her store `defineStore()` ile tanımlanmalı, id benzersiz olmalı.
3. 🟠 **YASAK:** Pinia store'unu component içinde tanımlamak — global olmalı.
4. 🟡 **ÖNERİLEN:** Store'lar feature-based organize edilmeli (`stores/auth.store.ts`, `stores/cart.store.ts`).
5. 🟡 **ÖNERİLEN:** API çağrılarını store içinde değil, composable'larda yap.

```typescript
// stores/{{modelName}}.store.ts — ÖRNEK
import { defineStore } from 'pinia';

export const use{{ModelName}}Store = defineStore('{{modelName}}', () => {
  const items = ref([]);
  const loading = ref(false);

  async function fetchAll() {
    loading.value = true;
    const { data } = await useFetch('/api/{{model_names}}');
    items.value = data.value ?? [];
    loading.value = false;
  }

  return { items, loading, fetchAll };
});
```

## 5. PERFORMANS KURALLARI

1. 🔴 **ZORUNLU:** `defineAsyncComponent` veya dinamik import ile component lazy load et.
2. 🔴 **ZORUNLU:** `<NuxtLink>` kullan — client-side navigation, preloading desteği.
3. 🟡 **ÖNERİLEN:** Önemli route'lar için `<NuxtLink prefetch>` ile preload.
4. 🟡 **ÖNERİLEN:** `@nuxt/image` ile resim optimizasyonu.
5. 🟠 **YASAK:** Büyük üçüncü parti kütüphaneleri direkt import etmek — lazy load veya dynamic import.

## 6. SEO KURALLARI

1. 🔴 **ZORUNLU:** `useHead()` veya `<Head>` component'i ile sayfa başına meta tag'leri tanımla.
2. 🔴 **ZORUNLU:** SSR modunda çalıştığından emin ol (SEO için).
3. 🟡 **ÖNERİLEN:** `@nuxtjs/sitemap` ile otomatik sitemap.
4. 🟡 **ÖNERİLEN:** Structured data (JSON-LD) ekle.
5. 🟡 **ÖNERİLEN:** `nuxt.config.ts`'te `site.url` alanını production URL ile doldur.

## 7. SERVER ROUTES KURALLARI

1. 🟡 **ÖNERİLEN:** Backend proxy veya BFF olarak `/server/api/` route'ları kullan.
2. 🟠 **YASAK:** Server route'larında sensitive data (API key, secret) expose etmek.
3. 🟡 **ÖNERİLEN:** Cookie-based auth token yönetimi için server route'lardan yararlan.
4. 🟡 **ÖNERİLEN:** `server/api/` altında HTTP method'una göre dosya adlandır: `products.get.ts`, `cart.post.ts`.

## 8. STYLING KURALLARI

1. 🔴 **ZORUNLU:** TailwindCSS kullan (proje standardı).
2. 🔴 **ZORUNLU:** `@nuxtjs/tailwindcss` modülünü `nuxt.config.ts`'e ekle.
3. 🟡 **ÖNERİLEN:** Scoped styling için `<style scoped>` kullan, global CSS `assets/css/` altında.

## 9. DEPLOYMENT KURALLARI (Vercel)

1. 🔴 **ZORUNLU:** Vercel için özel konfigürasyon gerekmez — Nuxt otomatik tanır.
2. 🔴 **ZORUNLU:** Build command: `nuxt build`, output: `.output/`.
3. 🔴 **ZORUNLU:** Environment variables Vercel dashboard'dan yönet. `runtimeConfig` ile eriş.
4. 🟡 **ÖNERİLEN:** `NITRO_PRESET=vercel` environment variable ile preset belirt.

## 10. YAYGIN HATALAR (AI'NIN KAÇINMASI GEREKENLER)

1. ❌ **Client-side'da SSR verisi çekmek** — hydration mismatch, SEO sorunu.
2. ❌ **Pinia store'u component içinde tanımlamak** — her render'da yeni store oluşur.
3. ❌ **Server route'larında sensitive data expose etmek** — API key'ler, secret'lar asla!
4. ❌ **`v-html` ile güvenli olmayan içerik render etmek** — XSS riski.
5. ❌ **Auto-import'ları anlamayıp manuel import yazmak** — gereksiz kod kalabalığı.
6. ❌ **`<a>` etiketi kullanmak** — client-side navigation kaybolur, `<NuxtLink>` kullan.
7. ❌ **`useFetch` yerine `$fetch` kullanmak** — SSR'da veri çekilmez, SEO etkilenir.

## 11. DİZİN YAPISI KONTROL LİSTESİ

AI, oluşturduğu Nuxt.js projesinde şunları kontrol etmelidir:

- [ ] `nuxt.config.ts` dosyası mevcut ve `@nuxtjs/tailwindcss` modülü eklenmiş
- [ ] `@pinia/nuxt` modülü eklenmiş (state management gerekiyorsa)
- [ ] `runtimeConfig.public.apiBase` tanımlanmış
- [ ] `app.vue` mevcut ve `<NuxtPage />` içeriyor
- [ ] `pages/index.vue` ana sayfa mevcut
- [ ] `components/` klasörü mevcut
- [ ] `composables/` klasörü mevcut
- [ ] `tailwind.config.js` mevcut
- [ ] `tsconfig.json` mevcut ve `extends` doğru
- [ ] `package.json`'da `nuxt`, `vue`, `@pinia/nuxt`, `@nuxtjs/tailwindcss` bağımlılıkları var
- [ ] `package.json`'da `build` script'i `nuxt build` olarak tanımlanmış
- [ ] Tüm component'ler `<script setup lang="ts">` ile yazılmış
