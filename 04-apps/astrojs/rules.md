<!--
  BU DOSYANIN AMACI:
  AI ajanlarına Astro.js 4.x ile proje geliştirirken uyması gereken best practice kurallarını öğretir.
  Islands architecture, Content Collections, View Transitions API, performans optimizasyonu,
  SEO ve Vercel deployment kurallarını kapsar.
-->

# ASTRO.JS 4.X — BEST PRACTICE RULES

## 1. GENEL PRENSİPLER

Astro.js'in temel felsefesi: **mümkün olduğunca statik, sadece gerektiğinde interaktif.**

1. 🔴 **ZORUNLU:** Mümkün olduğunca `static` çıktı modu kullan. Sadece gerçekten dinamik içerik gerektiğinde SSR/hybrid moda geç.
2. 🔴 **ZORUNLU:** Asset optimizasyonu: resimler `public/` altında tutulmalı, `<Image>` component'i kullanılmalı.
3. 🔴 **ZORUNLU:** Content Collections ile **tip güvenli** içerik yönetimi yapılmalı.
4. 🔴 **ZORUNLU:** Core Web Vitals hedefleri: **LCP < 2.5s**, **FID < 100ms**, **CLS < 0.1**.

## 2. RENDERING STRATEJİSİ

### 2.1. Output Mode Seçimi

| Mod | Kullanım Alanı | Konfigürasyon |
|-----|---------------|---------------|
| `static` | Kurumsal site, landing page, blog | `output: 'static'` (varsayılan) |
| `server` | Dinamik içerik, auth gerektiren sayfalar | `output: 'server'` + adapter |
| `hybrid` | Çoğu statik, birkaç dinamik sayfa | `output: 'hybrid'` + `export const prerender = false` |

### 2.2. Islands Architecture Kuralları

1. 🔴 **ZORUNLU:** Her component için doğru hydration directive'i kullan:
   - `client:load` → Sayfa yüklenir yüklenmez interaktif olması gereken kritik component'ler
   - `client:visible` → Kullanıcı görene kadar beklenebilecek component'ler (below-the-fold)
   - `client:idle` → Sayfa idle olana kadar beklenebilecek düşük öncelikli component'ler
   - `client:media` → Sadece belirli ekran boyutlarında interaktif olması gereken component'ler
   - `client:only` → Sadece client'ta render edilecek, SSR'da skip edilecek component'ler

2. 🔴 **ZORUNLU:** Statik olabilen her şey `.astro` component olarak kalsın — framework component'lerini (React, Vue, Svelte) sadece interaktivite gerektiğinde kullan.

3. 🟠 **YASAK:** Tüm sayfaları SSR yapmak — gereksiz server load.
4. 🟠 **YASAK:** İnteraktivite gerektirmeyen component'lere `client:load` eklemek — gereksiz JavaScript.

## 3. CONTENT COLLECTIONS

1. 🔴 **ZORUNLU:** Tüm içerik tipleri için `src/content/config.ts` dosyasında Zod schema tanımla.
2. 🔴 **ZORUNLU:** `getCollection()` ve `getEntry()` API'lerini kullan.
3. 🟡 **ÖNERİLEN:** İçerik formatı olarak markdown (.md) kullan. İnteraktif bileşenler gerekiyorsa MDX (.mdx).
4. 🟡 **ÖNERİLEN:** Her koleksiyon için `slug` alanı zorunlu olsun.

```typescript
// src/content/config.ts — ÖRNEK
import { defineCollection, z } from 'astro:content';

const {{model_names}} = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    image: z.string().optional(),
  }),
});

export const collections = { {{model_names}} };
```

## 4. PERFORMANS KURALLARI

1. 🔴 **ZORUNLU:** Resimler için `<Image>` component'i kullan (otomatik optimizasyon, lazy loading, responsive).
2. 🔴 **ZORUNLU:** Font'ları `_layout.astro`'da `<link rel="preload">` ile yükle.
3. 🟡 **ÖNERİLEN:** Google Fonts veya self-hosted font kullan. Font loading için `font-display: swap`.
4. 🟡 **ÖNERİLEN:** JavaScript bundle'ları `is:inline` veya `is:global` ile optimize et.
5. 🟠 **YASAK:** Büyük resimleri inline HTML'e embed etmek — her zaman optimize edilmiş asset kullan.

