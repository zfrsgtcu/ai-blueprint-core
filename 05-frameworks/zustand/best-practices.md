<!--
  BU DOSYANIN AMACI:
  Zustand ile performanslı state yönetimi pattern'leri, selector optimizasyonu ve yaygın hatalardan kaçınma yöntemlerini AI'a öğretir.
-->

# ZUSTAND BEST PRACTICES

## 1. SELECTOR OPTİMİZASYONU (#1 PERFORMANS KONUSU)

### 1.1. Atomic Selector Her Zaman

```tsx
// KÖTÜ: count değişince increment fonksiyonu da yeni referans alır
const { count, increment } = useStore();

// İYİ: Sadece count değişince re-render
const count = useStore((s) => s.count);
const increment = useStore((s) => s.increment);
```

**Neden:** `increment` referansı hiç değişmez (store içinde sabit fonksiyon). Ama tüm store objesi yeni referans alır, bu da gereksiz re-render demektir.

### 1.2. useShallow (v5+)

```tsx
import { useShallow } from 'zustand/react/shallow';

// Birden fazla değer alırken:
const { name, email } = useStore(
  useShallow((s) => ({ name: s.name, email: s.email }))
);
```

### 1.3. Türetilmiş State (Derived State)

```tsx
// Store içinde (compute):
const useStore = create((set, get) => ({
  items: [],
  get completedCount() { return get().items.filter(i => i.done).length; },
  get isEmpty() { return get().items.length === 0; },
}));

// VEYA selector içinde:
const completedCount = useStore((s) => s.items.filter(i => i.done).length);
// ❌ Her render'da yeni array oluşturur!

// DOĞRUSU: Store içinde hesapla veya useMemo kullan
const completedCount = useStore((s) => s.completedCount); // Store içinde hesaplanmış
```

## 2. ASYNC ACTIONS PATTERN

### 2.1. Store İçinde API Call (Basit Durumlar)

```ts
const useUserStore = create((set) => ({
  user: null,
  loading: false,
  error: null,

  fetchUser: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/users/${id}`);
      const user = await res.json();
      set({ user, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

### 2.2. React Query + Zustand (Önerilen)

```tsx
// Zustand: UI state (modal açık/kapalı, tema, seçili öğe)
const useUIStore = create((set) => ({
  isModalOpen: false,
  selectedItemId: null,
  toggleModal: () => set((s) => ({ isModalOpen: !s.isModalOpen })),
}));

// React Query: Server state (kullanıcı listesi, ürünler)
function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: fetchUsers });
}
```

**Kural:** Zustand = UI state. React Query / SWR = Server state. İkisini karıştırMA.

## 3. STATE YAPISI TASARIMI

### 3.1. Normalize State (flat)

```ts
// KÖTÜ: Nested state
const useStore = create({
  posts: [
    {
      id: '1',
      title: '...',
      comments: [{ id: 'c1', text: '...' }, { id: 'c2', text: '...' }],
    },
  ],
});

// İYİ: Normalize (flat)
const useStore = create({
  posts: {
    '1': { id: '1', title: '...', commentIds: ['c1', 'c2'] },
  },
  comments: {
    'c1': { id: 'c1', text: '...' },
    'c2': { id: 'c2', text: '...' },
  },
});
```

Normalize state güncellemeyi kolaylaştırır ve selector performansını artırır.

### 3.2. Action vs Set Kararı

```ts
// DOĞRU: Action encapsulation
const removeUser = (id) => set((state) => ({
  users: state.users.filter(u => u.id !== id),
}));

// YANLIŞ: Component'ten direkt set
store.setState({ users: store.getState().users.filter(...) });
```

Action'lar her zaman store içinde tanımlanır. Component'ten `setState` çağırMA.

## 4. MIDDLEWARE BEST PRACTICES

### 4.1. Persist: Hassas Veri Kontrolü

```ts
persist(
  (set) => ({ /* ... */ }),
  {
    name: 'app-storage',
    partialize: (state) => ({
      theme: state.theme,
      sidebarCollapsed: state.sidebarCollapsed,
      onboardingCompleted: state.onboardingCompleted,
      // ASLA: token, password, creditCard, personalData
    }),
  }
);
```

### 4.2. Immer Middleware (Karmaşık State)

```bash
npm install immer
```

```ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const useStore = create(
  immer((set) => ({
    nested: { deep: { value: 0 } },
    incrementDeep: () =>
      set((state) => {
        state.nested.deep.value += 1; // Mutable gibi yaz, immutable çalışır
      }),
  }))
);
```

## 5. TEST EDİLEBİLİRLİK

```ts
// Store'u sıfırlamak için:
afterEach(() => {
  useStore.setState(useStore.getInitialState());
});
```

Her testten sonra store'u sıfırla. `getInitialState()` v5.0+ ile geldi.

## 6. YAPILMAMASI GEREKENLER

- **`get()` ile state okuyup `set()` ile güncellerken race condition** — `set((state) => ...)` callback formunu kullan
- **useEffect içinde store subscription** — Gereksiz, zaten reactive
- **Store içinde side effect (DOM manipülasyonu)** — Store pure kalmalı
- **50KB'dan büyük persist state** — localStorage limiti ~5MB, ama 50KB üstü parse/stringify yavaşlar
- **Her state için ayrı store** — Single source of truth'u kaybedersin
