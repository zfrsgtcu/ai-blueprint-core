<!--
  BU DOSYANIN AMACI:
  GSAP'in performans sırları, memory leak önleme ve profesyonel animasyon pattern'lerini AI'a öğretir.
  Animasyonların 60fps'de çalışması ve kullanıcı deneyimini bozmaması için kritik kurallar.
-->

# GSAP BEST PRACTICES

## 1. MEMORY LEAK ÖNLEME (EN KRİTİK)

### 1.1. Her Zaman Cleanup Yap

```js
// React: useGSAP otomatik cleanup yapar
useGSAP(() => {
  gsap.to('.box', { x: 100 });
}); // Unmount'ta otomatik kill

// Vue / Svelte / Vanilla: gsap.context() ile
const ctx = gsap.context(() => {
  gsap.to('.box', { x: 100 });
  ScrollTrigger.create({ trigger: '.section', start: 'top center' });
});

// Unmount'ta
ctx.revert(); // TÜM animasyonları ve ScrollTrigger'ları temizler
```

`ctx.revert()` vs `ctx.kill()`:
- `revert()`: Animasyonu durdurur VE elementleri orijinal haline döndürür
- `kill()`: Sadece durdurur, elementler son konumunda kalır

**Cleanup için `revert()` kullan.** Memory leak'in #1 sebebi cleanup yapılmamış ScrollTrigger'lardır.

### 1.2. ScrollTrigger Temizliği

```js
// Route değişiminde veya component unmount'unda:
ScrollTrigger.getAll().forEach(st => st.kill());
// veya gsap.context() kullanıyorsan ctx.revert() yeterli
```

## 2. PERFORMANS OPTİMİZASYONU

### 2.1. Animatable Properties (GPU-Accelerated)

SADECE `transform` (x, y, scale, rotate) ve `opacity` animasyonları GPU'da çalışır:

```js
// DOĞRU: GPU accelerated
gsap.to('.box', { x: 100, opacity: 0.5, scale: 1.2 });

// YANLIŞ: CPU'da çalışır, repaint tetikler
gsap.to('.box', { width: 200, height: 200, top: 100, left: 500 });
```

`width`, `height`, `top`, `left`, `margin`, `padding` animasyonlarından KAÇIN. Onun yerine:
- `left` → `x` (translateX)
- `top` → `y` (translateY)
- `width/height` → `scaleX/scaleY` veya `clip-path`

### 2.2. will-change Kullanımı

Ağır animasyonlu elementlere `will-change` uygula:

```css
.animated-element {
  will-change: transform, opacity;
}
```

Ama animasyon bitince `will-change`'i kaldır (GSAP bunu otomatik yapmaz, manuel CSS):

```js
gsap.to('.box', {
  x: 100,
  onComplete() {
    gsap.set('.box', { willChange: 'auto' });
  }
});
```

### 2.3. FPS Hedefi

Tüm animasyonlar 60fps hedeflemelidir. Mobilde 30fps kabul edilebilir. Performans sorunu varsa:
- Animasyonlu element sayısını azalt
- `filter: blur()` gibi pahalı CSS efektlerinden kaçın
- `scrollTrigger` refresh rate'ini düşür: `ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load' })`

## 3. SCROLLTRIGGER BEST PRACTICES

### 3.1. Marker'ları Geliştirmede Kullan

```js
ScrollTrigger.create({
  trigger: '.section',
  start: 'top center',
  markers: process.env.NODE_ENV === 'development', // Sadece dev'de
  // ...
});
```

### 3.2. ScrollTrigger.refresh()

Aşağıdaki durumlarda `ScrollTrigger.refresh()` çağır:
- DOM yapısı değiştiğinde (yeni element eklendi/çıkarıldı)
- Route değişiminde (SPA)
- Lazy load edilen içerik yüklendiğinde
- Accordion/tab açılıp kapandığında

```js
// Next.js route değişiminde:
useGSAP(() => {
  // animasyonlar...
  ScrollTrigger.refresh();
});
```

### 3.3. Responsive ScrollTrigger

```js
ScrollTrigger.matchMedia({
  '(min-width: 768px)': function() {
    // Masaüstü animasyonları
    gsap.to('.box', { scrollTrigger: '.section', x: 500 });
  },
  '(max-width: 767px)': function() {
    // Mobil animasyonları (daha hafif)
    gsap.to('.box', { scrollTrigger: '.section', x: 100 });
  },
});
```

## 4. COMMON ANIMATION PATTERNS

### 4.1. Stagger Animasyonları

```js
// Listeden elementler sırayla gelsin
gsap.from('.card', {
  opacity: 0,
  y: 30,
  duration: 0.6,
  stagger: 0.1, // Her element 0.1s aralıkla
  scrollTrigger: {
    trigger: '.cards-container',
    start: 'top 80%',
  },
});
```

### 4.2. Timeline (Sıralı Animasyon)

```js
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    scrub: 1, // Scroll'a bağlı animasyon
  },
});

tl.from('.hero-title', { opacity: 0, y: 100 })
  .from('.hero-subtitle', { opacity: 0, y: 50 }, '-=0.3') // 0.3s overlap
  .from('.hero-cta', { opacity: 0, scale: 0.8 }, '-=0.2');
```

### 4.3. ScrollTo (Sayfa İçi Yumuşak Kaydırma)

```js
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
gsap.registerPlugin(ScrollToPlugin);

gsap.to(window, {
  duration: 1,
  scrollTo: '#target-section',
  ease: 'power2.inOut',
});
```

### 4.4. SplitText (Metin Animasyonu)

```js
import { SplitText } from 'gsap/SplitText';
gsap.registerPlugin(SplitText);

const split = new SplitText('.hero-title', { type: 'chars' });
gsap.from(split.chars, {
  opacity: 0,
  y: 20,
  stagger: 0.02,
  duration: 0.5,
});
```

## 5. YAPILMAMASI GEREKENLER

- **`setTimeout` ile animasyon geciktirme** — GSAP `delay` veya timeline `position` parametresi kullan
- **CSS transition ile GSAP'i karıştırma** — Aynı elementte hem CSS transition hem GSAP animasyonu ÇAKIŞIR
- **`!important` ile override etme** — GSAP inline style yazar, CSS `!important` ile ezmeye çalışma
- **100+ elementte aynı anda stagger** — Mobilde performans sorunu, max 30-40 element
- **`scrub` ile `pin`'i aynı anda yanlış kullanma** — Pin spacing hesaplaması için `end` değeri yeterli olmalı
- **GSAP ile CSS `@keyframes` animasyonlarını karıştırma** — İkisi aynı elementte çakışır
