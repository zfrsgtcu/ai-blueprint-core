<!--
  BU DOSYANIN AMACI:
  AI ajanlarına SvelteKit 2 + Svelte 5 (TypeScript) ile web projesi geliştirirken uyması gereken best practice kurallarını öğretir.
  Svelte 5 runes ($state, $derived, $effect), SvelteKit file-based routing, Svelte stores, Axios,
  TailwindCSS, Vite HMR ve deployment kurallarını kapsar.
-->

# SVELTEKIT 2 + SVELTE 5 (TYPESCRIPT) — BEST PRACTICE RULES

## 1. GENEL PRENSİPLER

Svelte 5'in temel felsefesi: **Runes ile reaktif, kompakt ve minimal boilerplate'li component'ler. Write less, do more.**

1. 🔴 **ZORUNLU:** Svelte 5 runes syntax'i kullan — `$state`, `$derived`, `$effect`, `$props`.
2. 🔴 **ZORUNLU:** TypeScript strict mode — `tsconfig.json`'da `"strict": true`.
3. 🔴 **ZORUNLU:** Her component tek sorumluluk — tek bir şey render et, tek bir şey yönet.
4. 🔴 **ZORUNLU:** SvelteKit file-based routing — `+page.svelte`, `+layout.svelte`, `+page.server.ts` konvansiyonuna uy.

## 2. PROJE YAPISI KURALLARI

```
src/
├── app.html                     # HTML shell (%sveltekit.head%, %sveltekit.body%)
├── app.css                      # Global CSS — @tailwind directives
├── hooks.client.ts              # Client-side hooks (auth guard, error handler)
├── routes/
│   ├── +layout.svelte           # Root layout — <slot /> + Header, Sidebar, Footer
│   ├── +page.svelte             # Home page (index route)
│   ├── (app)/                   # Layout group: authenticated sayfalar
│   │   ├── +layout.svelte       # Auth layout — token kontrolü
│   │   ├── {{model_names}}/
│   │   │   ├── +page.svelte     # {{ModelName}}ListPage
│   │   │   └── [id]/
│   │   │       └── +page.svelte # {{ModelName}}DetailPage
│   │   └── dashboard/
│   │       └── +page.svelte
│   └── login/
│       └── +page.svelte
├── lib/
│   ├── components/
│   │   ├── Header.svelte
│   │   ├── Sidebar.svelte
│   │   └── {{ModelName}}Card.svelte
│   ├── stores/
│   │   └── {{modelName}}.store.ts  # Svelte writable/derived stores
│   ├── services/
│   │   └── api.ts                  # Axios instance + interceptors
│   └── types/
│       └── {{modelName}}.types.ts  # TypeScript interface'leri
static/
│   └── favicon.png
```

1. 🔴 **ZORUNLU:** Bu dizin yapısına sadık kal.
2. 🔴 **ZORUNLU:** `src/routes/` → file-based routing (klasör = path, `+page.svelte` = sayfa).
3. 🔴 **ZORUNLU:** `src/lib/` → components, stores, services, types — `$lib` alias ile import edilir.
4. 🟡 **ÖNERİLEN:** Her domain entity'si için ayrı route klasörü, store, types dosyası.

## 3. SVELTE 5 RUNES KURALLARI

