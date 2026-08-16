<!-- PURPOSE OF THIS FILE: Iconify implementation best practice'leri — AI ajanının uyması gereken ZORUNLU/YASAK/ÖNERİLEN kurallar -->
# Iconify Implementation Pattern

## Genel Prensipler

- 🔴 **ZORUNLU:** Proje genelinde TEK bir ikon seti kullanılır. mdi + lucide + phosphor karışımı olmaz. Tutarlı görsel dil için bir set seçilir.
- 🔴 **ZORUNLU:** Dekoratif ikonlar `aria-hidden="true"` ile ekran okuyuculardan gizlenir. Anlamlı ikonlara `aria-label` verilir.
- 🟠 **YASAK:** İkona tıklanabilir alan verirken wrapper div'e onClick koymak. İkon bir buton içindeyse, butona onClick ve aria-label verilir.
- 🟡 **ÖNERİLEN:** Sık kullanılan ikonlar için proje bazlı `<AppIcon>` wrapper component oluşturulur.

## Erişilebilirlik

- 🔴 **ZORUNLU:** Buton içindeki ikonlar:
```jsx
// ✅ DOĞRU
<button aria-label="Sepete ekle" onClick={handleAddToCart}>
  <Icon icon="mdi:cart-plus" aria-hidden="true" />
</button>

// ❌ YANLIŞ
<Icon icon="mdi:cart-plus" onClick={handleAddToCart} />
```

## Kodlama Standartları

### React
```tsx
import { Icon } from '@iconify/react';

// ✅ DOĞRU — Proje standardı wrapper
interface AppIconProps {
  icon: string;
  size?: number;
  className?: string;
  decorative?: boolean;
  label?: string;
}

export function AppIcon({ icon, size = 24, className = '', decorative = true, label }: AppIconProps) {
  return (
    <Icon
      icon={icon}
      width={size}
      height={size}
      className={className}
      aria-hidden={decorative || undefined}
      aria-label={!decorative ? label : undefined}
      role={!decorative ? 'img' : undefined}
    />
  );
}

// Kullanım
<AppIcon icon="mdi:home" size={20} className="text-primary-600" />
<AppIcon icon="mdi:delete" decorative={false} label="Sil" />
```

### Vue
```vue
<script setup>
import { Icon } from '@iconify/vue';
</script>

<template>
  <!-- ✅ DOĞRU -->
  <Icon icon="mdi:check-circle" :width="24" class="text-success-500" aria-hidden="true" />
</template>
```

### HTML (Web Component)
```html
<!-- ✅ DOĞRU — Dekoratif ikon -->
<iconify-icon icon="lucide:star" width="20" class="text-amber-400" aria-hidden="true"></iconify-icon>

<!-- ✅ DOĞRU — Anlamlı ikon -->
<button aria-label="Favorilere ekle">
  <iconify-icon icon="lucide:heart" aria-hidden="true"></iconify-icon>
</button>
```

## İkon Seti Seçim Kılavuzu

| Set | Prefix | Stil | Ne Zaman |
|-----|--------|------|---------|
| Material Design Icons | `mdi` | Material, kapsamlı | Material tabanlı tasarımlar, en geniş seçenek |
| Lucide | `lucide` | Outline, modern | Modern minimalist arayüzler |
| Phosphor | `ph` | 6 varyant (fill, bold, vb.) | Çoklu varyant gerektiğinde |
| HeroIcons | `heroicons` | Outline + solid | Tailwind ile birlikte |

## Yaygın Hatalar

1. **Birden fazla ikon seti kullanmak** — mdi, lucide, phosphor aynı projede → görsel tutarsızlık.
2. **Butona aria-label vermeden ikon kullanmak** — Ekran okuyucu için anlamsız "button" okur.
3. **İkon boyutunu px ile CSS override etmek** — `width={24}` attribute'u yerine CSS ile ezmek hydration sorunu yaratabilir.
4. **Statik import yerine API'den yükleme** — SSR'da ikonların geç yüklenmesi layout shift'e yol açar. Sık kullanılan ikonlar build-time bundle'a eklenmeli.
5. **İkona doğrudan onClick eklemek** — Erişilebilirlik ve semantik HTML ihlali.
