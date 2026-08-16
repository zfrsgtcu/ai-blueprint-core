<!--
  BU DOSYANIN AMACI:
  AI ajanlarına React 18 + Vite (TypeScript) ile SPA projesi geliştirirken uyması gereken best practice kurallarını öğretir.
  Functional components + hooks, Zustand state, React Router 6, Axios, TailwindCSS,
  Vite HMR, lazy loading ve Vercel deployment kurallarını kapsar.
-->

# REACT 18 + VITE (TYPESCRIPT) — BEST PRACTICE RULES

## 1. GENEL PRENSİPLER

React 18'in temel felsefesi: **Functional components + hooks ile declarative, composable UI.**

1. 🔴 **ZORUNLU:** Functional components + hooks kullan — class component yazma.
2. 🔴 **ZORUNLU:** TypeScript strict mode — `tsconfig.json`'da `"strict": true`.
3. 🔴 **ZORUNLU:** Her component tek sorumluluk — tek bir şey render et, tek bir şey yönet.
4. 🔴 **ZORUNLU:** Props için interface/type tanımla — `React.FC` yerine named function + props type.

## 2. PROJE YAPISI KURALLARI

```
src/
├── main.tsx                  # ReactDOM.createRoot + providers
├── App.tsx                   # <RouterProvider router={router} />
├── router/
│   └── index.tsx             # createBrowserRouter + route tanımları
├── pages/
│   ├── HomePage.tsx
│   ├── {{ModelName}}ListPage.tsx
│   └── {{ModelName}}DetailPage.tsx
├── components/
│   ├── Layout.tsx
│   └── {{ModelName}}Card.tsx
├── stores/
│   └── {{modelName}}.store.ts  # Zustand store
├── services/
│   └── api.ts                # Axios instance + interceptors
└── types/
    └── {{modelName}}.types.ts
```

1. 🔴 **ZORUNLU:** Bu dizin yapısına sadık kal.
2. 🔴 **ZORUNLU:** `pages/` → route'a bağlanan sayfalar, `components/` → yeniden kullanılabilir.
3. 🟡 **ÖNERİLEN:** Her domain entity'si için ayrı page, store, types dosyası.

## 3. FUNCTIONAL COMPONENTS + HOOKS KURALLARI

```tsx
// src/pages/{{ModelName}}ListPage.tsx — STANDART YAPI
import { useState, useEffect } from 'react';
import { use{{ModelName}}Store } from '@/stores/{{modelName}}.store';
import type { {{ModelName}}Dto } from '@/types/{{modelName}}.types';

export default function {{ModelName}}ListPage() {
  const { items, isLoading, error, fetchItems } = use{{ModelName}}Store();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (isLoading) return <div role="status">Yükleniyor...</div>;
  if (error) return <div role="alert">{error}</div>;
  if (items.length === 0) return <div>Henüz kayıt yok.</div>;

  return (
    <main>
      <h1>{{HumanReadableName}}</h1>
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </main>
  );
}
```

1. 🔴 **ZORUNLU:** 4 state handle et: **loading**, **error**, **empty**, **data**.
2. 🔴 **ZORUNLU:** `useEffect` dependency array eksiksiz olmalı.
3. 🔴 **ZORUNLU:** Liste render'da her zaman `key` prop'u (unique, stable ID).
4. 🟠 **YASAK:** `key={index}` kullanmak — liste sırası değişirse bug.
5. 🟠 **YASAK:** `useEffect` içinde async fonksiyon direkt çağırmak — içeride async func tanımla, sonra çağır.

## 4. REACT ROUTER KURALLARI

1. 🔴 **ZORUNLU:** `createBrowserRouter` + `<RouterProvider>` kullan (v6.4+ data router).
2. 🔴 **ZORUNLU:** Route path'leri kebab-case: `/{{model_names}}`, `/{{model_names}}/:id`.
3. 🔴 **ZORUNLU:** Lazy loading: `lazy(() => import('@/pages/...'))`.
4. 🔴 **ZORUNLU:** Layout route ile ortak layout (header, sidebar, footer).
5. 🔴 **ZORUNLU:** `errorElement` ile route seviyesinde hata yakalama.
6. 🔴 **ZORUNLU:** `useParams()` ile URL param'ları, `useNavigate()` ile programatik yönlendirme.

```tsx
// src/router/index.tsx — STANDART YAPI
import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import ErrorPage from '@/pages/ErrorPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        lazy: () => import('@/pages/HomePage'),
      },
      {
        path: '{{model_names}}',
        lazy: () => import('@/pages/{{ModelName}}ListPage'),
      },
      {
        path: '{{model_names}}/:id',
        lazy: () => import('@/pages/{{ModelName}}DetailPage'),
      },
    ],
  },
]);
```

## 5. ZUSTAND STATE MANAGEMENT KURALLARI

1. 🔴 **ZORUNLU:** Zustand `create()` ile store tanımı — her domain entity'si için ayrı store.
2. 🔴 **ZORUNLU:** Store'da state, actions (async), computed değerler.
3. 🔴 **ZORUNLU:** loading/error state'leri store içinde yönet.
4. 🟡 **ÖNERİLEN:** Selector ile sadece ihtiyacın olan state'i al (re-render optimize).