## 5. SEO KURALLARI

1. 🔴 **ZORUNLU:** Her sayfada `<head>` bölümünde title, meta description, og:image tanımla.
2. 🔴 **ZORUNLU:** `@astrojs/sitemap` ile otomatik sitemap oluştur.
3. 🔴 **ZORUNLU:** `robots.txt` dosyası `public/` altında bulunmalı.
4. 🟡 **ÖNERİLEN:** Structured data (JSON-LD) ekle.
5. 🟡 **ÖNERİLEN:** Canonical URL'leri doğru ayarla.
6. 🟡 **ÖNERİLEN:** `astro.config.mjs`'de `site` alanını production URL ile doldur.

## 6. STYLING KURALLARI

1. 🔴 **ZORUNLU:** TailwindCSS kullan (proje standardı).
2. 🔴 **ZORUNLU:** `@astrojs/tailwind` integration'ını `astro.config.mjs`'e ekle.
3. 🟡 **ÖNERİLEN:** Global CSS `src/styles/global.css` altında, component-specific CSS scoped `<style>` ile.
4. 🟡 **ÖNERİLEN:** CSS custom properties (design tokens) kullanarak tutarlı tema yönetimi.

## 7. DEPLOYMENT KURALLARI (Vercel)

1. 🔴 **ZORUNLU:** Vercel adapter'ı `astro.config.mjs`'e ekle: `@astrojs/vercel`.
2. 🔴 **ZORUNLU:** Build command: `astro build`, output directory: `dist/`.
3. 🔴 **ZORUNLU:** Environment variables Vercel dashboard'dan yönet (local'da `.env`).
4. 🟡 **ÖNERİLEN:** `vercel.json` ile routing ve redirect kurallarını tanımla.
5. 🟡 **ÖNERİLEN:** Preview deployment'ları (staging) aktif et.
6. 🟠 **YASAK:** Production build'inde development-only environment variables kullanmak.

## 8. YAYGIN HATALAR (AI'NIN KAÇINMASI GEREKENLER)

1. ❌ **Tüm sayfaları SSR yapmak** — gereksiz server load, maliyet artar. Sadece dinamik sayfalar SSR.
2. ❌ **Her component'e `client:load` eklemek** — JavaScript şişer, performans düşer.
3. ❌ **Resimleri optimize etmeden kullanmak** — LCP süresi uzar, Core Web Vitals kötüleşir.
4. ❌ **Content Collections kullanmamak** — tip güvenliği kaybolur, içerik yönetimi zorlaşır.
5. ❌ **`<head>` meta tag'lerini unutmak** — SEO puanı düşer, sosyal medya paylaşımları kötü görünür.
6. ❌ **`astro.config.mjs`'de `site` alanını boş bırakmak** — sitemap ve canonical URL'ler hatalı oluşur.
7. ❌ **`public/` ve `src/` ayrımını anlamamak** — `public/` statik asset'ler, `src/` işlenen dosyalar.

## 9. DİZİN YAPISI KONTROL LİSTESİ

AI, oluşturduğu Astro.js projesinde şunları kontrol etmelidir:

- [ ] `astro.config.mjs` dosyası mevcut ve `output` modu doğru
- [ ] `@astrojs/tailwind` integration'ı eklenmiş
- [ ] `site` alanı production URL ile doldurulmuş (veya placeholder ile)
- [ ] `src/pages/index.astro` ana sayfa mevcut
- [ ] `src/layouts/BaseLayout.astro` temel layout mevcut
- [ ] `src/content/config.ts` Content Collections tanımlanmış (içerik varsa)
- [ ] `tailwind.config.js` mevcut
- [ ] `tsconfig.json` mevcut
- [ ] `public/favicon.ico` veya `public/favicon.svg` mevcut
- [ ] `package.json`'da `astro`, `@astrojs/tailwind`, `tailwindcss` bağımlılıkları var
- [ ] `package.json`'da `build` script'i `astro build` olarak tanımlanmış
