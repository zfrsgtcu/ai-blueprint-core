<!--
  BU DOSYANIN AMACI:
  Framer Motion ile profesyonel animasyon pattern'lerini, performans sırlarını ve yaygın hatalardan kaçınma yöntemlerini AI'a öğretir.
-->

# FRAMER MOTION BEST PRACTICES

## 1. VARIANTS PATTERN (EN ÖNEMLİ)

Animasyon mantığını JSX'ten ayırmak için variants kullan:

```jsx
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,      // Çocuklar sırayla gelsin
      delayChildren: 0.3,        // İlk çocuk 0.3s sonra başlasın
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

<motion.ul variants={listVariants} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.li key={item.id} variants={itemVariants}>
      {item.text}
    </motion.li>
  ))}
</motion.ul>
```

**Kural:** Parent'a `variants` + `animate="visible"`, child'lara `variants` SADECE. Child'lar parent'tan miras alır.

## 2. PERFORMANS OPTİMİZASYONU

### 2.1. transform Animasyonları (GPU Accelerated)

SADECE `x`, `y`, `scale`, `rotate`, `opacity` animasyonlarını kullan:

```jsx
// DOĞRU: GPU accelerated
<motion.div animate={{ x: 100, opacity: 0.5, scale: 1.2 }} />

// YANLIŞ: CPU repaint
<motion.div animate={{ width: 200, height: 200, top: 100 }} />
```

### 2.2. AnimatePresence (Exit Animasyonları)

```jsx
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      key="modal"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      Modal İçeriği
    </motion.div>
  )}
</AnimatePresence>
```

**`mode="wait"`:** Yeni component girmeden önce eskinin exit animasyonu biter. Modal, route değişimi gibi durumlarda kullan.

### 2.3. layoutId (Shared Layout Animasyonu)

```jsx
// Liste → Detay sayfası geçişi
{items.map(item => (
  <motion.div
    key={item.id}
    layoutId={`item-${item.id}`} // İki sayfada aynı layoutId
    onClick={() => setSelectedId(item.id)}
  >
    <img src={item.thumbnail} />
  </motion.div>
))}

{selectedId && (
  <motion.div layoutId={`item-${selectedId}`}>
    <img src={selectedId.image} />
  </motion.div>
)}
```

**Kural:** `layoutId` SADECE `motion` component'lerinde çalışır. Aynı layoutId'ye sahip iki element DOM'da aynı anda bulunamaz (AnimatePresence içinde olmalı).

### 2.4. useReducedMotion (A11y)

```jsx
import { useReducedMotion } from 'framer-motion';

const shouldReduceMotion = useReducedMotion();

<motion.div
  animate={shouldReduceMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0 }
  }
  initial={shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 20 }
  }
/>
```

Erişilebilirlik için ZORUNLU.

## 3. YAYGIN PATTERN'LER

### 3.1. Scroll-Triggered Animasyon (whileInView)

```jsx
<motion.div
  initial={{ opacity: 0, y: 60 }}
  whileInView={{
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  }}
  viewport={{
    once: true,          // Sadece bir kez tetikle
    amount: 0.3,         // Elementin %30'u görünür olunca
    margin: '-50px',     // Tetikleme offset'i
  }}
>
  İçerik
</motion.div>
```

**`once: true` ÇOK ÖNEMLİ:** Aksi halde her scroll'da animasyon tekrar çalışır.

### 3.2. Hover/Tap Efektleri

```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  Buton
</motion.button>
```

### 3.3. Page Transition (Next.js App Router)

```jsx
// app/template.tsx (layout DEĞİL — template her route değişiminde yeniden render edilir)
'use client';

import { motion } from 'framer-motion';

export default function Template({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

### 3.4. Stagger Liste (Blog Kartları)

```jsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

<motion.div variants={container} initial="hidden" animate="show">
  {posts.map((post, i) => (
    <motion.article
      key={post.id}
      variants={{
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0 },
      }}
    >
      <PostCard post={post} />
    </motion.article>
  ))}
</motion.div>
```

## 4. SPRING FİZİĞİ (Doğal Animasyonlar)

CSS ease yerine spring tercih et:

```jsx
<motion.div
  transition={{
    type: 'spring',
    stiffness: 100,   // Yay sertliği (default: 100)
    damping: 15,      // Sürtünme (default: 10)
    mass: 0.5,        // Kütle (default: 1)
  }}
/>
```

| Kullanım | stiffness | damping |
|----------|-----------|---------|
| Buton hover | 400 | 17 |
| Modal açılış | 300 | 24 |
| Liste item girişi | 100 | 15 |
| Yumuşak geçiş | 50 | 20 |

## 5. YAPILMAMASI GEREKENLER

- **`key` prop'unu unutMA** — AnimatePresence içinde her child'ın unique key'i OLMALI
- **100+ element için stagger kullanma** — 50+ elementte performans düşer, CSS animation kullan
- **`layout` animasyonunu liste içinde kullanma** — 20+ elementte belirgin performans düşüşü olur
- **`whileInView` ile `animate` aynı anda** — Çakışır, öncelikli olanı seç
- **Nested AnimatePresence** — İç içe AnimatePresence beklenmedik davranışlara yol açar, YAPMA
- **`transition` içinde `type: 'tween'` ile `ease: [0.25, 0.1, 0.25, 1]`** — Spring daha doğal hissettirir