```svelte
<script lang="ts">
  import type { {{ModelName}}Dto } from '$lib/types/{{modelName}}.types';
  import { {{modelName}}Store } from '$lib/stores/{{modelName}}.store';

  // $state — reactive değişken (eski let count = 0):
  let items = $state<{{ModelName}}Dto[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let searchTerm = $state('');

  // $derived — computed değer (eski $: filtered = ...):
  let filteredItems = $derived(
    items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // $derived.by — complex computed:
  let stats = $derived.by(() => {
    const total = items.length;
    const active = items.filter(i => i.active).length;
    return { total, active, inactive: total - active };
  });

  // $effect — side-effect (eski $: { ... }):
  $effect(() => {
    console.log('Arama terimi değişti:', searchTerm);
  });

  // $effect ile cleanup:
  $effect(() => {
    const interval = setInterval(() => refreshData(), 30000);
    return () => clearInterval(interval);
  });

  // onMount alternatifi — $effect zaten component mount'ta çalışır:
  $effect(() => {
    loadItems();
  });

  async function loadItems() {
    isLoading = true;
    error = null;
    try {
      items = await {{modelName}}Store.fetchItems();
    } catch (err: any) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }
</script>

{#if isLoading}
  <div role="status">Yükleniyor...</div>
{:else if error}
  <div role="alert" class="text-red-600">{error}</div>
{:else if items.length === 0}
  <div>Henüz kayıt yok.</div>
{:else}
  <main>
    <h1>{{HumanReadableName}}</h1>
    <ul>
      {#each filteredItems as item (item.id)}
        <li>{item.name}</li>
      {/each}
    </ul>
  </main>
{/if}
```

1. 🔴 **ZORUNLU:** 4 state handle et: **loading**, **error**, **empty**, **data**.
2. 🔴 **ZORUNLU:** `$state()` ile reactive primitive, `$derived()` ile computed, `$effect()` ile side-effect.
3. 🔴 **ZORUNLU:** `$state({ ... })` object/array için — nested property'ler de reactive olur.
4. 🔴 **ZORUNLU:** `{#each}` her zaman `(item.id)` key ile — unique, stable ID.
5. 🟠 **YASAK:** `{#each items as item, index}` key olmadan kullanmak — liste sırası değişirse bug.
6. 🟠 **YASAK:** `$:` reactive statement — Svelte 5'te `$effect()` kullan.

## 4. SVELTEKIT ROUTING KURALLARI

1. 🔴 **ZORUNLU:** File-based routing — `+page.svelte` = sayfa, `+layout.svelte` = layout.
2. 🔴 **ZORUNLU:** Route path'leri kebab-case: `{{model_names}}`, `{{model_names}}/[id]`.
3. 🔴 **ZORUNLU:** Layout groups için `(group_name)` parantezli klasör adı — URL'yi etkilemez.
4. 🔴 **ZORUNLU:** `$app/navigation`'dan `goto()` ile programatik yönlendirme.
5. 🔴 **ZORUNLU:** `$app/stores`'dan `page` store ile route bilgisine erişim.
6. 🟡 **ÖNERİLEN:** `+page.server.ts` → server-side load function (SSR modunda).
7. 🟡 **ÖNERİLEN:** `+page.ts` → client-side load function (SPA modunda da çalışır).

```svelte
<!-- src/routes/+layout.svelte — STANDART YAPI -->
<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { page } from '$app/stores';
  import { onNavigate } from '$app/navigation';

  let { children } = $props();
</script>

<div class="flex h-screen">
  <Sidebar />
  <div class="flex-1 flex flex-col">
    <Header />
    <main class="flex-1 overflow-auto p-6">
      {#if $page.error}
        <div role="alert">Bir hata oluştu</div>
      {:else}
        {@render children()}
      {/if}
    </main>
  </div>
</div>
```

```typescript
// src/routes/(app)/+layout.svelte — AUTH GUARD (script module context):
<script lang="ts" module>
  import { browser } from '$app/environment';
  import { redirect } from '@sveltejs/kit';
  import type { LayoutLoad } from './$types';

  export const load: LayoutLoad = async ({ url }) => {
    if (browser) {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw redirect(307, `/login?redirectTo=${url.pathname}`);
      }
    }
    return {};
  };
</script>
```

