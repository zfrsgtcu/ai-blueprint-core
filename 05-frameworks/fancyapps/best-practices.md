<!--
  BU DOSYANIN AMACI:
  Fancyapps ile performanslı media galerisi pattern'leri, responsive davranış, erişilebilirlik ve yaygın hatalardan kaçınma yöntemlerini AI'a öğretir.
-->

# FANCYAPPS BEST PRACTICES

## 1. FANCYBOX PERFORMANS

### 1.1. Lazy Loading (ZORUNLU: 10+ Görsel)

```html
<!-- data-src: thumbnail ile large image ayrı -->
<a href="/images/photo-large.jpg" data-fancybox="gallery">
  <img
    src="/images/photo-thumb.jpg"
    alt="Manzara"
    loading="lazy"          <!-- Native lazy loading -->
    width="400"
    height="300"            <!-- CLS önleme -->
  />
</a>
```

```tsx
// React'te thumbnail optimizasyonu:
function GalleryImage({ thumb, full, alt }: { thumb: string; full: string; alt: string }) {
  return (
    <a href={full} data-fancybox="gallery" data-caption={alt}>
      <img
        src={thumb}
        alt={alt}
        loading="lazy"
        className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition-opacity"
      />
    </a>
  );
}
```

### 1.2. Image Format ve Boyut

```
Thumbnail: 400x300, WebP, max 30KB
Full: 1920x1080 (max), WebP, max 300KB
```

Next.js projelerinde `next/image` ile otomatik optimizasyon:

```tsx
import Image from 'next/image';

<Fancybox>
  <a href="/images/large/photo.webp" data-fancybox="gallery">
    <Image
      src="/images/thumb/photo.webp"
      alt="Manzara"
      width={400}
      height={300}
      className="rounded-lg"
    />
  </a>
</Fancybox>
```

## 2. RESPONSIVE DAVRANIŞ

### 2.1. Mobile Lightbox

```ts
Fancybox.bind('#gallery', '[data-fancybox]', {
  groupAll: true,
  Thumbs: {
    type: 'modern',
    // Mobilde thumb'ları küçült:
    minScreenWidth: 640,
  },
  Toolbar: {
    display: {
      left: ['infobar'],
      middle: [],
      right: ['thumbs', 'close'],
    },
  },
  // Mobilde fullscreen:
  on: {
    reveal: (fancybox, slide) => {
      if (window.innerWidth < 640) {
        fancybox.container.classList.add('is-mobile');
      }
    },
  },
});
```

### 2.2. Carousel Responsive

```ts
new Carousel(carouselRef.current, {
  slidesPerPage: 1,
  breakpoints: {
    640: { slidesPerPage: 2 },
    1024: { slidesPerPage: 3 },
    1280: { slidesPerPage: 4 },
  },
  Navigation: true,
  Dots: window.innerWidth < 768, // Sadece mobilde dots
});
```

## 3. ERİŞİLEBİLİRLİK (A11Y)

### 3.1. Klavye Navigasyonu

Fancybox varsayılan olarak klavye desteği sunar:

| Tuş | Davranış |
|-----|----------|
| `Esc` | Kapat |
| `← →` | Önceki/Sonraki slayt |
| `Space` | Play/Pause (video) |
| `Tab` | Odak gezintisi |

Kapatma butonuna erişilebilir etiket ekleyin:

```ts
Fancybox.bind(container, '[data-fancybox]', {
  l10n: {
    CLOSE: 'Kapat',
    NEXT: 'Sonraki',
    PREV: 'Önceki',
    MODAL: 'Diyalog penceresini kapatmak için ESC tuşuna basabilirsiniz',
  },
});
```

### 3.2. Modal Erişilebilirliği

```ts
Fancybox.show([{ src: '#contact-form', type: 'inline' }], {
  trapFocus: true,           // Focus'u modal içinde tut
  autoFocus: true,           // İlk input'a focus
  placeFocusBack: true,      // Kapanınca focus'u geri ver
});
```

## 4. MEMORY MANAGEMENT

### 4.1. Büyük Galeriler (50+ Görsel)

```ts
// KÖTÜ: 50 görselin hepsini DOM'a render et
{gallery.map(img => <a href={img.full}><img src={img.thumb}/></a>)}

// İYİ: Virtual scroll veya pagination
const [visible, setVisible] = useState(gallery.slice(0, 20));

// "Daha fazla yükle" butonu:
function loadMore() {
  setVisible(prev => gallery.slice(0, prev.length + 20));
}
```

### 4.2. Instance Temizliği

```tsx
useEffect(() => {
  const carousels: Carousel[] = [];

  // Birden fazla carousel init ediliyorsa:
  document.querySelectorAll('.f-carousel').forEach(el => {
    carousels.push(new Carousel(el));
  });

  return () => {
    carousels.forEach(c => c.destroy()); // ZORUNLU: hepsini temizle
    Fancybox.close();                    // Açık lightbox'ları kapat
  };
}, []);
```

