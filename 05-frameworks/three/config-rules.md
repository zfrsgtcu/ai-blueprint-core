<!--
  BU DOSYANIN AMACI:
  Three.js 3D kütüphanesinin framework'e göre kurulumunu AI'a öğretir.
  React (react-three-fiber), SSR uyumu ve temel 3D sahne kurulumunu içerir.
-->

# THREE.JS CONFIGURATION RULES

## 1. KURULUM SEÇENEKLERİ

### 1.1. React Projeleri (React Three Fiber)

```bash
npm install three @react-three/fiber @react-three/drei
```

- `three`: Three.js çekirdek kütüphanesi
- `@react-three/fiber`: React renderer (r3f)
- `@react-three/drei`: Hazır utility'ler (OrbitControls, Environment, Text3D vb.)

**React projesinde react-three-fiber KULLAN. Vanilla Three.js API'sini React'ta kullanMA.**

### 1.2. Vanilla / Astro / Svelte / Vue

```bash
npm install three
npm install -D @types/three  # TypeScript için
```

## 2. REACT THREE FIBER KURULUMU

### 2.1. Canvas Bileşeni

```jsx
'use client'; // Next.js App Router'da ZORUNLU

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{ width: '100%', height: '400px' }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
      <OrbitControls />
    </Canvas>
  );
}
```

### 2.2. Next.js'te SSR Çözümü

Canvas zaten client-side çalışır, ek SSR ayarına gerek yoktur. Ancak dinamik import önerilir:

```jsx
import dynamic from 'next/dynamic';

const Scene = dynamic(() => import('./Scene'), { ssr: false });

export default function Page() {
  return <Scene />;
}
```

### 2.3. Canvas Props Referansı

| Prop | Amaç | Varsayılan |
|------|------|-----------|
| `camera` | Kamera pozisyonu ve FOV | `{ position: [0,0,5], fov: 75 }` |
| `gl` | WebGL renderer ayarları | `{ antialias: true }` |
| `dpr` | Device pixel ratio | `[1, 2]` (min, max) |
| `shadows` | Gölge mapping | `false` |
| `performance` | Performans izleme | `{ current: 0, min: 0.5, max: 1 }` |

## 3. VUE + TRESJS (Vue için Three.js)

```bash
npm install three @tresjs/core @tresjs/cientos
```

```vue
<script setup>
import { TresCanvas } from '@tresjs/core';
import { OrbitControls } from '@tresjs/cientos';
</script>

<template>
  <TresCanvas>
    <TresPerspectiveCamera :position="[0, 0, 5]" />
    <TresAmbientLight :intensity="0.5" />
    <TresMesh>
      <TresBoxGeometry :args="[1, 1, 1]" />
      <TresMeshStandardMaterial color="hotpink" />
    </TresMesh>
    <OrbitControls />
  </TresCanvas>
</template>
```

## 4. ASTRO + THREE.JS

```astro
---
---

<div id="three-container" style="width: 100%; height: 400px;"></div>

<script>
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

  const container = document.getElementById('three-container');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // ... mesh, light, controls

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
</script>
```

## 5. PERFORMANS AYARLARI (BAŞLANGIÇTA)

```jsx
<Canvas
  dpr={[1, 1.5]}          // Yüksek DPR'de bile max 1.5
  performance={{ min: 0.5 }} // 30fps altına düşünce kaliteyi düşür
  frameloop="demand"       // Sadece değişiklik olduğunda render et
>
```

- `frameloop="demand"` statik sahnelerde pil tasarrufu sağlar
- `dpr={[1, 1.5]}` Retina'da bile max 1.5 DPR kullanır
- `performance={{ min: 0.5 }}` düşük FPS'te otomatik kalite düşürme

## 6. YAPILMAMASI GEREKENLER

- **React'ta vanilla Three.js API kullanma** — react-three-fiber kullan
- **Canvas içinde useState/useEffect fazla kullanma** — Her state değişimi tüm sahneyi re-render eder
- **1920x1080'den büyük canvas boyutu** — Performansı öldürür
- **500'den fazla polygon tek modelde** — Mobilde 30fps altına düşer, low-poly kullan
- **Shadow map açık unutma** — `gl={{ shadows: true }}` büyük performans maliyeti, sadece gerekiyorsa aç
