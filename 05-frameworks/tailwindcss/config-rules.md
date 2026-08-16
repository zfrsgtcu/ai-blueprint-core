<!--
  BU DOSYANIN AMACI:
  Tailwind CSS'in AI tarafından doğru şekilde konfigüre edilmesini sağlar.
  Versiyona göre değişen konfigürasyon yaklaşımlarını (v3 config file vs v4 CSS-based) AI'a öğretir.
-->

# TAILWIND CSS CONFIGURATION RULES

## 1. VERSİYON TESPİTİ (ZORUNLU)

Tailwind CSS konfigürasyonu versiyona göre tamamen değişir. Yanlış yaklaşım build hatalarına yol açar.

| Versiyon | Konfigürasyon Yöntemi | Config Dosyası |
|----------|----------------------|----------------|
| v3.x (^3.4.0) | `tailwind.config.js` / `tailwind.config.ts` | ZORUNLU |
| v4.x | CSS-first (`@theme` directive) | YASAK (dosya oluşturulmaz) |

## 2. TAILWIND CSS v3 KONFİGÜRASYONU

### 2.1. tailwind.config.js Yapısı

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx,vue,svelte,astro,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Özel renk paleti burada
        primary: {
          50: '#...',
          500: '#...',
          900: '#...',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### 2.2. content Alanı (ZORUNLU)

`content` glob pattern'leri framework'e göre ayarlanmalıdır:

- **Next.js (App Router):** `['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx}']`
- **Next.js (Pages Router):** `['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}']`
- **Astro:** `['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}']`
- **Nuxt:** `['./app/**/*.{vue,js,ts}', './components/**/*.{vue,js,ts}']`
- **React (Vite):** `['./index.html', './src/**/*.{js,ts,jsx,tsx}']`
- **Vue (Vite):** `['./index.html', './src/**/*.{vue,js,ts}']`

### 2.3. PostCSS Entegrasyonu

Tüm Tailwind v3 projelerinde `postcss.config.js` ZORUNLUDUR:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 2.4. Base CSS

Ana CSS dosyasına Tailwind direktifleri eklenmelidir:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 3. TAILWIND CSS v4 KONFİGÜRASYONU

### 3.1. Temel Prensipler (v4)

- `tailwind.config.js` dosyası **OLUŞTURULMAZ**
- Tüm tema özelleştirmeleri CSS içinde `@theme` ile yapılır
- `@tailwind` direktifleri yerine `@import "tailwindcss"` kullanılır

### 3.2. Vite Plugin (v4 için önerilen)

```js
// vite.config.js
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss()],
});
```

### 3.3. Base CSS (v4)

```css
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

### 3.4. v3 → v4 Geçiş Tablosu

| v3 | v4 |
|----|----|
| `tailwind.config.js` `theme.extend.colors` | CSS `@theme { --color-* }` |
| `tailwind.config.js` `theme.extend.fontFamily` | CSS `@theme { --font-* }` |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| `@apply text-2xl font-bold` | Aynı (hala geçerli) |
| `darkMode: 'class'` | `@variant dark (&:where(.dark, .dark *))` |

## 4. FRAMEWORK-SPECIFIC KURALLAR

### 4.1. Astro + Tailwind

- **v3:** `@astrojs/tailwind` integration kullan. `npx astro add tailwind` ile otomatik kur.
- **v4:** `@astrojs/tailwind` DEPRECATED. `@tailwindcss/vite` plugin'ini kullan. Astro 5.2+ üzerinde `npx astro add tailwind` çalıştır.

### 4.2. Next.js + Tailwind

- **v15+:** Next.js 15 varsayılan olarak Tailwind v4 kurar. `tailwind.config.js` OLUŞTURMA.
- **v14:** Next.js 14 varsayılan olarak Tailwind v3 kurar. `tailwind.config.js` ZORUNLU.
- `create-next-app` ile kurulduysa Tailwind zaten yapılandırılmıştır, mükerrer kurulum YAPMA.

### 4.3. Nuxt + Tailwind

- **Nuxt 3:** `@nuxtjs/tailwindcss` modülünü kullan. `npx nuxi@latest module add tailwindcss`.
- `nuxt.config.ts` içinde `modules: ['@nuxtjs/tailwindcss']` yeterlidir. `tailwind.config.js` otomatik oluşur.

### 4.4. SvelteKit + Tailwind

- **v3:** `tailwindcss` + `postcss` + `autoprefixer` paketlerini kur. `postcss.config.js` oluştur.
- **v4:** `@tailwindcss/vite` plugin'ini `vite.config.js`'ye ekle. `src/app.css`'ye `@import "tailwindcss"` ekle.

### 4.5. Qwik + Tailwind

- **v4:** `@tailwindcss/vite` sürüm 4.0.8+ Qwik'te sınıfları düzgün render etmez. **v4.0.7'ye sabitle**.
- PostCSS entegrasyonu da alternatif olarak kullanılabilir.

## 5. ÖZEL RENK PALETİ (Blueprint Variables)

Eğer blueprint'te `variables.colors` tanımlıysa, Tailwind config otomatik genişletilir:

```js
// Blueprint variables: { colors: { primary: '#1a73e8', accent: '#ff6b35' } }
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '{{colors.primary}}',
        light: '{{colors.primaryLight}}',
        dark: '{{colors.primaryDark}}',
      },
      accent: {
        DEFAULT: '{{colors.accent}}',
      },
    },
  },
}
```

## 6. YAPILMAMASI GEREKENLER

- `tailwind.config.js` içinde `purge` seçeneğini KULLANMA (deprecated, v3'te `content` kullan)
- 50'den fazla özel renk tonu tanımlama (bundle boyutunu şişirir)
- `@layer base` içinde karmaşık stiller tanımlamaktan kaçın
- v3 projesinde `tailwind.config.js` olmadan Tailwind kullanmaya çalışMA
- v4 projesinde `tailwind.config.js` oluşturMA (build hatası)
