<!--
  BU DOSYANIN AMACI:
  Framer Motion animasyon kütüphanesinin framework'e göre doğru kurulumunu AI'a öğretir.
  React-exclusive bir kütüphane olduğu için diğer framework'lerdeki alternatifleri de belirtir.
-->

# FRAMER MOTION CONFIGURATION RULES

## 1. KURULUM

```bash
npm install framer-motion
```

### Önemli Not: React-Exclusive

Framer Motion SADECE React ile çalışır. Diğer framework'ler için alternatifler:
- **Vue:** `@vueuse/motion` veya GSAP
- **Svelte:** Built-in motion (`svelte/motion` ve `svelte/transition`)
- **Astro:** React component adasında Framer Motion kullanılabilir

## 2. SSR UYUMU (ZORUNLU)

### 2.1. Next.js App Router

```jsx
'use client'; // ZORUNLU

import { motion } from 'framer-motion';

export default function AnimatedComponent() {
  return <motion.div>...</motion.div>;
}
```

### 2.2. Next.js Pages Router (framer-motion v10+)

```jsx
import { motion } from 'framer-motion';

// Pages Router'da server-side import sorunu olabilir.
// Dinamik import çözümü:
import dynamic from 'next/dynamic';
const MotionDiv = dynamic(
  () => import('framer-motion').then(mod => mod.motion.div),
  { ssr: false }
);
```

### 2.3. LazyMotion (Bundle Optimizasyonu)

Büyük projelerde `LazyMotion` ile feature'ları lazy load et:

```jsx
import { LazyMotion, domAnimation, m } from 'framer-motion';

// domAnimation: Sadece temel animasyonlar (~5KB)
// domMax: Tüm feature'lar (~25KB) — layout animasyonları, drag vb.

export default function App() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        İçerik
      </m.div>
    </LazyMotion>
  );
}
```

**Kural:** Projede layout animation (layoutId) veya drag kullanılmıyorsa `domAnimation` kullan. Bundle'a 20KB yerine 5KB eklenir.

## 3. MOTION COMPONENT TÜRLERİ

### 3.1. motion.* Elementleri

```jsx
<motion.div>    // HTML div
<motion.span>   // HTML span
<motion.button> // HTML button
<motion.img>    // HTML img
<motion.svg>    // SVG elementleri
<motion.path>   // SVG path
<motion.circle> // SVG circle
```

### 3.2. Custom Component Sarma

```jsx
// Kendi component'ini motion ile sarmak için:
const MotionCard = motion.create(Card);

// Veya:
const MotionCard = motion(Card);

<MotionCard whileHover={{ scale: 1.05 }} />
```

Custom component'in ref'i forward etmesi ZORUNLUDUR (`forwardRef`).

## 4. ANIMATIONFEATURE SEÇİMİ

| Feature Set | Bundle Boyutu | İçerik |
|-------------|--------------|--------|
| `domAnimation` | ~5KB | `animate`, `initial`, `exit`, `transition`, `variants`, `whileHover`, `whileTap`, `whileInView` |
| `domMax` | ~25KB | Tüm `domAnimation` + `layout` animasyonları, `drag`, `dragConstraints`, `useAnimate` hook |

## 5. TYPESCRIPT DESTEĞİ

```tsx
import { motion, type Variants, type Transition } from 'framer-motion';

const variants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const transition: Transition = {
  duration: 0.5,
  ease: [0.25, 0.1, 0.25, 1], // Cubic bezier
};
```

## 6. FRAMER MOTION v11 DEĞİŞİKLİKLERİ

- `motion` artık varsayılan olarak server-safe. Next.js'te `'use client'` hala gerekli.
- `AnimatePresence` SSR'da hata vermez (v10'da veriyordu)
- `layoutScroll` deprecated, yerine `layout` prop'u direkt kullanılır

## 7. YAPILMAMASI GEREKENLER

- **Next.js Server Component içinde motion kullanma** — `'use client'` olmadan hata verir
- **`whileInView` ile `AnimatePresence`'ı karıştırma** — İkisi farklı trigger mekanizmalarıdır
- **Performanslı liste animasyonu için `motion` yerine CSS transition** — 50+ elementte Framer Motion yavaşlar
- **`layout` animasyonunu gereksiz yere kullanma** — Pahalı bir hesaplamadır, sadece layout değişimi animasyonlarında kullan
