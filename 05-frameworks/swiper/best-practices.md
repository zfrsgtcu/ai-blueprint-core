<!--
  BU DOSYANIN AMACI:
  Swiper.js'in performanslı kullanım sırları, responsive breakpoint yönetimi ve yaygın hatalardan kaçınma yöntemlerini AI'a öğretir.
-->

# SWIPER.JS BEST PRACTICES

## 1. PERFORMANS OPTİMİZASYONU

### 1.1. Lazy Loading (Görseller için ZORUNLU)

```jsx
<Swiper
  lazy={{
    loadPrevNext: true,       // Önceki ve sonraki slide'ı önceden yükle
    loadPrevNextAmount: 2,   // Kaç slide önceden yüklensin
  }}
>
  <SwiperSlide>
    <img data-src="/image1.jpg" className="swiper-lazy" />
    <div className="swiper-lazy-preloader"></div>
  </SwiperSlide>
</Swiper>
```

Carousel'de 5'ten fazla slide varsa lazy loading ZORUNLUDUR. İlk yüklemede tüm görselleri yükleme.

### 1.2. Sanal Slider (100+ slide)

50'den fazla slide varsa `Virtual` modülü kullan:

```jsx
import { Virtual } from 'swiper/modules';

<Swiper modules={[Virtual]} virtual>
  {data.map((item, index) => (
    <SwiperSlide key={item.id} virtualIndex={index}>
      {item.content}
    </SwiperSlide>
  ))}
</Swiper>
```

Virtual slider sadece görünen slide'ları DOM'da tutar. 1000 slide'ı tek seferde render ETME.

### 1.3. CSS GPU Hızlandırması

Swiper'ın transform animasyonları GPU'da çalışır. Ek `will-change` ekleME (Swiper otomatik yönetir).

## 2. RESPONSIVE BREAKPOINTS

### 2.1. Breakpoint Stratejisi

```jsx
<Swiper
  slidesPerView={1.2}   // Mobil: 1.2 (peek efekti)
  spaceBetween={16}
  breakpoints={{
    640: {
      slidesPerView: 2,
      spaceBetween: 20,
    },
    768: {
      slidesPerView: 3,
      spaceBetween: 24,
    },
    1024: {
      slidesPerView: 4,
      spaceBetween: 30,
    },
  }}
>
```

### 2.2. slidesPerView: 'auto' Kullanımı

```jsx
<Swiper slidesPerView="auto" spaceBetween={16}>
  <SwiperSlide style={{ width: '300px' }}>...</SwiperSlide>
  <SwiperSlide style={{ width: '200px' }}>...</SwiperSlide>
  <SwiperSlide style={{ width: '350px' }}>...</SwiperSlide>
</Swiper>
```

Her slide kendi genişliğini alır. Farklı boyutlu card'lar için idealdir.

**UYARI:** `slidesPerView: 'auto'` ile `loop: true` kullanılamaz — Swiper toplam genişliği hesaplayamaz.

## 3. YAYGIN PATTERN'LER

### 3.1. Hero Carousel (Full-screen, Autoplay)

```jsx
<Swiper
  modules={[Autoplay, EffectFade]}
  effect="fade"
  autoplay={{
    delay: 5000,
    disableOnInteraction: false, // Kullanıcı etkileşimi autoplay'ı DURDURMASIN
    pauseOnMouseEnter: true,
  }}
  speed={1000}             // Geçiş hızı (ms)
  loop={true}
>
  <SwiperSlide>
    <div className="h-screen w-full">
      <img src="/hero-1.jpg" className="w-full h-full object-cover" />
    </div>
  </SwiperSlide>
</Swiper>
```

### 3.2. Thumbnail Gallery (Ürün Detay)

```jsx
import { useState } from 'react';
import { Thumbs, FreeMode, Navigation } from 'swiper/modules';

export default function ProductGallery() {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  return (
    <>
      <Swiper
        modules={[Thumbs, Navigation]}
        thumbs={{ swiper: thumbsSwiper }}
        navigation
        className="main-gallery"
      >
        <SwiperSlide><img src="/product-1.jpg" /></SwiperSlide>
      </Swiper>

      <Swiper
        onSwiper={setThumbsSwiper}
        modules={[FreeMode, Navigation]}
        slidesPerView={4}
        freeMode={true}
        watchSlidesProgress={true} // ZORUNLU: thumbs senkronizasyonu için
        className="thumb-gallery mt-4"
      >
        <SwiperSlide><img src="/thumb-1.jpg" /></SwiperSlide>
      </Swiper>
    </>
  );
}
```

### 3.3. Card Carousel (E-ticaret)

```jsx
<Swiper
  modules={[Navigation]}
  slidesPerView={1.1}
  spaceBetween={20}
  navigation
  breakpoints={{
    640: { slidesPerView: 2.2 },
    1024: { slidesPerView: 4 },
  }}
>
  {products.map(product => (
    <SwiperSlide key={product.id}>
      <ProductCard product={product} />
    </SwiperSlide>
  ))}
</Swiper>
```

## 4. MEMORY LEAK ÖNLEME

### 4.1. Instance Destroy (Vanilla JS / Svelte / Astro)

```js
// Component unmount olduğunda:
swiperInstance.destroy(true, true);
// Parametreler: (deleteInstance, cleanStyles)
```

### 4.2. React: useEffect Cleanup

```jsx
useEffect(() => {
  return () => {
    // Swiper ref varsa destroy et
    swiperRef.current?.swiper?.destroy(true, true);
  };
}, []);
```

**React Swiper component'i** otomatik cleanup yapar. Manuel destroy SADECE vanilla instance kullanıyorsan gerekir.

## 5. YAPILMAMASI GEREKENLER

- **`autoplay.delay` 2000ms'den az** — Kullanıcı deneyimi için minimum 3000ms, ideal 5000ms
- **`allowTouchMove: false` ile slide değiştirme** — Dokunmatik kaydırmayı kapatma, a11y sorunu
- **Slider içinde slider (nested Swiper)** — İçteki slider'da `nested: true` ve `touchReleaseOnEdges: true` kullan
- **`observer: true` ile performans düşüşü** — Sadece dinamik slide ekleme/çıkarma varsa kullan
- **CSS `display: none` ile Swiper'ı gizleme** — `swiper.update()` çağırılmazsa boyut hesaplaması bozulur. Gizle/göster sonrası `swiper.update()` ÇAĞIR.
- **Aynı sayfada 5'ten fazla Swiper instance** — Her biri ayrı event listener ekler, performansı düşürür
