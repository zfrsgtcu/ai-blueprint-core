<!-- PURPOSE OF THIS FILE: GSAP implementation best practice'leri — AI ajanının uyması gereken ZORUNLU/YASAK/ÖNERİLEN kurallar -->
# GSAP Implementation Pattern

## Genel Prensipler

- 🔴 **ZORUNLU:** `prefers-reduced-motion` medya sorgusu her animasyondan ÖNCE kontrol edilir. Eşleşirse animasyon ATLANIR veya duration=0 yapılır.
- 🔴 **ZORUNLU:** React'te `gsap.context()` veya `useGSAP()` hook kullanılır. Doğrudan `useEffect` içinde GSAP kullanılmaz — cleanup sorunları yaratır.
- 🔴 **ZORUNLU:** Component unmount olduğunda tüm animasyonlar kill edilir (`.kill()` veya `context.revert()`).
- 🟠 **YASAK:** `top`, `left`, `width`, `height` gibi layout-trigger property'ler animasyon için kullanılmaz. Sadece GPU-accelerated transform'lar: `x`, `y`, `scale`, `opacity`, `rotation`.
- 🟡 **ÖNERİLEN:** Animasyon süreleri {{ANIMATION_DURATION}} değişkeninden okunur (varsayılan: 0.3s-0.6s).

## Erişilebilirlik

- 🔴 **ZORUNLU:** Animasyonlu element'lere `aria-label` veya `role` atanır.
- 🔴 **ZORUNLU:** `ScrollTrigger` ile `pin` yapılan alanlara `aria-label="Animasyonlu bölüm"` eklenir.
- 🟡 **ÖNERİLEN:** `matchMedia` ile tercih bazlı animasyon kontrolü:

```javascript
// ✅ DOĞRU — prefers-reduced-motion global kontrol
const mm = gsap.matchMedia();
mm.add('(prefers-reduced-motion: no-preference)', (ctx) => {
  // Animasyonlar sadece burada
  gsap.from('.hero-title', { y: 50, opacity: 0, duration: 0.6 });
});
```

## Kodlama Standartları

### React
```jsx
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function HeroBanner() {
  const container = useRef(null);

  useGSAP(() => {
    // useGSAP otomatik cleanup yapar
    const tl = gsap.timeline({ defaults: { duration: {{ANIMATION_DURATION}}, ease: 'power2.out' } });

    tl.from('.hero-title', { y: 60, opacity: 0 })
      .from('.hero-subtitle', { y: 30, opacity: 0 }, '-=0.2')
      .from('.hero-cta', { scale: 0.8, opacity: 0 }, '-=0.1');
  }, { scope: container });

  return (
    <section ref={container} aria-label="Hero bölümü">
      <h1 className="hero-title">Başlık</h1>
      <p className="hero-subtitle">Alt başlık</p>
      <button className="hero-cta">Harekete Geç</button>
    </section>
  );
}
```

### ScrollTrigger
```javascript
useGSAP(() => {
  gsap.from('.fade-in', {
    scrollTrigger: {
      trigger: '.fade-in',
      start: 'top 80%',
      toggleActions: 'play none none reverse',
      markers: process.env.NODE_ENV === 'development', // Sadece dev'de debug
    },
    y: 40,
    opacity: 0,
    duration: 0.6,
    stagger: 0.1,
  });

  // DOM güncellemelerinden sonra refresh
  return () => ScrollTrigger.refresh();
}, { scope: container });
```

### Vue
```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const containerRef = ref(null);
let ctx = null;

onMounted(() => {
  ctx = gsap.context(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.card', {
        scrollTrigger: { trigger: '.card-grid', start: 'top 70%' },
        y: 30, opacity: 0, duration: 0.5, stagger: 0.1
      });
    });
  }, containerRef.value);
});

onUnmounted(() => ctx?.revert());
</script>
```

## Performans

- 🔴 **ZORUNLU:** Sadece `transform` ve `opacity` animasyonu yapılır. `top/left/width/height` layout reflow tetikler.
- 🟡 **ÖNERİLEN:** `will-change` CSS property'si animasyon başlamadan önce eklenir, bitince kaldırılır.
- 🟡 **ÖNERİLEN:** `ScrollTrigger.refresh()` layout değişikliklerinden sonra çağrılır.

## Yaygın Hatalar

1. **prefers-reduced-motion kontrolü olmaması** — Erişilebilirlik ihlali, vestibüler rahatsızlığı olan kullanıcılar.
2. **React'te useGSAP yerine useEffect kullanmak** — Cleanup yapılmaz, memory leak.
3. **Layout property animasyonu** — `top/left` yerine `x/y` kullanılmazsa layout thrashing.
4. **ScrollTrigger markers production'da açık kalmak** — Görsel kirlilik.
5. **Timeline'da `.kill()` yapmamak** — Sayfa değişiminde animasyon devam eder, hata.
6. **`stagger` değerini çok büyük vermek** — Sıralı animasyon toplam süresi kullanıcıyı bekletir.
7. **`scrub` olmadan uzun scroll animasyonu** — Kullanıcı scroll'u ile animasyon senkronize olmaz.
