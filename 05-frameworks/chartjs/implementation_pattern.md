<!-- PURPOSE OF THIS FILE: Chart.js implementation best practice'leri — AI ajanının uyması gereken ZORUNLU/YASAK/ÖNERİLEN kurallar -->
# Chart.js Implementation Pattern

## Genel Prensipler

- 🔴 **ZORUNLU:** Tüm canvas element'lerine `aria-label` ve `role="img"` eklenir. Görme engelliler için veri tablosu fallback'i sağlanır.
- 🔴 **ZORUNLU:** Chart.js bileşenleri kullanılmadan önce `Chart.register(...)` ile register edilir. Tree-shaking için sadece kullanılan controller'lar import edilir.
- 🔴 **ZORUNLU:** `prefers-reduced-motion` medya sorgusuna saygı gösterilir. `animation: false` ile animasyonlar devre dışı bırakılır.
- 🟡 **ÖNERİLEN:** Renk paleti `{{CHART_COLORS}}` CSS custom properties veya tema sabitlerinden okunur.

## Erişilebilirlik

- 🔴 **ZORUNLU:** Canvas altında veya yanında veri tablosu (table) fallback'i:
```tsx
// ✅ DOĞRU — Canvas + veri tablosu fallback
<figure>
  <canvas id="salesChart" aria-label="2026 aylık satış grafiği: Ocak'ta 12K, Şubat'ta 19K..." role="img" />
  <figcaption className="sr-only">
    <table>
      <caption>Aylık satış verileri</caption>
      <thead><tr><th>Ay</th><th>Satış</th></tr></thead>
      <tbody>
        {data.map(d => <tr key={d.month}><td>{d.month}</td><td>{d.sales}</td></tr>)}
      </tbody>
    </table>
  </figcaption>
</figure>
```

## Kodlama Standartları

### React
```tsx
import {
  Chart as ChartJS,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useMemo } from 'react';

// Tree-shakeable register — sadece kullanılanlar
ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const CHART_COLORS = {{CHART_COLORS}};

interface BarChartProps {
  labels: string[];
  values: number[];
  ariaLabel: string;
}

export function BarChart({ labels, values, ariaLabel }: BarChartProps) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const data = useMemo(() => ({
    labels,
    datasets: [{
      data: values,
      backgroundColor: CHART_COLORS.map(c => c.fill),
      borderColor: CHART_COLORS.map(c => c.border),
      borderWidth: 1,
      borderRadius: 4,
    }],
  }), [labels, values]);

  const options: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: prefersReducedMotion ? false : { duration: {{ANIMATION_DURATION}} },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
      x: { grid: { display: false } },
    },
  }), [prefersReducedMotion]);

  return (
    <div className="relative h-80">
      <Bar data={data} options={options} aria-label={ariaLabel} />
    </div>
  );
}
```

### Vue
```vue
<script setup lang="ts">
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { Bar } from 'vue-chartjs';
import { computed } from 'vue';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

const props = defineProps<{ labels: string[]; values: number[] }>();

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [{ data: props.values, backgroundColor: {{CHART_COLORS}} }],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : undefined,
}));
</script>

<template>
  <div style="height: 20rem">
    <Bar :data="chartData" :options="chartOptions" aria-label="Grafik" />
  </div>
</template>
```

## Grafik Tipi Seçim Kılavuzu

| Tip | Ne Zaman | Dikkat |
|-----|---------|--------|
| **Bar** | Kategori karşılaştırması | Y ekseni her zaman 0'dan başlamalı |
| **Line** | Zaman serisi, trend | Nokta sayısı > 12 ise x eksenini döndür |
| **Pie / Doughnut** | Parça-bütün ilişkisi (≤6 dilim) | 6+ dilim için bar chart daha okunaklı |
| **Radar** | Çok boyutlu karşılaştırma | 3-8 eksen ideal |
| **Scatter** | Korelasyon, dağılım | Her noktaya tooltip vermek performansı etkiler |

## Yaygın Hatalar

1. **Canvas'a aria-label vermemek** — Ekran okuyucu kullanıcıları grafiği hiç algılayamaz.
2. **Tüm Chart.js bileşenlerini import etmek** — Bundle büyür. Sadece kullanılan controller'lar register edilmeli.
3. **prefers-reduced-motion kontrolü olmaması** — Vestibüler rahatsızlığı olan kullanıcılar.
4. **maintainAspectRatio: false demeden height vermek** — Container height'ı ile canvas height'ı eşleşmez.
5. **Bar chart'ta y ekseni 0'dan başlamamak** — Görsel manipülasyon, veriyi yanlış yansıtır.
6. **6+ dilimli pie chart** — Okunaksız. Bar chart'a geçin.
7. **Responsive container olmadan fixed width canvas** — Mobilde taşma.