```svelte
<!-- src/routes/{{model_names}}/+page.svelte — LIST PAGE -->
<script lang="ts">
  import type { {{ModelName}}Dto } from '$lib/types/{{modelName}}.types';
  import { {{modelName}}Services } from '$lib/services/{{modelName}}.services';
  import {{ModelName}}Card from '$lib/components/{{ModelName}}Card.svelte';
  import { goto } from '$app/navigation';

  let items = $state<{{ModelName}}Dto[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  $effect(() => {
    {{modelName}}Services.fetchAll()
      .then(data => items = data)
      .catch(err => error = err.message)
      .finally(() => isLoading = false);
  });
</script>

<main>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">{{HumanReadableName}}</h1>
    <button
      onclick={() => goto('/{{model_names}}/new')}
      class="bg-blue-600 text-white px-4 py-2 rounded"
    >
      Yeni Ekle
    </button>
  </div>

  {#if isLoading}
    <div role="status">Yükleniyor...</div>
  {:else if error}
    <div role="alert" class="text-red-600">{error}</div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each items as item (item.id)}
        <{{ModelName}}Card {item} />
      {/each}
    </div>
  {/if}
</main>
```

## 5. SVELTE STORES KURALLARI (Shared State)

1. 🔴 **ZORUNLU:** `writable()` ile mutable shared state, `derived()` ile computed.
2. 🔴 **ZORUNLU:** Her domain entity'si için ayrı store dosyası.
3. 🔴 **ZORUNLU:** Component'te `$storeName` auto-subscribe — `.subscribe()` manuel çağırma.
4. 🟡 **ÖNERİLEN:** Store'da loading/error state'leri yönet.

```typescript
// src/lib/stores/{{modelName}}.store.ts — STANDART YAPI
import { writable, derived } from 'svelte/store';
import { api } from '$lib/services/api';
import type { {{ModelName}}Dto, Create{{ModelName}}Dto, Update{{ModelName}}Dto } from '$lib/types/{{modelName}}.types';

interface {{ModelName}}StoreState {
  items: {{ModelName}}Dto[];
  selectedItem: {{ModelName}}Dto | null;
  isLoading: boolean;
  error: string | null;
}

function create{{ModelName}}Store() {
  const state = writable<{{ModelName}}StoreState>({
    items: [],
    selectedItem: null,
    isLoading: false,
    error: null,
  });

  // Derived stores:
  const items = derived(state, $s => $s.items);
  const selectedItem = derived(state, $s => $s.selectedItem);
  const isLoading = derived(state, $s => $s.isLoading);
  const error = derived(state, $s => $s.error);

  async function fetchItems() {
    state.update(s => ({ ...s, isLoading: true, error: null }));
    try {
      const { data } = await api.get<{{ModelName}}Dto[]>('/api/{{model_names}}');
      state.update(s => ({ ...s, items: data, isLoading: false }));
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      state.update(s => ({ ...s, error: msg, isLoading: false }));
      throw err;
    }
  }

  async function fetchById(id: string) {
    state.update(s => ({ ...s, isLoading: true }));
    try {
      const { data } = await api.get<{{ModelName}}Dto>(`/api/{{model_names}}/${id}`);
      state.update(s => ({ ...s, selectedItem: data, isLoading: false }));
      return data;
    } catch (err: any) {
      state.update(s => ({ ...s, error: err.message, isLoading: false }));
      throw err;
    }
  }

  async function create(dto: Create{{ModelName}}Dto) {
    const { data } = await api.post<{{ModelName}}Dto>('/api/{{model_names}}', dto);
    state.update(s => ({ ...s, items: [...s.items, data] }));
    return data;
  }

  async function update(id: string, dto: Update{{ModelName}}Dto) {
    const { data } = await api.put<{{ModelName}}Dto>(`/api/{{model_names}}/${id}`, dto);
    state.update(s => ({
      ...s,
      items: s.items.map(i => (i.id === id ? data : i)),
      selectedItem: data,
    }));
    return data;
  }

  async function remove(id: string) {
    await api.delete(`/api/{{model_names}}/${id}`);
    state.update(s => ({
      ...s,
      items: s.items.filter(i => i.id !== id),
      selectedItem: s.selectedItem?.id === id ? null : s.selectedItem,
    }));
  }

  function clearError() {
    state.update(s => ({ ...s, error: null }));
  }

  return {
    items,
    selectedItem,
    isLoading,
    error,
    fetchItems,
    fetchById,
    create,
    update,
    remove,
    clearError,
  };
}

export const {{modelName}}Store = create{{ModelName}}Store();
```

