<!--
  BU DOSYANIN AMACI:
  AI ajanlarına React Native + Expo SDK 51 ile cross-platform mobil uygulama geliştirirken uyması gereken best practice kurallarını öğretir.
  Expo Router, Zustand state management, API client, secure storage, offline support,
  ve EAS Build deployment kurallarını kapsar.
-->

# REACT NATIVE + EXPO SDK 51 — BEST PRACTICE RULES

## 1. GENEL PRENSİPLER

React Native + Expo, JavaScript/TypeScript ile iOS ve Android cross-platform mobil uygulama geliştirme framework'üdür. Expo managed workflow ile native build konfigürasyonu olmadan hızlı geliştirme, EAS Build ile production build. Web ve mobil aynı React ekosisteminde.

1. 🔴 **ZORUNLU:** Expo managed workflow kullan — bare workflow sadece native module gerektiğinde.
2. 🔴 **ZORUNLU:** Expo Router — file-based routing, `app/` altında.
3. 🔴 **ZORUNLU:** TypeScript kullan — strict mode.
4. 🔴 **ZORUNLU:** Component'ler functional component, hooks ile state.

## 2. EXPO ROUTER KURALLARI

1. 🔴 **ZORUNLU:** `app/_layout.tsx` — root layout, providers, global config.
2. 🔴 **ZORUNLU:** `app/(tabs)/_layout.tsx` — tab navigasyon (alt sekmeler).
3. 🔴 **ZORUNLU:** `app/index.tsx` — giriş sayfası.
4. 🟡 **ÖNERİLEN:** `app/{{model_name}}/[id].tsx` — dynamic route'lar.
5. 🟡 **ÖNERİLEN:** Stack, Modal, Tabs — hepsi Expo Router ile yönetilir.

```typescript
// app/_layout.tsx — Root Layout
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="{{model_name}}/[id]" options={{ title: 'Detay' }} />
      </Stack>
    </QueryClientProvider>
  );
}
```

## 3. API CLIENT KURALLARI

1. 🔴 **ZORUNLU:** `services/api.ts` — singleton API client, base URL `.env`'den.
2. 🔴 **ZORUNLU:** Auth token otomatik eklenmeli (request interceptor).
3. 🔴 **ZORUNLU:** 401 yanıtında otomatik logout, token yenileme.
4. 🟡 **ÖNERİLEN:** `@tanstack/react-query` ile server state ve cache yönetimi.

```typescript
// services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '{{API_BASE_URL}}';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem('accessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    if (res.status === 401) { /* logout */ }
    throw new Error(`API Error: ${res.status}`);
  }
  return res.json();
}

export const api = { get: <T>(url: string) => request<T>(url), post: <T>(url: string, data: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(data) }), put: <T>(url: string, data: unknown) => request<T>(url, { method: 'PUT', body: JSON.stringify(data) }), delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }) };
```

## 4. STATE MANAGEMENT KURALLARI

1. 🔴 **ZORUNLU:** Zustand — hafif, performanslı global state.
2. 🔴 **ZORUNLU:** Store'lar feature-based: `stores/auth.store.ts`, `stores/{{modelName}}.store.ts`.
3. 🟡 **ÖNERİLEN:** `@tanstack/react-query` — server state (fetch/cache/sync).
4. 🟡 **ÖNERİLEN:** Zustand — client state (UI state, form state).

## 5. SECURE STORAGE KURALLARI

1. 🔴 **ZORUNLU:** Hassas veri (token) `expo-secure-store`'da.
2. 🔴 **ZORUNLU:** Hassas olmayan veri `AsyncStorage`'da.
3. 🟠 **YASAK:** Token'ı `AsyncStorage`'da tutmak — güvenlik riski.
4. 🟠 **YASAK:** `.env`'de secret tutup client'a gömmek — `EXPO_PUBLIC_` prefix sadece public değişkenler için.

## 6. OFFLINE SUPPORT KURALLARI

