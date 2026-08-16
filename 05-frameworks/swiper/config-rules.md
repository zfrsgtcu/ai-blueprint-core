<!--
  BU DOSYANIN AMACI:
  Swiper.js slider/carousel kütüphanesinin framework'e göre doğru kurulumunu AI'a öğretir.
  Modül kaydı, stil import'u ve SSR uyumluluğu kurallarını içerir.
-->

# SWIPER.JS CONFIGURATION RULES

## 1. KURULUM

```bash
npm install swiper
```

Swiper v11+ tamamen modülerdir. Ek plugin paketi gerekmez — tüm modüller `swiper/modules` altındadır.

## 2. STİL IMPORT'U (ZORUNLU)

Swiper'ın çalışması için CSS import'u şarttır. Hangi import'un kullanılacağı projenin yapısına bağlıdır:

```js
// Seçenek 1: Tüm core + modül stilleri (önerilen)
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-cube';

// Seçenek 2: Sadece core (hiçbir extra modül stili olmadan)
import 'swiper/css';
```

**SADECE kullanılan modüllerin CSS'ini import et.** Gereksiz CSS import'u bundle'ı şişirir.

## 3. FRAMEWORK-SPECIFIC KURULUM

### 3.1. React / Next.js

```jsx
'use client'; // Next.js App Router'da ZORUNLU

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

export default function Carousel() {
  return (
    <Swiper
      modules={[Navigation, Pagination, Autoplay, EffectFade]}
      spaceBetween={20}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 5000 }}
      effect="fade"
    >
      <SwiperSlide>Slide 1</SwiperSlide>
      <SwiperSlide>Slide 2</SwiperSlide>
    </Swiper>
  );
}
```

**Kurallar:**
- `modules` prop'una KULLANILAN tüm modülleri ekle. Eksik modül = sessiz hata.
- Next.js App Router'da `'use client'` ZORUNLU.
- Dinamik import ile SSR sorunu çöz: `const Swiper = dynamic(() => import('swiper/react'), { ssr: false })`

### 3.2. Vue / Nuxt 3

```vue
<template>
  <swiper
    :modules="modules"
    :slides-per-view="1"
    :space-between="20"
    navigation
    :pagination="{ clickable: true }"
  >
    <swiper-slide v-for="slide in slides" :key="slide.id">
      {{ slide.content }}
    </swiper-slide>
  </swiper>
</template>

<script setup>
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const modules = [Navigation, Pagination];
</script>
```

### 3.3. Svelte / SvelteKit

```svelte
<script>
  import { onMount } from 'svelte';
  import Swiper from 'swiper';
  import { Navigation, Pagination } from 'swiper/modules';
  import 'swiper/css';
  import 'swiper/css/navigation';
  import 'swiper/css/pagination';

  let swiperInstance;

  onMount(() => {
    swiperInstance = new Swiper('.swiper-container', {
      modules: [Navigation, Pagination],
      slidesPerView: 1,
      spaceBetween: 20,
      navigation: true,
      pagination: { clickable: true },
    });
  });

  // onDestroy'da swiperInstance.destroy() yap
</script>
```

### 3.4. Astro

```astro
---
---

<div class="swiper mySwiper">
  <div class="swiper-wrapper">
    <div class="swiper-slide">Slide 1</div>
    <div class="swiper-slide">Slide 2</div>
  </div>
  <div class="swiper-pagination"></div>
  <div class="swiper-button-next"></div>
  <div class="swiper-button-prev"></div>
</div>

<script>
  import Swiper from 'swiper';
  import { Navigation, Pagination } from 'swiper/modules';
  import 'swiper/css';
  import 'swiper/css/navigation';
  import 'swiper/css/pagination';

  new Swiper('.mySwiper', {
    modules: [Navigation, Pagination],
    slidesPerView: 1,
    navigation: true,
    pagination: { clickable: true },
  });
</script>
```

## 4. SSR UYUMU (KRİTİK)

Swiper DOM'a bağımlıdır. SSR framework'lerinde özel kullanım gerekir:

- **Next.js:** `dynamic(() => import('./Carousel'), { ssr: false })`
- **Nuxt:** `<ClientOnly>` wrapper kullan veya `.client.vue` dosya uzantısı
- **SvelteKit:** `onMount` içinde başlat (sadece client'ta çalışır)
- **Astro:** `<script>` tag'ı içinde kullan (client-side only)

## 5. MODÜL LİSTESİ

| Modül | Amaç | CSS Import |
|-------|------|-----------|
| `Navigation` | Önceki/Sonraki okları | `swiper/css/navigation` |
| `Pagination` | Sayfa noktaları | `swiper/css/pagination` |
| `Scrollbar` | Kaydırma çubuğu | `swiper/css/scrollbar` |
| `Autoplay` | Otomatik kaydırma | Yok (core) |
| `EffectFade` | Fade geçiş efekti | `swiper/css/effect-fade` |
| `EffectCube` | 3D küp efekti | `swiper/css/effect-cube` |
| `EffectCoverflow` | Coverflow efekti | `swiper/css/effect-coverflow` |
| `EffectFlip` | 3D çevirme efekti | `swiper/css/effect-flip` |
| `Thumbs` | Küçük resim galerisi | Yok (core) |
| `FreeMode` | Serbest kaydırma | Yok (core) |
| `Mousewheel` | Mouse tekerleği | Yok (core) |
| `Keyboard` | Klavye kontrolü | Yok (core) |

## 6. YAPILMAMASI GEREKENLER

- `modules` prop'unu boş bırakMA — modüller çalışmaz
- Aynı modülün CSS'ini birden fazla kez import ETME
- Swiper instance'ını destroy() etmeden DOM'dan kaldırMA (memory leak)
- `slidesPerView: 'auto'` ile `loop: true` aynı anda kullanMA (hata verir)
- Swiper container'ına CSS `overflow: hidden` ekleME (Swiper kendi ekler, çakışır)