```svelte
<!-- Component'te store kullanımı — $prefix auto-subscribe: -->
<script lang="ts">
  import { {{modelName}}Store } from '$lib/stores/{{modelName}}.store';

  // $storeName = auto-subscribe (reactive):
  $effect(() => {
    {{modelName}}Store.fetchItems();
  });
</script>

{#if ${{modelName}}Store.isLoading}
  <div>Yükleniyor...</div>
{:else}
  {#each ${{modelName}}Store.items as item (item.id)}
    <div>{item.name}</div>
  {/each}
{/if}
```

1. 🔴 **ZORUNLU:** Component dışında store'dan değer okumak için `get(store)` kullan.
2. 🟠 **YASAK:** Component'te `.subscribe()` manuel çağırmak — `$storeName` kullan.
3. 🟠 **YASAK:** `$storeName = value` ile atama — sadece `.set()` veya `.update()`.

## 6. HTTP CLIENT KURALLARI (Axios)

```typescript
// src/lib/services/api.ts
import axios from 'axios';
import { browser } from '$app/environment';

const api = axios.create({
  baseURL: '{{API_BASE_URL}}',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (browser) {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && browser) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export { api };
```

1. 🔴 **ZORUNLU:** Axios instance (`lib/services/api.ts`) — tüm istekler bu instance üzerinden.
2. 🔴 **ZORUNLU:** `browser` check — `localStorage` sadece client-side'da mevcut.
3. 🔴 **ZORUNLU:** Request interceptor: JWT token ekle, response interceptor: 401 handling.
4. 🔴 **ZORUNLU:** `{{API_BASE_URL}}` veya `import.meta.env.VITE_API_BASE_URL` ile API URL.
5. 🟠 **YASAK:** Her component'te `fetch()` veya direkt `axios` kullanmak.

## 7. STYLING KURALLARI (TailwindCSS)

1. 🔴 **ZORUNLU:** TailwindCSS utility-first — `class=""` ile stil.
2. 🔴 **ZORUNLU:** `tailwind.config.js` content paths: `["./src/**/*.{html,svelte,ts,js}"]`.
3. 🟡 **ÖNERİLEN:** Svelte `<style>` bloğunu sadece Tailwind'in yetmediği durumlarda kullan.
4. 🟡 **ÖNERİLEN:** Component `<style>` scopeları otomatik — Svelte CSS scoping default.
5. 🟠 **YASAK:** Inline `style=""` kullanmak — her zaman Tailwind class veya scoped `<style>`.

```css
/* src/app.css — Tailwind directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900 antialiased;
  }
}
```

## 8. PERFORMANS KURALLARI

1. 🔴 **ZORUNLU:** SvelteKit route bazlı code splitting — her +page.svelte otomatik chunk.
2. 🔴 **ZORUNLU:** `{#each}` her zaman `(item.id)` key ile.
3. 🔴 **ZORUNLU:** `$derived()` ile memoization — aynı girdiyle tekrar hesaplama yapma.
4. 🟡 **ÖNERİLEN:** `{#key expression}` bloğu ile controlled re-render.
5. 🟡 **ÖNERİLEN:** Büyük listelerde `{#each}` + `{@render}` snippet ile virtual scroll pattern.
6. 🟡 **ÖNERİLEN:** `$effect()` içinde ağır işlem yapma — `$effect.pre` ile DOM öncesi hesaplamalar.

## 9. DEPLOYMENT KURALLARI

1. 🔴 **ZORUNLU:** SPA modu için `@sveltejs/adapter-static`:
   - `src/routes/+layout.ts`: `export const ssr = false; export const prerender = false;`
   - `svelte.config.js`'de `adapter: adapter({ fallback: 'index.html' })`