1. 🟡 **ÖNERİLEN:** `@react-native-community/netinfo` ile bağlantı kontrolü.
2. 🟡 **ÖNERİLEN:** React Query `onlineManager` ile otomatik refetch.
3. 🟡 **ÖNERİLEN:** Kritik veri için AsyncStorage cache.

## 7. UI/UX KURALLARI

1. 🔴 **ZORUNLU:** `react-native-safe-area-context` ile safe area yönetimi.
2. 🔴 **ZORUNLU:** `Platform.OS` ile platform-specific UI farklılıklarını yönet.
3. 🟡 **ÖNERİLEN:** Pull-to-refresh, infinite scroll, loading skeleton.
4. 🟡 **ÖNERİLEN:** `react-native-reanimated` ile 60fps animasyonlar.
5. 🟠 **YASAK:** Absolute positioning ile layout — responsive değil, farklı cihazlarda bozulur.

## 8. STYLING KURALLARI

1. 🔴 **ZORUNLU:** `StyleSheet.create()` — static styles, performans.
2. 🟡 **ÖNERİLEN:** NativeWind (TailwindCSS for React Native) veya theme constants.
3. 🟡 **ÖNERİLEN:** Tema renkleri ve spacing için `theme.ts` constants.
4. 🟠 **YASAK:** Inline style object'leri render'da oluşturmak — performans sorunu.

## 9. DEPLOYMENT KURALLARI (EAS Build)

1. 🔴 **ZORUNLU:** `eas.json` ile build profilleri (development, preview, production).
2. 🔴 **ZORUNLU:** `app.json`'da `expo.ios.bundleIdentifier` ve `expo.android.package`.
3. 🔴 **ZORUNLU:** Build: `eas build --platform all --profile production`.
4. 🔴 **ZORUNLU:** Submit: `eas submit --platform ios` / `eas submit --platform android`.

## 10. YAYGIN HATALAR (AI'NIN KAÇINMASI GEREKENLER)

1. ❌ **Expo Go'da çalışmayan native module kullanmak** — managed workflow limitlerini bil.
2. ❌ **Inline style object** — her render'da yeni obje oluşur, StyleSheet kullan.
3. ❌ **Token'ı AsyncStorage'da tutmak** — `expo-secure-store` kullan.
4. ❌ **Safe area'yı yönetmemek** — notch/island/alt bar kesmesi.
5. ❌ **Platform farkını görmezden gelmek** — iOS/Android UI farklılıkları.
6. ❌ **`.env` değişkenlerini yanlış prefix'le kullanmak** — `EXPO_PUBLIC_` sadece client-safe değişkenler.
7. ❌ **Ağır resim optimizasyonu yapmamak** — `expo-image` kullan.

## 11. DİZİN YAPISI KONTROL LİSTESİ

AI, oluşturduğu React Native (Expo) projesinde şunları kontrol etmelidir:

- [ ] `app/_layout.tsx` mevcut — root layout, providers
- [ ] `app/(tabs)/_layout.tsx` mevcut — tab navigasyon
- [ ] `app/index.tsx` ana sayfa mevcut
- [ ] `app.json` mevcut — name, slug, bundleIdentifier, package, icon, splash
- [ ] `services/api.ts` mevcut — API client, token interceptor
- [ ] `stores/` klasörü mevcut — Zustand store'lar
- [ ] `components/` klasörü mevcut — reusable UI component'ler
- [ ] `hooks/` klasörü mevcut — custom hook'lar
- [ ] `types/` klasörü mevcut — TypeScript tipleri
- [ ] `package.json`'da gerekli bağımlılıklar: expo, react, react-native, expo-router
- [ ] `tsconfig.json` mevcut
- [ ] `babel.config.js` mevcut
- [ ] `eas.json` mevcut — build profilleri
- [ ] Token depolama `expo-secure-store` ile yapılıyor
- [ ] `StyleSheet.create()` kullanılıyor
