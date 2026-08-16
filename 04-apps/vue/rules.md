<!--
  BU DOSYANIN AMACI:
  AI ajanlarına Vue 3 + Vite (TypeScript) ile SPA projesi geliştirirken uyması gereken best practice kurallarını öğretir.
  Composition API (<script setup>), Pinia state, Vue Router 4, Vite konfigürasyonu,
  TailwindCSS, Axios HTTP client ve Vercel deployment kurallarını kapsar.
-->

# VUE 3 + VITE (TYPESCRIPT) — BEST PRACTICE RULES

## 1. GENEL PRENSİPLER

Vue 3'ün temel felsefesi: **Composition API ile reactive, modüler ve tip güvenli component'ler.**

1. 🔴 **ZORUNLU:** `script setup lang="ts"` syntax'i kullan — Options API'den kaçın.
2. 🔴 **ZORUNLU:** TypeScript strict mode — `tsconfig.json`'da `"strict": true`.
3. 🔴 **ZORUNLU:** Her component tek sorumluluk prensibine uymalı — tek bir şey yap.
4. 🔴 **ZORUNLU:** `ref()` reactive primitives, `reactive()` object/array'ler, `computed()` türetilmiş değerler için.

## 2. PROJE YAPISI KURALLARI

```
src/
├── main.ts              # createApp + pinia + router
├── App.vue              # Root: <RouterView /> + layout
├── router/
│   └── index.ts         # createRouter + route tanımları
├── views/
│   ├── HomeView.vue
│   ├── {{ModelName}}ListView.vue
│   └── {{ModelName}}DetailView.vue
├── components/
│   ├── AppHeader.vue
│   └── {{ModelName}}Card.vue
├── stores/
│   └── {{modelName}}.store.ts  # Pinia store
├── services/
│   └── api.ts           # Axios instance + interceptors
└── types/
    └── {{modelName}}.types.ts
```

1. 🔴 **ZORUNLU:** Bu dizin yapısına sadık kal.
2. 🔴 **ZORUNLU:** `views/` → route'a bağlanan sayfalar, `components/` → yeniden kullanılabilir bileşenler.
3. 🟡 **ÖNERİLEN:** Her domain entity'si için ayrı view, store, types dosyası.

## 3. COMPOSITION API KURALLARI (`<script setup>`)

```html
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { use{{ModelName}}Store } from '@/stores/{{modelName}}.store';
import type { {{ModelName}}Dto } from '@/types/{{modelName}}.types';

const store = use{{ModelName}}Store();
const isLoading = ref(true);
const error = ref<string | null>(null);

const filteredItems = computed(() =>
  store.items.filter(i => i.name.toLowerCase().includes(search.value.toLowerCase()))
);

onMounted(async () => {
  try {
    await store.fetchItems();
  } catch (err: any) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
});
</script>
```

1. 🔴 **ZORUNLU:** `ref()` ile primitive reactive state, `computed()` ile türetilmiş değerler.
2. 🔴 **ZORUNLU:** `onMounted()` içinde veri çekme (component mount olduktan sonra).
3. 🔴 **ZORUNLU:** `defineProps<T>()` ile tip güvenli props — `defineProps()` değil.
4. 🔴 **ZORUNLU:** `defineEmits<T>()` ile tip güvenli event'ler.
5. 🟠 **YASAK:** `this` kullanmak — Composition API'de `this` yoktur, her şey değişken.
6. 🟠 **YASAK:** `setup()` fonksiyonu kullanmak — `<script setup>` daha temiz.

## 4. VUE ROUTER KURALLARI

1. 🔴 **ZORUNLU:** `createRouter` + `createWebHistory` kullan.
2. 🔴 **ZORUNLU:** Route path'leri kebab-case: `/{{model_names}}`, `/{{model_names}}/:id`.
3. 🔴 **ZORUNLU:** Lazy loading: `() => import('@/views/{{ModelName}}ListView.vue')`.
4. 🔴 **ZORUNLU:** Navigation guard: `router.beforeEach` ile auth kontrolü.
5. 🟡 **ÖNERİLEN:** Meta alanı (`meta: { requiresAuth: true }`) ile route metadata.

```typescript
// src/router/index.ts — STANDART YAPI
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/{{model_names}}',
      name: '{{model_names}}',
      component: () => import('@/views/{{ModelName}}ListView.vue'),
    },
    {
      path: '/{{model_names}}/:id',
      name: '{{model_name}}-detail',
      component: () => import('@/views/{{ModelName}}DetailView.vue'),
    },
  ],
});

export default router;
```

## 5. PINIA STATE MANAGEMENT KURALLARI

1. 🔴 **ZORUNLU:** Composition API (setup) style store kullan — Options API store değil.
2. 🔴 **ZORUNLU:** Her domain entity'si için ayrı store: `use{{ModelName}}Store`.
3. 🔴 **ZORUNLU:** Store'da state, getters (computed), actions (async fonksiyonlar) olmalı.
4. 🟡 **ÖNERİLEN:** Store içinde loading/error state'leri yönet.

