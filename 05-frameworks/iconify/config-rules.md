<!--
  BU DOSYANIN AMACI:
  Iconify'ın farklı framework'lere göre doğru kurulumunu, icon set seçimini ve bundle optimizasyonunu AI'a öğretir.
-->

# ICONIFY CONFIGURATION RULES

## 1. ICONIFY NEDİR?

Iconify, 200.000+ ikonu tek bir API üzerinden sunan, framework-agnostic bir ikon sistemidir. Material Design Icons, Heroicons, Phosphor, Lucide, Font Awesome ve daha yüzlerce set içinden seçim yapmaya olanak sağlar.

**Avantajı:** Her ikon seti için ayrı paket kurmaya gerek yoktur. Sadece kullanılan ikonlar bundle'a dahil olur.

## 2. FRAMEWORK'E GÖRE KURULUM

### 2.1. React / Next.js

```bash
npm install @iconify/react
```

```tsx
'use client'; // Next.js App Router'da ZORUNLU

import { Icon } from '@iconify/react';

// Temel kullanım:
function DeleteButton() {
  return <Icon icon="mdi:delete" width={24} height={24} />;
}

// Tailwind renkleriyle:
<Icon icon="ph:user-circle-bold" className="text-blue-500 w-6 h-6" />
```

**SSR Uyarısı:** Next.js App Router'da ikonlar client component olmalıdır (`'use client'`). Pages Router'da `dynamic` import ile SSR dışı bırakın:

```tsx
import dynamic from 'next/dynamic';
const Icon = dynamic(() => import('@iconify/react').then(m => m.Icon), { ssr: false });
```

### 2.2. Vue 3 / Nuxt

```bash
npm install @iconify/vue
```

```vue
<script setup>
import { Icon } from '@iconify/vue';
</script>

<template>
  <Icon icon="mdi:home" width="24" height="24" />
</template>
```

**Nuxt 3:** `@iconify/vue` SSR uyumludur, ek yapılandırma gerekmez.

### 2.3. Svelte / SvelteKit

```bash
npm install @iconify/svelte
```

```svelte
<script>
  import Icon from '@iconify/svelte';
</script>

<Icon icon="ph:gear-fill" width="20" height="20" />
```

**SvelteKit SSR:** Sunucu tarafında ikon render edilir, hydration sorunu olmaz.

### 2.4. Astro

```bash
npm install @iconify/react
```

```astro
---
import { Icon } from '@iconify/react';
---

<Icon icon="mdi:star" client:load />
<!-- client:load ZORUNLU: Iconify client-side render eder -->
```

### 2.5. Vanilla HTML / Web Component (Framework Bağımsız)

`<iconify-icon>` bir **Web Component**'tir (Custom Element). Herhangi bir framework'e ihtiyaç duymaz — vanilla HTML'de de, React/Vue/Svelte gibi framework'lerde de çalışır.

**ÖNEMLİ:** Framework wrapper'ları (`@iconify/react`, `@iconify/vue`) yalnızca SSR hidrasyon sorunlarını çözmek ve framework'e özel render optimizasyonları sağlamak içindir. Web component versiyonu (`iconify-icon`) tüm ortamlarda çalışır.

```html
<!-- DOĞRU KULLANIM — UMD/IIFE build (önerilen) -->
<script src="https://code.iconify.design/iconify-icon/2.3.0/iconify-icon.min.js"></script>

<!-- ALTERNATİF — ESM build (type="module" ZORUNLU) -->
<script type="module" src="https://cdn.jsdelivr.net/npm/iconify-icon@2/+esm"></script>

<iconify-icon icon="mdi:account-circle" width="32" height="32"></iconify-icon>
```

**Uyarı:** ESM (`/+esm`) CDN URL'si `type="module"` olmadan kullanılırsa tarayıcı custom element'i kaydetmez ve ikonlar görünmez. Bu nedenle vanilla HTML projelerinde **UMD/IIFE build** (`code.iconify.design`) önerilir.

### 2.6. CSP (Content-Security-Policy) ZORUNLULUĞU

`iconify-icon` web component'i ikon SVG verilerini `https://api.iconify.design` adresinden **fetch API** ile çeker. CSP'de `connect-src` izni verilmezse ikonlar görünmez:

