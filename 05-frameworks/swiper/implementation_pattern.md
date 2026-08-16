<!-- PURPOSE OF THIS FILE: Swiper implementation best practice'leri — AI ajanının uyması gereken ZORUNLU/YASAK/ÖNERİLEN kurallar -->
# Swiper Implementation Pattern

## Genel Prensipler

- 🔴 **ZORUNLU:** Tüm carousel/slider'lara erişilebilirlik desteği eklenir. `a11y` modülü Swiper v11'de varsayılan olarak aktiftir. Slide'lara `aria-label` ve `role="group"` ile `aria-roledescription="slide"` verilir.
- 🔴 **ZORUNLU:** `prefers-reduced-motion` kontrolü: `autoplay` sadece kullanıcı reduce-motion tercih etmediyse aktif olur.
- 🔴 **ZORUNLU:** Resim carousel'lerinde lazy loading kullanılıyorsa, boyutlar önceden belirtilir (CLS — Cumulative Layout Shift önleme).
- 🟠 **YASAK:** 3'ten az slide için carousel kullanılmaz. Grid layout yeterlidir.
- 🟡 **ÖNERİLEN:** 50+ slide için `virtual` modülü kullanılır.

## Erişilebilirlik

- 🔴 **ZORUNLU:** Navigation butonlarına anlamlı `aria-label` verilir:
```tsx
<Swiper
  navigation={{
    prevEl: '.swiper-button-prev',
    nextEl: '.swiper-button-next',
  }}
  a11y={{
    prevSlideMessage: 'Önceki slide',
    nextSlideMessage: 'Sonraki slide',
    firstSlideMessage: 'Bu ilk slide',
    lastSlideMessage: 'Bu son slide',
    paginationBulletMessage: 'Slide {{index}} sayfasına git',
  }}
>
```

## Kodlama Standartları

### React
```tsx
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

function ProductCarousel({ products }) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 3'ten az slide → carousel yerine grid
  if (products.length < 3) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    );
  }

  return (
    <section aria-label="Ürün galerisi" aria-roledescription="carousel">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, A11y]}
        spaceBetween={24}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
          1280: { slidesPerView: 4 },
        }}
        navigation={{
          prevEl: '.custom-prev',
          nextEl: '.custom-next',
        }}
        pagination={{ clickable: true }}
        autoplay={
          prefersReducedMotion
            ? false
            : { delay: 5000, disableOnInteraction: true }
        }
        a11y={{
          prevSlideMessage: 'Önceki ürün',
          nextSlideMessage: 'Sonraki ürün',
        }}
        grabCursor
        className="pb-12"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id} role="group" aria-roledescription="slide">
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom navigation */}
      <button className="custom-prev absolute left-0 top-1/2 z-10" aria-label="Önceki ürünler">
        <AppIcon icon="mdi:chevron-left" size={32} />
      </button>
      <button className="custom-next absolute right-0 top-1/2 z-10" aria-label="Sonraki ürünler">
        <AppIcon icon="mdi:chevron-right" size={32} />
      </button>
    </section>
  );
}
```

### Vue
```vue
<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const modules = [Navigation, Pagination, A11y];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
</script>

<template>
  <Swiper
    :modules="modules"
    :space-between="24"
    :slides-per-view="1"
    :breakpoints="{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }"
    :pagination="{ clickable: true }"
    :autoplay="prefersReducedMotion ? false : { delay: 4000 }"
    grab-cursor
    aria-label="Referans galerisi"
    aria-roledescription="carousel"
  >
    <SwiperSlide v-for="item in items" :key="item.id" role="group" aria-roledescription="slide">
      <slot :item="item" />
    </SwiperSlide>
  </Swiper>
</template>
```

## Performans

- 🔴 **ZORUNLU:** Resim carousel'de lazy loading + boyut belirtme:
```tsx
<SwiperSlide>
  <img
    src="/placeholder.jpg"
    data-src="/product-image.jpg"
    className="swiper-lazy w-full aspect-[4/3] object-cover"
    alt="Ürün görseli"
    width={800}
    height={600}
  />
  <div className="swiper-lazy-preloader" />
</SwiperSlide>
```
- 🟡 **ÖNERİLEN:** 50+ slide için `Virtual` modülü: DOM'da sadece görünen + buffer slide'lar render edilir.

## Yaygın Hatalar

1. **a11y modülünü import etmemek** — Klavye navigasyonu çalışmaz, ekran okuyucu slider'ı algılamaz.
2. **prefers-reduced-motion'da autoplay'i kapatmamak** — Otomatik kayan içerik vertigo/baş dönmesi tetikleyebilir.
3. **3'ten az slide için carousel kullanmak** — Gereksiz karmaşıklık, grid yeterli.
4. **CSS import'larını unutmak** — Navigation/pagination butonları görünmez.
5. **Lazy loading'de boyut belirtmemek** — CLS (Cumulative Layout Shift), Core Web Vitals cezası.
6. **`loop` ile birlikte slide sayısı < slidesPerView × 2** — Loop düzgün çalışmaz, boşluklar oluşur.
7. **Custom navigation butonlarına aria-label vermemek** — Ekran okuyucu için anlamsız buton.