```typescript
// src/stores/{{modelName}}.store.ts — STANDART YAPI
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';
import type { {{ModelName}}Dto, Create{{ModelName}}Dto, Update{{ModelName}}Dto } from '@/types/{{modelName}}.types';

export const use{{ModelName}}Store = defineStore('{{modelName}}', () => {
  const items = ref<{{ModelName}}Dto[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const itemCount = computed(() => items.value.length);

  async function fetchItems() {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await api.get<{{ModelName}}Dto[]>('/api/{{model_names}}');
      items.value = res.data;
    } catch (err: any) {
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  }

  async function create(dto: Create{{ModelName}}Dto) {
    const res = await api.post<{{ModelName}}Dto>('/api/{{model_names}}', dto);
    items.value.push(res.data);
    return res.data;
  }

  return { items, isLoading, error, itemCount, fetchItems, create };
});
```

1. 🔴 **ZORUNLU:** `defineStore(id, setupFunction)` — Composition API style.
2. 🔴 **ZORUNLU:** Store fonksiyon adı `use` ile başlamalı: `use{{ModelName}}Store`.
3. 🟡 **ÖNERİLEN:** `storeToRefs()` ile reactive referansları destruct et (reaktiviteyi kaybetmeden).

## 6. HTTP CLIENT KURALLARI (Axios)

1. 🔴 **ZORUNLU:** Axios instance (`services/api.ts`) — tüm istekler bu instance üzerinden.
2. 🔴 **ZORUNLU:** Request interceptor: JWT token ekle (localStorage'dan).
3. 🔴 **ZORUNLU:** Response interceptor: 401 → token temizle, login'e yönlendir.
4. 🔴 **ZORUNLU:** `VITE_API_BASE_URL` environment variable'ı ile API URL.

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '{{API_BASE_URL}}',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export { api };
```

## 7. STYLING KURALLARI (TailwindCSS)

1. 🔴 **ZORUNLU:** TailwindCSS utility-first yaklaşım — özel CSS sadece gerekliyse.
2. 🔴 **ZORUNLU:** `tailwind.config.js` content paths: `["./index.html", "./src/**/*.{vue,ts,js}"]`.
3. 🟡 **ÖNERİLEN:** `postcss.config.js` ile autoprefixer.
4. 🟡 **ÖNERİLEN:** Component içinde `<style scoped>` sadece Tailwind'in yetmediği durumlarda.
5. 🟠 **YASAK:** Inline style (`style=""`) kullanmak — her zaman Tailwind class veya scoped CSS.

## 8. PERFORMANS KURALLARI

1. 🔴 **ZORUNLU:** Route lazy loading — tüm route'lar `() => import(...)` ile.
2. 🔴 **ZORUNLU:** `v-for` her zaman `:key` ile.
3. 🟡 **ÖNERİLEN:** Büyük listelerde `v-memo` veya virtual scroll.
4. 🟡 **ÖNERİLEN:** `computed()` ile memoization — aynı girdiyle tekrar hesaplama yapma.
5. 🟠 **YASAK:** Template'te karmaşık ifadeler — `computed` veya method kullan.

## 9. DEPLOYMENT KURALLARI (Vercel)

1. 🔴 **ZORUNLU:** `vite build` ile production build. Output: `dist/`.
2. 🔴 **ZORUNLU:** `vercel.json` ile SPA fallback: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`.
3. 🔴 **ZORUNLU:** Environment variables Vercel dashboard'da.
4. 🟡 **ÖNERİLEN:** `VITE_` prefix'i ile client-side env değişkenleri.

## 10. YAYGIN HATALAR (AI'NIN KAÇINMASI GEREKENLER)

1. ❌ **Options API kullanmak** — Composition API + `<script setup>` standart.
2. ❌ **`ref().value`'yu template'te kullanmak** — template'te `.value` gerekmez, auto-unwrap.
3. ❌ **Reactive array'e direkt index atama** — `arr[index] = val` reaktiviteyi tetiklemez, `arr.splice(index, 1, val)` kullan.
4. ❌ **Pinia store'u `storeToRefs()` olmadan destruct etmek** — reaktivite kaybolur.
5. ❌ **Her şeyi `ref()` yapmak** — primitive'ler `ref()`, object/array `reactive()` / `ref()`.
6. ❌ **`watch` içinde ağır işlem** — `watchEffect` veya `computed` daha uygun olabilir.
7. ❌ **`v-for`'da `:key` eksik** — her zaman unique key ver.

## 11. DİZİN YAPISI KONTROL LİSTESİ

AI, oluşturduğu Vue 3 projesinde şunları kontrol etmelidir:

- [ ] `vite.config.ts` mevcut — `@vitejs/plugin-vue`, `@` alias tanımlı
- [ ] `src/main.ts` mevcut — `createApp(App).use(pinia).use(router).mount('#app')`
- [ ] `src/App.vue` mevcut — `<RouterView />` içeriyor
- [ ] `src/router/index.ts` mevcut — `createRouter` + lazy routes
- [ ] `src/views/` klasörü mevcut — route başına bir view
- [ ] `src/components/` klasörü mevcut — reusable component'ler
- [ ] `src/stores/` klasörü mevcut — Pinia composition stores
- [ ] `src/services/api.ts` mevcut — Axios instance + interceptors
- [ ] `src/types/` klasörü mevcut — TypeScript interface'leri
- [ ] `tailwind.config.js` mevcut — content paths doğru
- [ ] `postcss.config.js` mevcut — tailwindcss + autoprefixer plugin'leri
- [ ] `index.html` mevcut — `<div id="app">` mount noktası
- [ ] Tüm component'ler `<script setup lang="ts">` kullanıyor
- [ ] Tüm route'lar lazy loading (`() => import(...)`)
- [ ] `v-for` her zaman `:key` ile
