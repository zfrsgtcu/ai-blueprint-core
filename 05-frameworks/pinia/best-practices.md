<!--
  BU DOSYANIN AMACI:
  Pinia ile performanslı state yönetimi, SSR state hydration ve yaygın hatalardan kaçınma yöntemlerini AI'a öğretir.
-->

# PINIA BEST PRACTICES

## 1. PERFORMANS OPTİMİZASYONU

### 1.1. Minimum State Seçimi

```vue
<script setup>
// KÖTÜ: Tüm store'u al
const store = useUserStore();

// İYİ: Sadece ihtiyaç duyulan state
const { name, email } = storeToRefs(store);
</script>
```

Tüm store'u almak gereksiz reaktiflik zinciri oluşturur.

### 1.2. $patch ile Toplu Güncelleme

```ts
// KÖTÜ: 3 ayrı reaktif güncelleme
store.name = 'John';
store.email = 'john@example.com';
store.age = 30;

// İYİ: Tek reaktif güncelleme
store.$patch({
  name: 'John',
  email: 'john@example.com',
  age: 30,
});

// VEYA: Karmaşık mantık için fonksiyon patch
store.$patch((state) => {
  state.items.push(newItem);
  state.total = state.items.reduce((sum, i) => sum + i.price, 0);
});
```

### 1.3. Subscribe ile Side Effect

```ts
// Store değişikliklerini izleme
const unsubscribe = store.$subscribe((mutation, state) => {
  // mutation.type: 'direct' | 'patch object' | 'patch function'
  console.log(`${mutation.storeId} değişti:`, mutation.type);
});

// Component unmount'ta unsubscribe
onBeforeUnmount(() => unsubscribe());
```

## 2. SSR HYDRATION PATTERN

```ts
// Nuxt 3 SSR için state transferi:
export const useAppStore = defineStore('app', () => {
  const theme = ref('light');

  // Watch ile state değişimini cookie'ye kaydet
  watch(theme, (val) => {
    if (import.meta.client) { // Sadece client'ta
      const cookie = useCookie('theme', { maxAge: 60 * 60 * 24 * 365 });
      cookie.value = val;
    }
  });

  return { theme };
});
```

**`import.meta.client` kontrolü ZORUNLU** — server'da cookie yazılmaz.

## 3. STORE MODÜLERİZASYONU

### 3.1. Domain'e Göre Store Ayırımı

```
stores/
  useAuthStore.ts    — Kimlik doğrulama
  useCartStore.ts    — Sepet
  useUIStore.ts      — UI state (modal, sidebar)
  useProductStore.ts — Ürün verileri
```

**Her domain için ayrı store.** Tek mega-store'dan kaçın.

### 3.2. Store'lar Arası İletişim

```ts
// useCartStore içinde:
import { useAuthStore } from './useAuthStore';

export const useCartStore = defineStore('cart', () => {
  const authStore = useAuthStore();

  async function checkout() {
    if (!authStore.isAuthenticated) {
      throw new Error('Lütfen giriş yapın');
    }
    // ...
  }

  return { checkout };
});
```

Store'lar birbirini import edebilir. Circular dependency'e dikkat ET.

## 4. TYPE SCRIPT BEST PRACTICES

```ts
// Setup store'da tip çıkarımı otomatik
export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);
  // Tip otomatik çıkarılır
  return { user };
});

// Options store'da:
interface UserState {
  user: User | null;
  loading: boolean;
}
export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    loading: false,
  }),
});
```

## 5. TEST

```ts
import { setActivePinia, createPinia } from 'pinia';

describe('useCounterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('increment yapar', () => {
    const store = useCounterStore();
    store.increment();
    expect(store.count).toBe(1);
  });
});
```

## 6. YAPILMAMASI GEREKENLER

- **Store içinde direkt route.push()** — UI logic'i store'a sızdırma, action'dan boolean döndür
- **100 satırdan uzun store** — Bölünebilir mi kontrol et
- **$state = newState** direkt atama — `$patch` kullan
- **Action'da return değerini unutMA** — Component action sonucuna göre UI güncelleyebilir
- **Setup store'da `this` kullanma** — `this` sadece Options store'da çalışır