2. 🔴 **ZORUNLU:** SSR modu için `@sveltejs/adapter-auto` veya `@sveltejs/adapter-vercel`.
3. 🔴 **ZORUNLU:** `vite build` ile production build. Output: `build/`.
4. 🔴 **ZORUNLU:** Environment variables — `VITE_` prefix'i ile client-side erişilebilir.

```javascript
// svelte.config.js — SPA modu:
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true,
    }),
    alias: {
      $lib: 'src/lib',
      $stores: 'src/lib/stores',
      $types: 'src/lib/types',
    },
  },
};

export default config;
```

## 10. KOŞULLU SSR/SPA YAPILANDIRMASI

```typescript
// src/routes/+layout.ts — SPA modu (TÜM sayfalar client-side):
export const ssr = false;
export const prerender = false;

// VEYA sayfa bazında:
// src/routes/about/+page.ts
export const ssr = false; // Sadece bu sayfa SPA

// src/routes/blog/+page.server.ts
export const prerender = 'auto'; // Statik prerender (mümkünse)
```

## 11. YAYGIN HATALAR (AI'NIN KAÇINMASI GEREKENLER)

1. ❌ **Svelte 4 reactive syntax kullanmak (`$:`, `export let`)** — Svelte 5 runes (`$state`, `$props`) kullan.
2. ❌ **`localStorage`'a SSR context'te erişmek** — `import { browser } from '$app/environment'` kontrolü zorunlu.
3. ❌ **`{#each}` key vermeden kullanmak** — `{#each items as item (item.id)}` formatını kullan.
4. ❌ **Store subscribe memory leak** — `$storeName` auto-subscribe kullan, `.subscribe()` ve `unsubscribe` yapma.
5. ❌ **`onMount` lifecycle — Svelte 5'te `$effect()`** — cleanup için return fonksiyon döndür.
6. ❌ **`goto()` yerine `window.location.href`** — SvelteKit client-side navigation'ı kırılır.
7. ❌ **Tek component dosyasında 300+ satır** — component'leri böl.
8. ❌ **Kitapçıktaki gibi `on:click` event** — Svelte 5'te `onclick` kullan.
9. ❌ **`$:` yerine `$derived`/`$effect` kullanmamak** — yeni best practice.

## 12. DİZİN YAPISI KONTROL LİSTESİ

AI, oluşturduğu SvelteKit projesinde şunları kontrol etmelidir:

- [ ] `svelte.config.js` mevcut — adapter-static (SPA), alias tanımlı
- [ ] `vite.config.ts` mevcut — `@sveltejs/vite-plugin-svelte` tanımlı
- [ ] `src/app.html` mevcut — `%sveltekit.head%` ve `%sveltekit.body%` placeholder'ları
- [ ] `src/app.css` mevcut — `@tailwind` directives
- [ ] `src/routes/+layout.svelte` mevcut — `<slot />` veya `{@render children()}` içeriyor
- [ ] `src/routes/+page.svelte` mevcut — home page
- [ ] `src/routes/+layout.ts` mevcut (SPA modu) — `export const ssr = false`
- [ ] `src/lib/components/` klasörü mevcut — reusable Svelte component'ler
- [ ] `src/lib/stores/` klasörü mevcut — Svelte writable/derived stores
- [ ] `src/lib/services/api.ts` mevcut — Axios instance + interceptors
- [ ] `src/lib/types/` klasörü mevcut — TypeScript interface'leri
- [ ] `tailwind.config.js` mevcut — content paths doğru
- [ ] `postcss.config.js` mevcut — `tailwindcss` + `autoprefixer` plugin'leri
- [ ] Tüm component'ler Svelte 5 runes kullanıyor (`$state`, `$derived`, `$effect`, `$props`)
- [ ] `localStorage` erişimleri `browser` check'li
- [ ] `{#each}` her zaman `(item.id)` key ile
- [ ] Store'lar `$storeName` auto-subscribe ile kullanılıyor
