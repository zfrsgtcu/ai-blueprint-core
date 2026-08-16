<!--
  BU DOSYANIN AMACI:
  Fancyapps (Fancybox, Carousel, Panzoom) bileşenlerinin framework'e göre doğru kurulumunu, eklenti entegrasyonunu ve responsive ayarlarını AI'a öğretir.
-->

# FANCYAPPS CONFIGURATION RULES

## 1. FANCYAPPS NEDİR?

Fancyapps, üç bağımsız UI bileşeninden oluşur:

| Bileşen | Paket | Amaç |
|---------|-------|------|
| **Fancybox** | `@fancyapps/ui` | Lightbox / Gallery / Modal |
| **Carousel** | `@fancyapps/ui` | Kaydırılabilir slider |
| **Panzoom** | `@fancyapps/ui` | Mobil uyumlu zoom/pinch |

v5 itibarıyla üçü de `@fancyapps/ui` paketinde toplanmıştır. Eski `fancybox` (jQuery) paketi kullanılmamalıdır.

## 2. KURULUM

```bash
npm install @fancyapps/ui
```

### 2.1. CSS Import

```ts
// global.css veya layout'ta:
import '@fancyapps/ui/dist/fancybox/fancybox.css';
import '@fancyapps/ui/dist/carousel/carousel.css';
import '@fancyapps/ui/dist/panzoom/panzoom.css';

// VEYA CDN:
// <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fancyapps/ui/dist/fancybox/fancybox.css" />
```

## 3. FANCYBOX (LIGHTBOX)

### 3.1. React / Next.js

```tsx
'use client'; // Next.js App Router'da ZORUNLU

import { useEffect, useRef } from 'react';
import { Fancybox as NativeFancybox } from '@fancyapps/ui';

interface FancyboxProps {
  children: React.ReactNode;
  delegate?: string;
  options?: Record<string, any>;
}

export function Fancybox({ children, delegate = '[data-fancybox]', options = {} }: FancyboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    NativeFancybox.bind(container, delegate, {
      groupAll: true,         // Aynı gallery'dekileri grupla
      animated: true,         // Animasyon açık
      Thumbs: { type: 'modern' }, // Thumbnail stili
      ...options,
    });

    return () => {
      NativeFancybox.unbind(container);
      NativeFancybox.close(); // Component unmount olursa lightbox'ı kapat
    };
  }, [delegate, options]);

  return <div ref={containerRef}>{children}</div>;
}
```

### 3.2. HTML Kullanımı

```html
<!-- data-fancybox attribute ile otomatik bağlanır -->
<a href="/images/photo-large.jpg" data-fancybox="gallery" data-caption="Manzara Fotoğrafı">
  <img src="/images/photo-thumb.jpg" alt="Manzara" />
</a>

<a href="/images/photo2-large.jpg" data-fancybox="gallery" data-caption="İkinci Fotoğraf">
  <img src="/images/photo2-thumb.jpg" alt="Fotoğraf 2" />
</a>
```

### 3.3. Vue 3

```vue
<template>
  <div ref="containerRef">
    <slot />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Fancybox } from '@fancyapps/ui';

const containerRef = ref(null);

onMounted(() => {
  if (containerRef.value) {
    Fancybox.bind(containerRef.value, '[data-fancybox]', {
      groupAll: true,
      animated: true,
    });
  }
});

onBeforeUnmount(() => {
  if (containerRef.value) {
    Fancybox.unbind(containerRef.value);
    Fancybox.close();
  }
});
</script>
```

### 3.4. Astro

```astro
---
// Fancybox client-side çalışır
---

<div id="gallery">
  <a href="/images/large/1.jpg" data-fancybox="gallery">
    <img src="/images/thumb/1.jpg" alt="" />
  </a>
</div>

<script>
  import { Fancybox } from '@fancyapps/ui';

  Fancybox.bind('#gallery', '[data-fancybox]', {
    groupAll: true,
    animated: true,
  });
</script>
```

## 4. CAROUSEL (KAYDIRMALI SLIDER)

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { Carousel } from '@fancyapps/ui';

export function AppCarousel({ slides }: { slides: { src: string; alt: string }[] }) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<Carousel | null>(null);

  useEffect(() => {
    if (!carouselRef.current) return;

    instanceRef.current = new Carousel(carouselRef.current, {
      infinite: true,
      Navigation: true,
      Dots: true,
      slidesPerPage: 1,
      transition: 'slide',
    });

    return () => {
      instanceRef.current?.destroy();
    };
  }, []);

  return (
    <div ref={carouselRef} className="f-carousel">
      {slides.map((slide, i) => (
        <div key={i} className="f-carousel__slide">
          <img src={slide.src} alt={slide.alt} loading="lazy" />
        </div>
      ))}
    </div>
  );
}
```

## 5. PANZOOM (RESİM YAKINLAŞTIRMA)

```ts
import { Panzoom } from '@fancyapps/ui';

const panzoom = new Panzoom('#product-image', {
  maxScale: 3,
  minScale: 1,
  animateDuration: 200,
  panOnlyWhenZoomed: true,
  contain: 'outside',
});

// API ile kontrol:
panzoom.zoomIn();
panzoom.zoomOut();
panzoom.reset();
panzoom.destroy(); // Cleanup ZORUNLU
```

## 6. PROGRAMATİK KULLANIM (Modal / Dialog)

```ts
import { Fancybox } from '@fancyapps/ui';

// Modal olarak kullanım:
Fancybox.show([
  {
    src: '#contact-form', // DOM element ID
    type: 'inline',
  },
]);

// HTML içerik:
Fancybox.show([
  {
    src: '<h1>Merhaba</h1><p>Bu bir modal</p>',
    type: 'html',
  },
], {
  on: {
    done: () => console.log('Modal açıldı'),
    closing: () => console.log('Modal kapanıyor'),
  },
});
```

## 7. YAPILMAMASI GEREKENLER

- **jQuery fancybox (v3 ve öncesi) kurma** — v5 `@fancyapps/ui`, jQuery bağımlılığı yok
- **Next.js'te `'use client'` olmadan kullanma** — DOM manipülasyonu yapar, client-side zorunlu
- **Component unmount'ta `destroy()`/`unbind()` çağırmama** — Memory leak ve duplicate instance
- **Carousel'de `slidesPerPage: 1` + `infinite: true` + 2 slayt** — Yeterli slayt yoksa infinite garip görünür
- **Fancybox'ta `groupAll: false` iken aynı `data-fancybox` değerini kullanma** — Gruplama bozulur
- **Panzoom'da `contain: 'inside'` + `maxScale: 5`** — Mobilde imaj sınırların dışına taşar, `'outside'` daha iyi
