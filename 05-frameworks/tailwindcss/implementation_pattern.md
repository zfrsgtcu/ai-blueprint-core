<!-- PURPOSE OF THIS FILE: Tailwind CSS implementation best practice'leri — AI ajanının uyması gereken ZORUNLU/YASAK/ÖNERİLEN kurallar -->
# Tailwind CSS Implementation Pattern

## Genel Prensipler

- 🔴 **ZORUNLU:** Tüm renkler, spacing, typography `tailwind.config` üzerinden design token olarak tanımlanır. Arbitrary value (`w-[327px]`) sadece istisnai durumlarda kullanılır.
- 🔴 **ZORUNLU:** `@apply` direktifi SADECE tekrar eden component pattern'leri için kullanılır. Utility-first prensibi korunur — her şeyi `@apply` ile abstract etmek Tailwind'in amacına aykırıdır.
- 🔴 **ZORUNLU:** Renk kontrast oranları WCAG AA standardını karşılar (≥4.5:1 normal metin, ≥3:1 büyük metin).
- 🟠 **YASAK:** Inline style (`style={{ color: 'red' }}`) Tailwind ile birlikte kullanılmaz. İstisna: dinamik değerler (JS'ten gelen pozisyon, boyut).
- 🟡 **ÖNERİLEN:** `clsx` veya `tailwind-merge` ile dinamik class birleştirme (React/Vue).

## Güvenlik & Erişilebilirlik

- 🔴 **ZORUNLU:** Tüm etkileşimli element'lere `focus-visible:ring-*` ile klavye focus göstergesi eklenir.
- 🔴 **ZORUNLU:** `sr-only` class'ı ile ekran okuyucular için görünmez etiketler sağlanır.
- 🔴 **ZORUNLU:** `prefers-reduced-motion` medya sorgusuna saygı gösterilir. Animasyonlar `motion-safe:` prefix'i ile sarılır.
- 🟡 **ÖNERİLEN:** Tailwind plugin ile özel utility'ler (örn: `scrollbar-hide`, `text-balance`).

## Kodlama Standartları

### React (JSX)
```jsx
// ✅ DOĞRU — Utility-first + design token'lar
<button
  className={clsx(
    'inline-flex items-center gap-2 rounded-lg px-4 py-2',
    'text-sm font-medium transition-colors duration-150',
    'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none',
    'motion-safe:transition-all',
    variant === 'primary'
      ? 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  )}
  aria-label="Sepete ekle"
>
  <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />
  Sepete Ekle
</button>

// ✅ DOĞRU — @apply ile tekrar eden pattern (CSS file)
// .btn-primary {
//   @apply inline-flex items-center gap-2 rounded-lg px-4 py-2
//          bg-primary-600 text-white text-sm font-medium
//          hover:bg-primary-700 active:bg-primary-800
//          focus-visible:ring-2 focus-visible:ring-primary-500
//          transition-colors duration-150;
// }

// ❌ YANLIŞ — Arbitrary value istismarı
// <div className="w-[327px] h-[189px] mt-[13px] ml-[7px]"> — bunun yerine spacing scale kullan!
```

### Vue (SFC)
```vue
<template>
  <!-- ✅ DOĞRU -->
  <button
    :class="[
      'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
      variant === 'primary'
        ? 'bg-primary-600 text-white hover:bg-primary-700'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    ]"
    aria-label="Sepete ekle"
  >
    <ShoppingCartIcon class="h-5 w-5" aria-hidden="true" />
    Sepete Ekle
  </button>
</template>
```

### Responsive Pattern
```html
<!-- ✅ DOĞRU — Mobile-first -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <!-- Card'lar -->
</div>

<!-- ✅ DOĞRU — Container + padding responsive -->
<main class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
  <!-- İçerik -->
</main>
```

## Design Token Yapısı

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff', // En açık
          500: '#3b82f6', // Base
          600: '#2563eb', // Hover
          700: '#1d4ed8', // Active
          900: '#1e3a5f', // En koyu
        },
        accent: { /* ... */ },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        // 4px tabanlı scale: 1=4px, 2=8px, ..., 18=72px
      },
      borderRadius: {
        DEFAULT: '0.5rem', // 8px
      },
    },
  },
}
```

## Yaygın Hatalar

1. **Arbitrary value istismarı** — `w-[327px]` her yerde → tasarım tutarsızlığı. Config'de spacing scale kullan.
2. **`@apply` ile her şeyi component yapmak** — CSS dosyası Tailwind'den bile büyük olur. Sadece gerçekten tekrar eden pattern'ler.
3. **Focus visible olmaması** — Klavye kullanıcıları için erişilemez.
4. **Production'da unused CSS purge yapılmaması** — CSS bundle'ı 500KB+ olur.
5. **Dark mode düşünülmeden renk seçimi** — Sonradan dark mode eklemek tüm renk token'larını değiştirmeyi gerektirir.
6. **Container queries yerine media queries kullanmak** — Component bazlı responsive yerine sayfa bazlı responsive.
7. **`prefers-reduced-motion` saygısızlığı** — Vestibüler rahatsızlığı olan kullanıcılar için zararlı.