```html
<!-- CSP'de OLMASI ZORUNLU direktifler -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' ... https://code.iconify.design;  <!-- Script kaynağı -->
  connect-src 'self' https://api.iconify.design;       <!-- API fetch (ÇOK ÖNEMLİ) -->
">
```

**Sık yapılan hata:** Sadece `script-src` eklenir, `connect-src` unutulur. Script yüklenir, custom element kaydedilir, ancak ikonlar fetch edilemediği için boş görünür. Tarayıcı konsolunda CSP hatası görülür.

## 3. İCON SET SEÇİMİ

| İkon Seti | Prefix | Stil | İdeal Kullanım |
|-----------|--------|------|---------------|
| Material Design Icons | `mdi:` | Material | Admin panel, dashboard |
| Phosphor | `ph:` | Modern, 6 varyant | SaaS, modern UI |
| Lucide | `lucide:` | Minimalist, stroke | Clean UI, landing page |
| Heroicons | `heroicons:` | Solid/Outline | Tailwind projeleri |
| Tabler | `tabler:` | Stroke, teknik | Dashboard, araçlar |
| Carbon | `carbon:` | IBM tasarımı | Enterprise, B2B |

**Kural:** Bir projede EN FAZLA 2 farklı set kullan. Tutarlılık için tek set önerilir.

## 4. BUNDLE OPTİMİZASYONU

### 4.1. Tree Shaking (Otomatik)

Iconify sadece kullanılan ikonları bundle'a dahil eder. Hiçbir ek yapılandırma gerekmez:

```tsx
// SADECE 'mdi:delete' ve 'ph:user' bundle'a eklenir
<Icon icon="mdi:delete" />
<Icon icon="ph:user" />
// 'mdi:edit' KULLANILMADI, bundle'da YOK
```

### 4.2. Büyük Projelerde Offline Kullanım

Sürekli API'den çekmek yerine, kullanılan ikonları offline bundle yapın:

```bash
npm install @iconify/tools
```

```ts
// build-icons.ts — CI'da çalıştır
import { promises as fs } from 'fs';

// Sadece kullanılan ikonları bir JSON dosyasında topla
const usedIcons = {
  'mdi:delete': '<svg>...</svg>',
  'ph:user': '<svg>...</svg>',
};

await fs.writeFile('./public/icons.json', JSON.stringify(usedIcons));
```

```tsx
// Client'ta custom bundle ile:
import { addCollection } from '@iconify/react';

addCollection({
  prefix: 'custom',
  icons: {
    delete: { body: '<path d="..." />', width: 24, height: 24 },
    user: { body: '<path d="..." />', width: 24, height: 24 },
  },
});

<Icon icon="custom:delete" />
```

## 5. BOYUT VE RENK YÖNETİMİ

```tsx
// Boyut: width/height veya className ile
<Icon icon="mdi:home" width={32} height={32} />
<Icon icon="mdi:home" className="w-8 h-8" /> {/* Tailwind */}

// Renk: CSS color (inline veya className)
<Icon icon="mdi:star" color="#ff0000" />
<Icon icon="mdi:star" className="text-yellow-500" /> {/* Tailwind */}

// inline prop: false = CSS width/height kullan, true = SVG attribute kullan
<Icon icon="mdi:star" inline={true} /> {/* Metin içinde hizalanır */}
```

## 6. YAPILMAMASI GEREKENLER

- **5+ farklı ikon seti kullanma** — Tasarım tutarsızlığı, en fazla 2
- **Her ikon için ayrı SVG dosyası** — Iconify'ı kullanıyorsan hepsini tek sistemden al
- **`@iconify/react` ile SSR yapmaya çalışma** — Next.js App Router'da `'use client'` zorunlu
- **Kullanmadığın ikon setlerinin package'ını kurma** — Her set ~50KB-500KB, sadece ihtiyacın olanı kur
- **Icon boyutlarını iç içe geçmiş div'lerle ayarlamaya çalışma** — width/height prop'ları yeterli
- **API rate limit'i (saniyede 50 istek)** — Aşırı kullanımda offline bundle'a geç
- **CSP'de `connect-src` iznini unutma** — Web component kullanıyorsan `connect-src 'self' https://api.iconify.design` eklemezsen ikonlar fetch edilemez, boş görünür
