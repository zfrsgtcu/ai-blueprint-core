<!--
  BU DOSYANIN AMACI:
  Iconify ile tasarım tutarlılığı, erişilebilirlik, performans optimizasyonu ve yaygın anti-pattern'leri AI'a öğretir.
-->

# ICONIFY BEST PRACTICES

## 1. TASARIM TUTARLILIĞI

### 1.1. İkon Dili Seçimi

Proje başında tek bir ikon seti seç ve tüm ekipte onu kullan:

| Ürün Tipi | Önerilen Set | Nedeni |
|-----------|-------------|--------|
| SaaS Dashboard | `ph:` (Phosphor) | 6 varyant, modern, temiz |
| E-ticaret | `mdi:` (Material) | En geniş koleksiyon, tanıdık |
| Landing Page | `lucide:` (Lucide) | Minimalist, Tailwind dostu |
| Enterprise B2B | `carbon:` (Carbon) | Profesyonel, IBM standardı |
| Admin Panel | `tabler:` (Tabler) | Dashboard için optimize |

### 1.2. Varyant Tutarlılığı

Phosphor 6 varyant sunar, proje genelinde TEK varyant seç:

```tsx
// TUTARLI: Tüm ikonlar aynı varyant
<Icon icon="ph:user-bold" />
<Icon icon="ph:gear-bold" />
<Icon icon="ph:trash-bold" />

// TUTARSIZ: Karışık varyant
<Icon icon="ph:user-bold" />
<Icon icon="ph:gear" />        {/* regular */}
<Icon icon="ph:trash-fill" />  {/* fill */}
```

## 2. ERİŞİLEBİLİRLİK (A11Y)

### 2.1. aria-label ZORUNLU

```tsx
// KÖTÜ: Ekran okuyucu "image" der
<Icon icon="mdi:delete" />

// İYİ: Anlamlı etiket
<button onClick={handleDelete} aria-label="Sil">
  <Icon icon="mdi:delete" />
</button>

// VEYA Icon wrapper ile:
function AccessibleIcon({ icon, label }: { icon: string; label: string }) {
  return (
    <span role="img" aria-label={label}>
      <Icon icon={icon} />
    </span>
  );
}
```

### 2.2. Renk Kontrastı

```tsx
// KÖTÜ: Gri ikon, gri arka plan — okunmaz
<div className="bg-gray-200">
  <Icon icon="mdi:info" color="#d1d5db" />
</div>

// İYİ: WCAG AA kontrast (en az 4.5:1)
<div className="bg-gray-100">
  <Icon icon="mdi:info" color="#374151" /> {/* text-gray-700 */}
</div>
```

## 3. PERFORMANS

### 3.1. SVG Spritesheet (50+ Aynı İkon)

Aynı ikon sayfada 50+ kez kullanılıyorsa, Iconify yerine SVG sprite kullan:

```html
<!-- HTML'de bir kez tanımla -->
<svg style="display:none">
  <symbol id="icon-star" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </symbol>
</svg>

<!-- Her yerde referans ver (DOM element, SVG DOM değil) -->
<svg className="w-5 h-5"><use href="#icon-star"/></svg>
```

Bu, 50 `<Icon>` component'inin her birinin SVG DOM'u render etmesini önler.

### 3.2. Lazy Loading (Nadiren Kullanılan İkonlar)

```tsx
import { lazy, Suspense } from 'react';

const HeavyIcon = lazy(() => import('@iconify/react').then(m => ({
  default: () => <m.Icon icon="mdi:chart-bubble" />
})));

function Dashboard() {
  return (
    <Suspense fallback={<div className="w-6 h-6 bg-gray-200 animate-pulse rounded" />}>
      <HeavyIcon />
    </Suspense>
  );
}
```

## 4. İKON WRAPPER PATTERN'I

```tsx
// components/ui/AppIcon.tsx
import { Icon, IconProps } from '@iconify/react';
import { cn } from '@/lib/utils';

type IconSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

interface AppIconProps extends Omit<IconProps, 'width' | 'height'> {
  size?: IconSize;
  customSize?: number;
}

export function AppIcon({ icon, size = 'md', customSize, className, ...props }: AppIconProps) {
  const px = customSize ?? sizeMap[size];

  return (
    <Icon
      icon={icon}
      width={px}
      height={px}
      className={cn('shrink-0', className)}
      {...props}
    />
  );
}

// Kullanım:
<AppIcon icon="mdi:delete" size="lg" className="text-red-500" />
```

## 5. DİNAMİK İKON GÜVENLİĞİ

```tsx
// KÖTÜ: Kullanıcı input'u ile ikon seçme (XSS riski)
function UserIcon({ iconName }: { iconName: string }) {
  return <Icon icon={iconName} />;
}

// İYİ: Whitelist kontrolü
const ALLOWED_ICONS = ['mdi:home', 'mdi:settings', 'mdi:user'] as const;

function UserIcon({ iconName }: { iconName: string }) {
  if (!ALLOWED_ICONS.includes(iconName as any)) {
    return <Icon icon="mdi:help-circle" />; // Fallback
  }
  return <Icon icon={iconName} />;
}
```

## 6. YAPILMAMASI GEREKENLER

- **Her ikon component'inde inline style** — Global CSS/Tailwind ile yönet, AppIcon wrapper kullan
- **İkon + metin aynı satırda yanlış hizalama** — `inline={true}` + `vertical-align: -0.125em`
- **Animasyonlu ikonlarda yeniden render** — Iconify ikonları SVG render eder, state değişiminde re-render olur; animate etme
- **Sunucu tarafında ikon render etme (Next.js hariç)** — Iconify client-side çalışır
- **100+ ikonlu ikon picker** — Kullanıcının ikon seçtiği arayüzde hepsini render etme, sanal liste kullan
- **İkon renklerini `!important` ile override** — CSS specificity'yi düzelt, `color` prop'unu kullan
