<!--
  BU DOSYANIN AMACI:
  AI ajanlarına Next.js 14.x (App Router, React 18) ile proje geliştirirken uyması gereken best practice kurallarını öğretir.
  Server Components, App Router, data fetching stratejisi, SEO, performans optimizasyonu ve Vercel deployment kurallarını kapsar.
-->

# NEXT.JS 14.X (APP ROUTER) — BEST PRACTICE RULES

## 1. GENEL PRENSİPLER

Next.js 14+ App Router, React Server Components (RSC) öncelikli paradigmadır. Temel felsefe: **Server Components varsayılan, 'use client' gerektiğinde.** App Router, layout nesting, streaming ve partial rendering ile en iyi kullanıcı deneyimini hedefler.

1. 🔴 **ZORUNLU:** Server Components varsayılan olarak kullanılmalı. Sadece interactivity (onClick, useState, useEffect vb.) gerektiğinde `'use client'` ekle.
2. 🔴 **ZORUNLU:** `app/layout.tsx` mutlaka `<html>` ve `<body>` tag'lerini içermeli ve metadata export etmeli.
3. 🔴 **ZORUNLU:** API istekleri için Server Components'te direkt `fetch` kullan. Client components'te `@tanstack/react-query` tercih et.
4. 🔴 **ZORUNLU:** TypeScript kullanılmalı.

## 2. SERVER COMPONENTS vs CLIENT COMPONENTS

| Özellik | Server Component | Client Component |
|---------|-----------------|------------------|
| `useState` / `useEffect` | ❌ Kullanılamaz | ✅ Kullanılabilir |
| `onClick` / event handler | ❌ Kullanılamaz | ✅ Kullanılabilir |
| Direkt DB/API erişimi | ✅ | ❌ (API route gerekir) |
| Browser API | ❌ | ✅ |
| Dosya boyutu (bundle) | 0 KB | > 0 KB |
| `async` component | ✅ | ❌ |

1. 🔴 **ZORUNLU:** `'use client'` directive'i sadece gerekli olduğunda ekle — component ağacını gereksiz yere client'a taşıma.
2. 🟡 **ÖNERİLEN:** Server Component'i Client Component'e prop olarak (`children`) geç — böylece client tarafında bile server'da render edilir.
3. 🟠 **YASAK:** Server Component'te `useState`, `useEffect`, `createContext` kullanmak.

## 3. APP ROUTER ROUTING KURALLARI

1. 🔴 **ZORUNLU:** Sayfalar `app/<route>/page.tsx` olarak tanımlanmalı.
2. 🔴 **ZORUNLU:** Layout'lar `app/<route>/layout.tsx` olarak tanımlanmalı.
3. 🔴 **ZORUNLU:** `loading.tsx` ile sayfa yüklenirken Suspense fallback göster.
4. 🔴 **ZORUNLU:** `error.tsx` ile hata durumlarını kullanıcı dostu göster (`'use client'` gerekli).
5. 🔴 **ZORUNLU:** `not-found.tsx` ile 404 sayfası tanımla.
6. 🟡 **ÖNERİLEN:** `app/api/` altında route handler'lar ile backend proxy veya BFF oluştur.

```typescript
// app/api/{{model_names}}/route.ts — Route Handler ÖRNEK
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // Backend proxy — sensitive data (API key) burada kalır
  const res = await fetch(`${process.env.API_BASE_URL}/{{model_names}}`, {
    headers: { Authorization: `Bearer ${process.env.API_SECRET}` },
  });
  const data = await res.json();
  return NextResponse.json(data);
}
```

## 4. DATA FETCHING KURALLARI

| Yöntem | Kullanım Yeri | Cache |
|--------|-------------|-------|
| `fetch(url)` (SC) | Server Components | ✅ Otomatik |
| `fetch(url, { cache: 'no-store' })` | SSR (dinamik) | ❌ |
| `fetch(url, { next: { revalidate: 60 } })` | ISR (60 saniye) | ✅ ISR |
| React Query (CC) | Client Components | Client-side |
| Server Actions | Form mutation | N/A |

1. 🔴 **ZORUNLU:** Server Components'te direkt `fetch` kullan. Cache mekanizmasını anla.
2. 🔴 **ZORUNLU:** Dinamik sayfalarda `cache: 'no-store'` veya `export const dynamic = 'force-dynamic'` kullan.
3. 🔴 **ZORUNLU:** Client component'lerde `useEffect` + `fetch` yerine React Query kullan.
4. 🟠 **YASAK:** API key veya secret'ı client component'te kullanmak — `NEXT_PUBLIC_` prefix'i ile expose etme hatası.
5. 🟡 **ÖNERİLEN:** `next/cache` ile `revalidateTag` ve `revalidatePath` kullanarak hedefli cache temizleme.

## 5. METADATA VE SEO KURALLARI