```typescript
// src/stores/{{modelName}}.store.ts — STANDART YAPI
import { create } from 'zustand';
import { api } from '@/services/api';
import type { {{ModelName}}Dto, Create{{ModelName}}Dto, Update{{ModelName}}Dto } from '@/types/{{modelName}}.types';

interface {{ModelName}}State {
  items: {{ModelName}}Dto[];
  selectedItem: {{ModelName}}Dto | null;
  isLoading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  create: (dto: Create{{ModelName}}Dto) => Promise<{{ModelName}}Dto>;
  update: (id: string, dto: Update{{ModelName}}Dto) => Promise<{{ModelName}}Dto>;
  remove: (id: string) => Promise<void>;
  clearError: () => void;
}

export const use{{ModelName}}Store = create<{{ModelName}}State>((set) => ({
  items: [],
  selectedItem: null,
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<{{ModelName}}Dto[]>('/api/{{model_names}}');
      set({ items: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
    }
  },

  fetchById: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<{{ModelName}}Dto>(`/api/{{model_names}}/${id}`);
      set({ selectedItem: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  create: async (dto) => {
    const { data } = await api.post<{{ModelName}}Dto>('/api/{{model_names}}', dto);
    set((s) => ({ items: [...s.items, data] }));
    return data;
  },

  update: async (id, dto) => {
    const { data } = await api.put<{{ModelName}}Dto>(`/api/{{model_names}}/${id}`, dto);
    set((s) => ({ items: s.items.map((i) => (i.id === id ? data : i)), selectedItem: data }));
    return data;
  },

  remove: async (id) => {
    await api.delete(`/api/{{model_names}}/${id}`);
    set((s) => ({ items: s.items.filter((i) => i.id !== id), selectedItem: s.selectedItem?.id === id ? null : s.selectedItem }));
  },

  clearError: () => set({ error: null }),
}));
```

## 6. HTTP CLIENT KURALLARI (Axios)

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

1. 🔴 **ZORUNLU:** Axios instance (`services/api.ts`) — tüm istekler bu instance üzerinden.
2. 🔴 **ZORUNLU:** Request interceptor: JWT token ekle, response interceptor: 401 handling.
3. 🔴 **ZORUNLU:** `VITE_API_BASE_URL` environment variable'ı ile API URL.
4. 🟠 **YASAK:** Her component'te `fetch()` veya direkt `axios` kullanmak.

## 7. STYLING KURALLARI (TailwindCSS)

1. 🔴 **ZORUNLU:** TailwindCSS utility-first — `className` ile stil.
2. 🔴 **ZORUNLU:** `tailwind.config.js` content paths: `["./index.html", "./src/**/*.{ts,tsx}"]`.
3. 🟡 **ÖNERİLEN:** Sık kullanılan class kombinasyonlarını `@apply` ile base layer'da birleştir.
4. 🟠 **YASAK:** Inline `style={{}}` kullanmak — her zaman Tailwind class veya CSS module.

## 8. PERFORMANS KURALLARI

1. 🔴 **ZORUNLU:** Route lazy loading — tüm route'lar `lazy(() => import(...))`.
2. 🔴 **ZORUNLU:** `React.memo()` ile gereksiz re-render'ları önle (pure component).
3. 🔴 **ZORUNLU:** `useMemo()` ile pahalı hesaplamaları memoize et, `useCallback()` ile referans kararlılığı.
4. 🟡 **ÖNERİLEN:** Büyük listelerde `useVirtualizer` (TanStack Virtual) ile virtual scroll.
5. 🟡 **ÖNERİLEN:** `<Suspense>` + `lazy()` ile code splitting, loading fallback.

## 9. DEPLOYMENT KURALLARI (Vercel)

1. 🔴 **ZORUNLU:** `vite build` ile production build. Output: `dist/`.
2. 🔴 **ZORUNLU:** `vercel.json` ile SPA rewrite: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`.
3. 🔴 **ZORUNLU:** Environment variables Vercel dashboard'da (`VITE_` prefix ile).

## 10. YAYGIN HATALAR (AI'NIN KAÇINMASI GEREKENLER)

1. ❌ **Class component kullanmak** — functional + hooks standart.
2. ❌ **`useEffect`'te async fonksiyon direkt çağırmak** — içeride tanımla, sonra çağır.
3. ❌ **Liste render'da `key` eksik veya `index` kullanmak** — always stable unique ID.
4. ❌ **`useState` yerine `useRef` kullanılabilecek yerde state** — re-render gerekmiyorsa ref.
5. ❌ **Store'da `set` içinde `get()` kullanmamak** — zustand'da önceki state'e erişim `set((s) => ...)`.
6. ❌ **Props drilling** — 3+ seviye geçen props için Zustand store veya Context.
7. ❌ **Büyük bileşenler** — 150+ satır component bölünmeli.

## 11. DİZİN YAPISI KONTROL LİSTESİ

AI, oluşturduğu React projesinde şunları kontrol etmelidir:

- [ ] `vite.config.ts` mevcut — `@vitejs/plugin-react`, `@` alias tanımlı
- [ ] `src/main.tsx` mevcut — `createRoot(document.getElementById('root')!).render(<App />)`
- [ ] `src/App.tsx` mevcut — `<RouterProvider router={router} />`
- [ ] `src/router/index.tsx` mevcut — `createBrowserRouter` + layout routes
- [ ] `src/pages/` klasörü mevcut — route başına bir page
- [ ] `src/components/` klasörü mevcut — reusable component'ler + Layout
- [ ] `src/stores/` klasörü mevcut — Zustand stores
- [ ] `src/services/api.ts` mevcut — Axios instance + interceptors
- [ ] `src/types/` klasörü mevcut — TypeScript interface'leri
- [ ] `tailwind.config.js` mevcut — content paths doğru
- [ ] `postcss.config.js` mevcut
- [ ] `index.html` mevcut — `<div id="root">` mount noktası
- [ ] Tüm component'ler functional + hooks
- [ ] Tüm route'lar lazy loading
- [ ] Liste render'da her zaman stable `key`
