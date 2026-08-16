<!--
  BU DOSYANIN AMACI:
  Tailwind CSS'in performanslı ve ölçeklenebilir kullanım sırlarını AI'a öğretir.
  Utility-first yaklaşımın doğru kullanımı, bundle optimizasyonu ve responsive tasarım kurallarını içerir.
-->

# TAILWIND CSS BEST PRACTICES

## 1. UTILITY-FIRST DİSİPLİNİ

### 1.1. Önce Utility, Sonra Custom CSS

- Her zaman önce Tailwind utility sınıflarıyla çözüm ara
- `@apply` direktifi SADECE tekrar eden pattern'ler için kullanılır
- Custom CSS sadece Tailwind'in kapsamadığı durumlarda yazılır

### 1.2. @apply Kullanım Kuralları

```css
/* DOĞRU: Tekrar eden buton stili */
@layer components {
  .btn-primary {
    @apply px-6 py-3 bg-blue-600 text-white rounded-lg 
           hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 
           transition-colors duration-200;
  }
}

/* YANLIŞ: @apply ile tüm stilleri tek sınıfa gömmek */
.card {
  @apply p-6 bg-white rounded-xl shadow-lg border border-gray-200
         flex flex-col gap-4 text-left w-full max-w-sm
         hover:shadow-xl transition-shadow; /* Bunun yerine HTML'de utility kullan */
}
```

Kural: Bir bileşende 7'den fazla utility varsa, `@apply` ile component class'ı oluştur.

### 1.3. Inline Style vs Tailwind

`style={{}}` (React) veya `style=""` KULLANMA. Dinamik değerler için Tailwind'in arbitrary value sözdizimini kullan:

```html
<!-- DOĞRU -->
<div class="w-[320px] h-[calc(100vh-4rem)] bg-[#ff6b35]">

<!-- YANLIŞ -->
<div style="width: 320px; height: calc(100vh - 4rem); background: #ff6b35;">
```

## 2. RESPONSIVE TASARIM

### 2.1. Mobile-First Yaklaşım

Tüm stiller önce mobil için yazılır, sonra breakpoint'lerle genişletilir:

```html
<!-- DOĞRU: Mobile-first -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

<!-- YANLIŞ: Desktop-first -->
<div class="grid grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1 gap-4">
```

### 2.2. Container Kullanımı

```html
<div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
```

Container + padding + max-width kombinasyonu her sayfada kullanılmalıdır.

### 2.3. Responsive Tipografi

```html
<h1 class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold">
```

## 3. PERFORMANS OPTİMİZASYONU

### 3.1. PurgeCSS / Content Optimizasyonu

`content` glob'larını olabildiğince spesifik tut. `./src/**/*` yerine `./src/**/*.{js,jsx,ts,tsx}` gibi.

### 3.2. Kullanılmayan Utility'leri Temizleme

Tailwind v3 production build'de otomatik purge yapar. v4'te content-based otomatik detection vardır. Manuel `safelist` kullanımından kaçın:

```js
// YAPMA: Gereksiz safelist bundle'ı şişirir
safelist: ['bg-red-500', 'bg-blue-500', 'bg-green-500', ...]

// YAP: Dinamik sınıfları CSS'de tanımla veya whitelist pattern kullan
safelist: [{ pattern: /^bg-(red|blue|green)-(400|500|600)$/ }]
```

### 3.3. Bundle Boyutu Hedefi

Tailwind CSS output'u (production, gzipped): **max 15KB**. Daha büyükse gereksiz utility veya safelist vardır.

## 4. DİNAMİK SINIF İSİMLERİ

### 4.1. String Concatenation YapMA

Tailwind PurgeCSS dinamik olarak oluşturulan sınıf isimlerini tespit EDEMEZ:

```jsx
// YANLIŞ: Bu sınıflar purge edilir!
<div className={`bg-${color}-500`}>

// DOĞRU: Tam sınıf isimleri kullan
<div className={color === 'red' ? 'bg-red-500' : 'bg-blue-500'}>

// VEYA: style prop ile arbitrary value
<div style={{ backgroundColor: color }}>
```

### 4.2. clsx / cn Utility Fonksiyonu

Koşullu sınıflar için yardımcı fonksiyon oluştur:

```ts
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Kullanım
<button className={cn(
  'px-4 py-2 rounded',
  variant === 'primary' && 'bg-blue-600 text-white',
  variant === 'secondary' && 'bg-gray-200 text-gray-800',
  disabled && 'opacity-50 cursor-not-allowed'
)}>
```

## 5. TEMA VE TASARIM TOKEN'LARI

### 5.1. Tema Sabitleri (Design Tokens)

Proje genelinde tutarlı renk/boşluk/tipografi için design token'ları tanımla:

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      brand: {
        primary: '#2563eb',
        secondary: '#7c3aed',
        accent: '#f59e0b',
      },
      surface: {
        DEFAULT: '#ffffff',
        muted: '#f9fafb',
        elevated: '#ffffff',
      },
      text: {
        primary: '#111827',
        secondary: '#6b7280',
        muted: '#9ca3af',
      },
    },
    spacing: {
      'page': '1.5rem',       // Sayfa iç padding
      'section': '4rem',      // Section arası boşluk
      'gutter': '2rem',       // Grid gutter
    },
  },
}
```

### 5.2. Dark Mode

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // 'media' yerine 'class' kullan (manuel kontrol için)
  // ...
};
```

```html
<!-- HTML'de dark mode toggle -->
<html class="dark">
<body class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
```

## 6. SIK KULLANILAN PATTERN'LER

### 6.1. Line Clamp (Metin Kırpma)

```html
<p class="line-clamp-3">Uzun metin burada 3 satırda kırpılır...</p>
<!-- v4: line-clamp-3, v3: line-clamp-3 (plugin gerekmez, built-in) -->
```

### 6.2. Aspect Ratio

```html
<div class="aspect-video"> <!-- 16:9 -->
<div class="aspect-square"> <!-- 1:1 -->
<div class="aspect-[4/3]"> <!-- 4:3 -->
```

### 6.3. Container Queries (v4+)

```html
<div class="@container">
  <div class="@md:grid-cols-2 @lg:grid-cols-3">
</div>
```

## 7. YAPILMAMASI GEREKENLER

- **200+ karakterlik utility zincirleri** — Bileşene ayır veya `@apply` kullan
- **Keyfi spacing değerleri** — `mt-[7px]` yerine `mt-2` (8px) tutarlı
- **`!important` overuse** — `!mt-0` sadece üçüncü parti bileşenleri override etmek için
- **Derin nested `@apply`** — Max 1 seviye derinlik
- **Responsive olmayan fixed width** — `w-[600px]` yerine `w-full max-w-2xl`
- **Aynı sayfada hem Tailwind hem Bootstrap/Foundation** — Çakışma kaçınılmaz
