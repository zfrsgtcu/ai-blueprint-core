<!--
  BU DOSYANIN AMACI:
  GSAP (GreenSock Animation Platform) entegrasyonunun framework'e göre doğru konfigürasyonunu AI'a öğretir.
  Plugin kaydı, SSR uyumu ve framework-spesifik kurulum detaylarını içerir.
-->

# GSAP CONFIGURATION RULES

## 1. KURULUM

### 1.1. Paketler

```bash
npm install gsap @gsap/react
```

- `gsap`: Çekirdek animasyon motoru
- `@gsap/react`: React hook'ları (`useGSAP`) — sadece React projelerinde

### 1.2. Plugin Kaydı (ZORUNLU)

ScrollTrigger, ScrollSmoother, SplitText gibi plugin'ler kullanılacaksa KAYIT EDİLMELİDİR:

```js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
```

Plugin kaydı her projede EN FAZLA BİR KEZ yapılmalıdır. Mükerrer kayıt konsol uyarısı verir.

## 2. FRAMEWORK-SPECIFIC KURALLAR

### 2.1. React / Next.js

```jsx
'use client'; // Next.js App Router'da ZORUNLU

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function AnimatedComponent() {
  const containerRef = useRef(null);

  useGSAP(() => {
    // Tüm animasyonlar burada
    gsap.from(containerRef.current, {
      opacity: 0,
      y: 50,
      duration: 1,
    });
  }, { scope: containerRef }); // scope: cleanup için otomatik selector kapsamı

  return <div ref={containerRef}>...</div>;
}
```

**Kurallar:**
- `useGSAP` hook'u otomatik cleanup yapar. Manuel `gsap.context()` gerekmez.
- `useRef` ile DOM elementlerine referans al. `document.querySelector()` KULLANMA.
- Next.js App Router'da `'use client'` directive ZORUNLU.
- ScrollTrigger kullanıyorsan `window` kontrolü yap: `if (typeof window === 'undefined') return;`

### 2.2. Nuxt 3 / Vue

```vue
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const containerRef = ref(null);
let ctx = null;

onMounted(() => {
  ctx = gsap.context(() => {
    gsap.from(containerRef.value, {
      opacity: 0,
      y: 50,
      duration: 1,
    });
  }, containerRef.value);
});

onBeforeUnmount(() => {
  ctx?.revert(); // TÜM animasyonları temizle
});
</script>
```

**Plugin'leri global kaydetmek için:**

```js
// plugins/gsap.client.ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default defineNuxtPlugin(() => {
  gsap.registerPlugin(ScrollTrigger);
});
```

### 2.3. Astro

```astro
---
// Astro frontmatter
---

<template>
  <div id="hero-animation">
    <!-- Animasyonlu içerik -->
  </div>
</template>

<script>
  import gsap from 'gsap';

  // client:load = sayfa yüklendiğinde çalışır
  gsap.from('#hero-animation', {
    opacity: 0,
    duration: 1,
  });
</script>
```

Astro'da GSAP için component `client:load` directive ile işaretlenmelidir. `client:visible` = element görünür olduğunda animasyon başlar (ScrollTrigger alternatifi).

### 2.4. Svelte / SvelteKit

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import gsap from 'gsap';

  let container;
  let ctx;

  onMount(() => {
    ctx = gsap.context(() => {
      gsap.from(container, {
        opacity: 0,
        y: 50,
        duration: 1,
      });
    }, container);
  });

  onDestroy(() => {
    ctx?.revert();
  });
</script>
```

**Svelte 5 uyarısı:** `$effect` içinde GSAP kullanma — sonsuz re-render'a yol açabilir. `onMount` kullan.

## 3. SSR UYUMU (ZORUNLU KONTROLLER)

GSAP `window` ve `document` objelerine ihtiyaç duyar. SSR ortamında bunlar yoktur:

```js
// TÜM framework'lerde SSR kontrolü:
if (typeof window === 'undefined') return;
// veya
if (typeof document === 'undefined') return;
```

- **Next.js:** Dinamik import ile `ssr: false`
- **Nuxt:** `.client.ts` plugin dosyası
- **Astro:** `client:only` directive
- **SvelteKit:** `onMount` içinde (sadece client'ta çalışır)

## 4. YAPILMAMASI GEREKENLER

- `document.querySelector()` veya `document.getElementById()` KULLANMA — `useRef` (React), `ref` (Vue), `bind:this` (Svelte) kullan
- Animasyonları `useEffect` / `watch` içinde cleanup olmadan başlatMA
- ScrollTrigger.refresh() çağırmayı unutMA (sayfa düzeni değiştiğinde)
- Aynı elementi birden fazla GSAP tween ile aynı anda animate ETME (çakışma olur)
