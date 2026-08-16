<!--
  BU DOSYANIN AMACI:
  Pinia state management kütüphanesinin (Vue 3 için resmi) doğru kurulumunu, store pattern'lerini ve Nuxt entegrasyonunu AI'a öğretir.
-->

# PINIA CONFIGURATION RULES

## 1. KURULUM

### 1.1. Vue 3

```bash
npm install pinia
```

```ts
// main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');
```

### 1.2. Nuxt 3

```bash
npx nuxi@latest module add pinia
```

```ts
// nuxt.config.ts — otomatik eklenir:
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
});
```

## 2. STORE TANIMLAMA

### 2.1. Options Store (Basit)

```ts
// stores/useCounterStore.ts
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
    doublePlusOne(): number {
      return this.doubleCount + 1; // `this` ile diğer getter'lara erişim
    },
  },
  actions: {
    increment() {
      this.count++;
    },
    async fetchAndSet() {
      const data = await fetch('/api/count');
      this.count = await data.json();
    },
  },
});
```

### 2.2. Setup Store (Composition API — Önerilen)

```ts
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0);
  const doubleCount = computed(() => count.value * 2);

  function increment() {
    count.value++;
  }

  return { count, doubleCount, increment };
});
```

**Setup store tercih edilir.** Watcher, diğer composable'lar ve esnek yapı sağlar.

## 3. STORE KULLANIMI

```vue
<script setup>
import { useCounterStore } from '@/stores/useCounterStore';
import { storeToRefs } from 'pinia';

const store = useCounterStore();

// Yanlış: Reaktifliği kaybeder
// const { count, doubleCount } = store;

// Doğru: storeToRefs ile reactive kalır
const { count, doubleCount } = storeToRefs(store);

// Actions doğrudan destructure edilebilir (reaktiflik gerekmez)
const { increment } = store;
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Double: {{ doubleCount }}</p>
    <button @click="increment">+1</button>
  </div>
</template>
```

**storeToRefs ZORUNLU:** Destructure ederken reaktiflik kaybolur. SADECE state ve getters için `storeToRefs` kullan.

## 4. NUXT 3 ENTEAGRASYONU

```ts
// stores/useAuthStore.ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const isAuthenticated = computed(() => !!user.value);

  async function login(credentials) {
    // Nuxt 3'te useFetch, $fetch kullanılabilir
    const { data } = await useFetch('/api/auth/login', {
      method: 'POST',
      body: credentials,
    });
    user.value = data.value;
  }

  return { user, isAuthenticated, login };
});
```

**Nuxt'ta composable'lar store içinde kullanılabilir.** `useFetch`, `useCookie`, `useRuntimeConfig` vb.

## 5. SSR İLE KULLANIM

```ts
// Nuxt'ta SSR state transferi otomatik yapılır
// Ek konfigürasyon gerekmez

// Vue 3 + SSR (vite-plugin-ssr gibi):
// Server tarafında state'i serialize etmek gerekebilir
```

## 6. YAPILMAMASI GEREKENLER

- **`storeToRefs` olmadan destructure** — Reaktiflik kaybolur
- **Options store'da arrow function getter** — `this` erişimi kaybolur
- **Store içinde `useRoute`/`useRouter`** — Store'u route'a bağımlı yapma
- **Pinia store'u global variable olarak tanımlama** — Her zaman `useXxxStore()` fonksiyonu
- **`$state` ile doğrudan state override etme** — `$patch` kullan
