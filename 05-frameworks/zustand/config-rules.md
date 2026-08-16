<!--
  BU DOSYANIN AMACI:
  Zustand state management kütüphanesinin doğru kurulumunu, store pattern'lerini ve framework entegrasyonunu AI'a öğretir.
-->

# ZUSTAND CONFIGURATION RULES

## 1. KURULUM

```bash
npm install zustand
```

Zustand v5'ten itibaren React dışı framework'ler için de native API sunar. Ek plugin gerekmez.

## 2. REACT KURULUMU

### 2.1. Temel Store

```ts
// stores/useCounterStore.ts
import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
```

### 2.2. Next.js App Router'da Kullanım

```tsx
'use client'; // Store kullanan component'lerde ZORUNLU

import { useCounterStore } from '@/stores/useCounterStore';

export default function Counter() {
  const { count, increment } = useCounterStore();
  return <button onClick={increment}>{count}</button>;
}
```

## 3. STORE PATTERN'LERİ

### 3.1. Slice Pattern (Büyük Store'lar)

```ts
// stores/useAppStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthSlice {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

interface CartSlice {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
}

const createAuthSlice = (set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
});

const createCartSlice = (set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
});

export const useAppStore = create<AuthSlice & CartSlice>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createCartSlice(...a),
    }),
    { name: 'app-storage' }
  )
);
```

### 3.2. Middleware Zincirleme

Middleware'ler iç içe uygulanır (dıştan içe):

```ts
import { create } from 'zustand';
import { persist, devtools, subscribeWithSelector } from 'zustand/middleware';

export const useStore = create<State>()(
  devtools(                        // En dış
    persist(                       // Orta
      subscribeWithSelector(       // En iç
        (set) => ({
          // ... state ve actions
        })
      ),
      { name: 'store-key' }
    ),
    { name: 'AppStore' }
  )
);
```

## 4. MIDDLEWARE KULLANIMI

### 4.1. Persist (LocalStorage/SessionStorage)

```ts
import { persist, createJSONStorage } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({ /* state */ }),
    {
      name: 'app-storage',          // localStorage key
      storage: createJSONStorage(() => sessionStorage), // varsayılan: localStorage
      partialize: (state) => ({     // SADECE belirli alanları persist et
        theme: state.theme,
        language: state.language,
      }),
    }
  )
);
```

**Partialize ZORUNLU:** Tüm state'i persist etmek güvenlik ve performans sorunu yaratır.

### 4.2. Devtools (Redux DevTools)

```ts
import { devtools } from 'zustand/middleware';

export const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set(
        (state) => ({ count: state.count + 1 }),
        false, // replace: false
        'increment' // action name
      ),
    }),
    { name: 'CounterStore' } // DevTools'ta görünen isim
  )
);
```

## 5. SELECTOR OPTİMİZASYONU (EN KRİTİK)

### 5.1. Atomic Selector

```tsx
// KÖTÜ: Gereksiz re-render
const { count, increment, decrement } = useCounterStore();

// İYİ: Sadece ihtiyaç duyulan değer
const count = useCounterStore((state) => state.count);

// İYİ: Shallow equality (birden fazla primitive)
import { useShallow } from 'zustand/react/shallow';
const { count, total } = useCounterStore(
  useShallow((state) => ({ count: state.count, total: state.total }))
);
```

**Kural:** Her zaman atomic selector kullan. Objeyi bütün olarak almak tüm state değişimlerinde re-render tetikler.

## 6. FRAMEWORK DESTEĞİ

| Framework | Zustand Desteği | Not |
|-----------|----------------|-----|
| React | Native | `create` ile store |
| Next.js | Native | `'use client'` gerekli |
| Vue | `zustand-vue` paketi | `npm install zustand-vue` |
| Svelte | Vanilla API ile | `store.subscribe()` |
| Vanilla JS | Native | `createStore` (React dışı) |

## 7. YAPILMAMASI GEREKENLER

- **Server Component'te store kullanma** — Zustand client-state içindir
- **`set` içinde `set` çağırma** — Sonsuz döngü
- **Store içinde fetch yapma** — Actions'da async olabilir ama store dışında (React Query ile)
- **Store'u persist ederken şifre/token saklama** — `partialize` ile hassas verileri filtrele
- **20'den fazla store oluşturma** — Single source of truth'u kaybedersin, slice pattern kullan