1. 🔴 **ZORUNLU:** Her sayfada `metadata` export et (title, description, openGraph).
2. 🔴 **ZORUNLU:** `app/layout.tsx`'te root metadata tanımla (title template).
3. 🟡 **ÖNERİLEN:** `generateMetadata()` ile dinamik metadata.
4. 🟡 **ÖNERİLEN:** `robots.ts` ve `sitemap.ts` ile SEO dosyalarını programatik oluştur.
5. 🟡 **ÖNERİLEN:** `next/image` ile otomatik resim optimizasyonu ve lazy loading.

```typescript
// Dinamik metadata örneği
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const {{modelName}} = await fetch(`{{API_BASE_URL}}/{{model_names}}/${params.id}`).then(r => r.json());
  return {
    title: {{modelName}}.title,
    description: {{modelName}}.description,
    openGraph: { images: [{{modelName}}.image] },
  };
}
```

## 6. PERFORMANS KURALLARI

1. 🔴 **ZORUNLU:** `next/image` kullan — otomatik optimizasyon, lazy loading, responsive srcset.
2. 🔴 **ZORUNLU:** `next/link` kullan — prefetch ve client-side navigation.
3. 🔴 **ZORUNLU:** `dynamic()` import ile component lazy load:
   ```typescript
   const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
     loading: () => <Skeleton />,
     ssr: false, // Sadece client-side gerekiyorsa
   });
   ```
4. 🟡 **ÖNERİLEN:** Route Segment Config ile rendering stratejisini sayfa bazında belirle.
5. 🟠 **YASAK:** `<a>` etiketi yerine `<Link>` kullanmamak — tam sayfa yenilenir.

## 7. STYLING KURALLARI

1. 🔴 **ZORUNLU:** TailwindCSS kullan (proje standardı).
2. 🔴 **ZORUNLU:** `postcss.config.js` ve `tailwind.config.ts` dosyaları mevcut olmalı.
3. 🟡 **ÖNERİLEN:** CSS Modules (`.module.css`) sadece Tailwind'in yetmediği durumlarda.
4. 🟡 **ÖNERİLEN:** `clsx` veya `tailwind-merge` ile conditional class'lar.

## 8. ENVIRONMENT VARIABLES KURALLARI

1. 🔴 **ZORUNLU:** Server-only değişkenler: `process.env.API_SECRET` (prefix YOK).
2. 🔴 **ZORUNLU:** Client'a expose edilecekler: `process.env.NEXT_PUBLIC_API_BASE_URL`.
3. 🟠 **YASAK:** `NEXT_PUBLIC_` ile sensitive data expose etmek — client bundle'a dahil olur!
4. 🟡 **ÖNERİLEN:** `.env.local` dosyasında development değişkenleri, production'da Vercel dashboard.

## 9. DEPLOYMENT KURALLARI (Vercel)

1. 🔴 **ZORUNLU:** Build command: `next build`. Output otomatik yönetilir.
2. 🔴 **ZORUNLU:** Environment variables Vercel dashboard'dan yönet.
3. 🟡 **ÖNERİLEN:** `middleware.ts` ile auth guard, redirect, A/B testing.
4. 🟡 **ÖNERİLEN:** Vercel Analytics ve Speed Insights entegrasyonu.

## 10. YAYGIN HATALAR (AI'NIN KAÇINMASI GEREKENLER)

1. ❌ **Gereksiz yere `'use client'` eklemek** — Server Component'in tüm avantajlarını kaybedersin.
2. ❌ **Server Component'te `useState` / `useEffect` kullanmak** — build hatası.
3. ❌ **Client component'te API key expose etmek** — `NEXT_PUBLIC_` ile hassas veri paylaşmak.
4. ❌ **`fetch` cache mekanizmasını anlamamak** — veriler güncellenmez, "neden eski veri görünüyor?" sorunları.
5. ❌ **`<a>` etiketi kullanmak** — client-side navigation kaybolur, `<Link>` kullan.
6. ❌ **`next/image` olmadan `<img>` kullanmak** — optimizasyon kaybı, LCP metrikleri kötüleşir.
7. ❌ **Server Actions'ta input validation yapmamak** — güvenlik açığı.

## 11. DİZİN YAPISI KONTROL LİSTESİ

AI, oluşturduğu Next.js projesinde şunları kontrol etmelidir:

- [ ] `next.config.js` mevcut (görsel domain'leri, rewrites varsa tanımlanmış)
- [ ] `app/layout.tsx` mevcut, `<html lang="tr">` + `<body>` + metadata export
- [ ] `app/page.tsx` ana sayfa mevcut
- [ ] `tailwind.config.ts` mevcut, content paths doğru
- [ ] `postcss.config.js` mevcut
- [ ] `tsconfig.json` mevcut
- [ ] `components/` klasörü mevcut
- [ ] `lib/` klasörü mevcut
- [ ] `package.json`'da `next`, `react`, `react-dom`, `tailwindcss` var
- [ ] `package.json`'da `build` script'i `next build`
- [ ] `'use client'` direktifi sadece gereken component'lere eklenmiş
- [ ] Server component'lerde `async` kullanılabilir, client component'lerde kullanılmamış
- [ ] Environment variables doğru prefix ile: server-only = `API_*`, client = `NEXT_PUBLIC_*`
