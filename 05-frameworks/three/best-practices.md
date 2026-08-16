<!--
  BU DOSYANIN AMACI:
  Three.js ile performanslı 3D sahne optimizasyonu, model yükleme stratejileri ve yaygın hatalardan kaçınma yöntemlerini AI'a öğretir.
-->

# THREE.JS BEST PRACTICES

## 1. GEOMETRİ VE MATERYAL OPTİMİZASYONU

### 1.1. Geometri Paylaşımı (Instancing)

Aynı geometriyi 50+ kez kullanacaksan InstancedMesh:

```jsx
import { Instances, Instance } from '@react-three/drei';

<Instances limit={1000}>
  <boxGeometry />
  <meshStandardMaterial />
  {data.map((item, i) => (
    <Instance key={i} position={item.position} color={item.color} />
  ))}
</Instances>
```

1000 instance tek draw call yapar. Normalde 1000 ayrı mesh 1000 draw call yapar (performans felaketi).

### 1.2. Geometri Buffer Paylaşımı

```jsx
import { useMemo } from 'react';

// Kötü: Her render'da yeni geometri
<boxGeometry args={[1, 1, 1]} />

// İyi: useMemo ile buffer paylaşımı
const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
<primitive object={geometry} attach="geometry" />
```

### 1.3. Polygon Sayısı Hedefleri

| Platform | Max Polygon (Toplam) |
|----------|---------------------|
| Desktop (yüksek) | 500K |
| Desktop (standart) | 200K |
| Mobil (amiral gemisi) | 100K |
| Mobil (orta segment) | 50K |
| Mobil (giriş seviyesi) | 25K |

## 2. MODEL YÜKLEME STRATEJİLERİ

### 2.1. GLTF/GLB Ön İşleme

```bash
# Model optimizasyonu için gltf-transform CLI:
npx @gltf-transform/cli optimize model.glb output.glb --compress draco
```

Draco sıkıştırması model boyutunu %90 küçültür. Production'da Draco ZORUNLUDUR:

```jsx
import { MeshTransmissionMaterial, useGLTF } from '@react-three/drei';

// useGLTF otomatik cache'ler
const { scene } = useGLTF('/model-compressed.glb');
```

### 2.2. Lazy Loading (Suspense)

```jsx
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';

<Canvas>
  <Suspense fallback={<LoadingSpinner />}>
    <Model />
  </Suspense>
</Canvas>
```

Model yüklenene kadar Canvas boş render edilmez, fallback UI gösterilir.

### 2.3. useProgress (Yükleme Yüzdesi)

```jsx
import { useProgress } from '@react-three/drei';

function Loader() {
  const { progress } = useProgress();
  return <div>Yükleniyor... {Math.round(progress)}%</div>;
}
```

## 3. LIGHTING OPTİMİZASYONU

### 3.1. Işık Sayısı Sınırı

Forward rendering'de her ışık her piksel için hesaplanır. Max ışık sayısı:

- **AmbientLight:** 1 (her zaman)
- **DirectionalLight:** 1-2 (shadow'lu)
- **PointLight:** Max 4 (shadow'suz)
- **SpotLight:** Max 2 (shadow'lu)

5'ten fazla ışık source'u performansı belirgin düşürür.

### 3.2. Shadow Map Optimizasyonu

```jsx
<Canvas shadows>
  <directionalLight
    castShadow
    shadow-mapSize-width={512}   // 1024 yerine 512
    shadow-mapSize-height={512}
    shadow-camera-far={50}       // Gereksiz uzaklığı kıs
    shadow-camera-left={-10}
    shadow-camera-right={10}
    shadow-camera-top={10}
    shadow-camera-bottom={-10}
  />
</Canvas>
```

Shadow için `shadow-mapSize` değerini 1024'ten 512'ye düşürmek performansı 4x artırır.

## 4. POST-PROCESSING (Efektler)

Post-processing pahalıdır. Sadece gerekiyorsa kullan:

```jsx
import { EffectComposer, Bloom } from '@react-three/postprocessing';

// SADECE ihtiyaç varsa:
<EffectComposer>
  <Bloom luminanceThreshold={0.5} intensity={0.5} />
</EffectComposer>
```

Mobil cihazlarda post-processing'i TAMAMEN devre dışı bırak.

## 5. EVENT VE RAYCASTING

### 5.1. Gereksiz Event'leri Kapat

```jsx
// Tıklanabilir olmayan mesh'lerde event'leri kapat:
<mesh raycast={() => null}>
  <boxGeometry />
  <meshStandardMaterial />
</mesh>
```

Her mesh varsayılan olarak raycastable'dır. 100+ mesh varsa performans düşer.

## 6. YAPILMAMASI GEREKENLER

- **Her frame'de `new THREE.Vector3()` veya `new THREE.Color()`** — Object pool veya useMemo kullan
- **`useFrame` içinde state güncelleme** — Her frame'de React re-render tetikler, ref kullan
- **Büyük textürler (4K+)** — Max 2048x2048, mobilde 1024x1024
- **Mobilde antialias açık** — `gl={{ antialias: false }}` mobilde
- **Canvas'ta `style={{ width: '100vw', height: '100vh' }}`** — Full-screen 3D mobilde performansı öldürür
- **`requestAnimationFrame` loop'unu durdurmayı unutMA** — Component unmount olduğunda `frameloop="demand"` veya `invalidateFrameloop` kullan