## 5. SSR STRATEJİSİ

```tsx
// Fancyapps bileşenlerinin SSR'da render edilmesini engelle:
'use client';

import { useEffect, useState } from 'react';

export function SafeCarousel(props: CarouselProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // SSR'da placeholder göster, CLS'yi önle
    return <div className="f-carousel-placeholder" style={{ aspectRatio: '16/9' }} />;
  }

  return <AppCarousel {...props} />;
}
```

## 6. CSS MARQUEE + FANCYBOX GALERİSİ (Film Şeridi Efekti)

### 6.1. Pattern: Kesintisiz Kayan Galeri

```css
.gallery-strip-track {
  display: flex;
  gap: 10px;
  width: fit-content;
  animation: galleryMarquee 45s linear infinite;
  will-change: transform;       /* GPU hızlandırma — takılmasız loop */
  backface-visibility: hidden;
}

/* İçerik 2 kez tekrarlanır, animasyon -50% translate eder = 1 set genişliği */
@keyframes galleryMarquee {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

Her görsel 2 kopya halinde (orijinal + tekrar seti), `translateX(-50%)` tam bir set genişliği kadar kaydırır → döngü başa döndüğünde içerik birebir aynı olduğu için görünür restart **olmaz**.

### 6.2. 🐛 Bilinen Bug: Hover'da Görsel Kayması

**Problem**: Marquee animasyonu devam ederken görselin üzerine gelince:
- `animation-duration: 90s` (yavaşlatma) kullanılırsa track hâlâ kayar
- İmleç altındaki görsel yavaşça uzaklaşır, başka bir görsel imlecin altına gelir
- Scale/overlay efektleri yanlış görsele uygulanır → UX hatası

**Çözüm**: Hover'da `animation-play-state: paused` KULLAN:

```css
/* ✅ DOĞRU: Hover'da track tamamen durur */
.gallery-strip-wrapper:hover .gallery-strip-track {
  animation-play-state: paused;
}

/* ❌ YANLIŞ: Hover'da sadece yavaşlatmak — görsel kayar, hover target değişir */
.gallery-strip-wrapper:hover .gallery-strip-track {
  animation-duration: 90s;
}
```

Fare track'ten çekilince animasyon kaldığı yerden devam eder — kesinti olmaz.

### 6.3. HTML Şablonu (Astro/HTML)

```astro
<section class="overflow-hidden">
  <div class="gallery-strip-wrapper">
    <div class="gallery-strip-track">
      <!-- 1. set (orijinal) -->
      {images.map((img) => (
        <a href={img.src} data-fancybox="gallery-strip" data-caption={img.alt}>
          <img src={img.thumb} alt={img.alt} width="400" height="300" loading="lazy" />
        </a>
      ))}
      <!-- 2. set (tekrar — kesintisiz döngü için) -->
      {images.map((img) => (
        <a href={img.src} data-fancybox="gallery-strip" data-caption={img.alt}>
          <img src={img.thumb} alt={img.alt} width="400" height="300" loading="lazy" />
        </a>
      ))}
    </div>
  </div>
</section>
```

### 6.4. Fancybox Bind (Seamless Integration)

```ts
Fancybox.bind('[data-fancybox="gallery-strip"]', {
  Carousel: { infinite: true },   // Sonsuz döngü
  dragToClose: true,              // Mobilde aşağı çekince kapat
  animated: true,
  Images: { zoom: true },
  Toolbar: {
    display: [
      { id: 'counter', position: 'center' },
      'zoom', 'slideshow', 'fullscreen', 'download', 'close',
    ],
  },
});
```

### 6.5. Mask Gradient (Kenar Geçişi)

Kayan görsellerin sağ/sol kenarda yumuşak kaybolması için:

```css
.gallery-strip-wrapper {
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 3%,
    black 97%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 3%,
    black 97%,
    transparent 100%
  );
}
```

## 7. YAPILMAMASI GEREKENLER

- **`destroy()` çağırmadan component'i unmount etmek** — Event listener'lar kalır, memory leak
- **Videolu lightbox'ta `type` belirtmeden açma** — Tipi belirt: `type: 'video'`
- **50+ görseli aynı anda DOM'a render** — Pagination/Sanal liste kullan
- **Fancybox'ı `body` yerine `container`'a bind etme** — `delegate` parametresi ile scope'u sınırla
- **Panzoom'da `zoom` event'i için debounce kullanmama** — Her zoom adımında render yapma
- **Carousel + Fancybox aynı container'da** — İç içe bind etme, ayrı container'lar kullan
- **Mobilde 4+ `slidesPerPage`** — Mobilde max 1-2 slayt, daha fazlası okunmaz
- **CSS Marquee hover'da `animation-duration` değiştirme** — `animation-play-state: paused` kullan, yoksa hover target kayar
- **Marquee track'te `will-change` eklememe** — Subpixel yuvarlama hatası, GPU hızlandırma şart
