<!--
  BU DOSYANIN AMACI:
  AI ajanlarına framework'süz HTML5 + CSS3 + Vanilla JS ile statik web sitesi geliştirirken uyması gereken
  best practice kurallarını öğretir. Semantik HTML5 elementleri, WAI-ARIA erişilebilirlik (WCAG 2.1 AA),
  responsive mobile-first CSS (Grid, Flexbox, Custom Properties), Vanilla JS ES6+ (Web Components,
  modüler yapı, hash-based SPA routing), performans ve SEO kurallarını kapsar.
-->

# HTML5 + CSS3 + VANILLA JS — BEST PRACTICE RULES

## 1. GENEL PRENSİPLER

Saf HTML5 + CSS3 + Vanilla JS'in temel felsefesi: **Framework'süz, her ortamda çalışan, erişilebilir, semantik ve hızlı web.**

1. 🔴 **ZORUNLU:** Semantik HTML5 elementleri kullan — içerik hiyerarşisi anlamlı olsun.
2. 🔴 **ZORUNLU:** WAI-ARIA 1.2 — tüm interaktif elementler erişilebilir olmalı.
3. 🔴 **ZORUNLU:** Mobile-first responsive tasarım — min-width media query'ler.
4. 🔴 **ZORUNLU:** Progressive enhancement — temel içerik JS olmadan da erişilebilir olmalı.
5. 🔴 **ZORUNLU:** CSS Custom Properties ile design tokens (renk, spacing, typography).

## 2. SEMANTİK HTML5 KURALLARI

### 2.1. Doğru Element Seçimi

| Element | Kullanım Alanı | Ne Zaman KULLANILMAZ |
|---------|---------------|---------------------|
| `<header>` | Sayfa veya section başlığı, logo, navigasyon | Sadece stil wrapper olarak |
| `<nav>` | Ana navigasyon, breadcrumb, sayfa içi linkler | Footer'daki sosyal medya linkleri |
| `<main>` | Sayfanın ana içeriği (sayfa başına 1 tane) | Sidebar, footer |
| `<section>` | Tematik içerik gruplama (her zaman başlıkla) | Sadece stil wrapper |
| `<article>` | Bağımsız, tek başına anlamlı içerik (blog post, yorum) | Sidebar widget'ı |
| `<aside>` | Ana içerikle dolaylı ilgili içerik (sidebar, callout) | Ana makale gövdesi |
| `<footer>` | Sayfa/section footer'ı (copyright, iletişim, linkler) | Sayfa ortasında |
| `<figure>` + `<figcaption>` | Resim, diyagram, kod bloğu + açıklaması | Dekoratif resimler |
| `<details>` + `<summary>` | Genişletilebilir/gizlenebilir içerik | Her toggle için (accordion) |
| `<time>` | Tarih/saat bilgisi (datetime attribute ile) | Sadece text olarak tarih |
| `<address>` | İletişim bilgisi (fiziksel adres, email, telefon) | Rastgele adres metinleri |
| `<dl>`, `<dt>`, `<dd>` | Anahtar-değer çiftleri (metadata, FAQ, glossary) | Sıradan liste |

### 2.2. Başlık Hiyerarşisi

1. 🔴 **ZORUNLU:** Sayfa başına 1 tane `<h1>` (ana konu).
2. 🔴 **ZORUNLU:** Başlık seviyeleri atlanmamalı: h1 → h2 → h3 (h1'den h3'e atlama).
3. 🔴 **ZORUNLU:** Başlıklar içerik yapısını yansıtmalı — stil için değil anlam için.

### 2.3. Form Semantiği

```html
<!-- DOĞRU: Semantik form -->
<form aria-labelledby="form-title" novalidate>
  <h2 id="form-title">Yeni {{ModelName}} Ekle</h2>

  <div>
    <label for="name">Ad</label>
    <input
      type="text"
      id="name"
      name="name"
      required
      aria-required="true"
      aria-describedby="name-hint name-error"
      minlength="2"
      maxlength="100"
    />
    <small id="name-hint">En az 2 karakter olmalıdır.</small>
    <span id="name-error" role="alert" aria-live="polite" class="error"></span>
  </div>

  <button type="submit" aria-label="Yeni {{ModelName}} kaydet">
    Kaydet
  </button>
</form>
```

1. 🔴 **ZORUNLU:** Her `<input>` / `<select>` / `<textarea>` için `<label>` (for + id eşleşmesi).
2. 🔴 **ZORUNLU:** `required`, `aria-required`, `aria-describedby` (hint + error).
3. 🔴 **ZORUNLU:** Hata mesajları `role="alert"` + `aria-live="polite"` ile canlı duyuru.
4. 🔴 **ZORUNLU:** `<fieldset>` + `<legend>` ile ilgili form alanlarını grupla.
5. 🟡 **ÖNERİLEN:** `autocomplete` attribute'ü ile tarayıcı otomatik doldurma.

## 3. WAI-ARIA ERİŞİLEBİLİRLİK KURALLARI

### 3.1. Landmark Rolleri

```html
<body>
  <a href="#main-content" class="skip-link">Ana içeriğe atla</a>

  <header role="banner">
    <nav role="navigation" aria-label="Ana menü">
      <ul>
        <li><a href="/" aria-current="page">Ana Sayfa</a></li>
        <li><a href="/{{model_names}}">{{HumanReadableName}}</a></li>
      </ul>
    </nav>
  </header>

  <main id="main-content" role="main" tabindex="-1">
    <!-- Ana içerik -->
  </main>

  <footer role="contentinfo">
    <p>&copy; 2026 {{ProjectName}}</p>
  </footer>
</body>
```

1. 🔴 **ZORUNLU:** Skip-to-content link (ilk element, `href="#main-content"`).
2. 🔴 **ZORUNLU:** `<header role="banner">`, `<nav role="navigation" aria-label="...">`.
3. 🔴 **ZORUNLU:** `<main id="main-content" role="main" tabindex="-1">`.
4. 🔴 **ZORUNLU:** `<footer role="contentinfo">`.
5. 🔴 **ZORUNLU:** Birden fazla `<nav>` varsa her birine `aria-label` ile isim ver.
6. 🔴 **ZORUNLU:** Aktif sayfa link'ine `aria-current="page"`.

### 3.2. İnteraktif Element ARIA Kuralları

| Element / Pattern | Gerekli ARIA |
|------------------|-------------|
| Buton (toggle) | `aria-pressed="true/false"` |
| Buton (expand) | `aria-expanded="true/false"`, `aria-controls="panel-id"` |
| Accordion panel | `role="region"`, `aria-labelledby="trigger-id"`, `hidden` |
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby="title-id"`, focus trap |
| Tab list | `role="tablist"`, `role="tab"` + `aria-selected` + `aria-controls`, `role="tabpanel"` + `aria-labelledby` |
| Alert / Toast | `role="alert"`, `aria-live="assertive"` |
| Status mesajı | `aria-live="polite"`, `aria-atomic="true"` |
| Loading spinner | `role="status"`, `aria-label="Yükleniyor..."` |
| Progress bar | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` |
| SVG icon (dekoratif) | `aria-hidden="true"`, `focusable="false"` |
| SVG icon (anlamlı) | `role="img"`, `aria-label="açıklama"` |

### 3.3. Görseller

1. 🔴 **ZORUNLU:** Her `<img>` için `alt` attribute'ü — bilgi içeren resimlere açıklama, dekoratif resimlere `alt=""`.
2. 🔴 **ZORUNLU:** SVG icon'lar: dekoratifse `aria-hidden="true" focusable="false"`, anlamlıysa `role="img" aria-label="..."`.
3. 🟡 **ÖNERİLEN:** `<figure>` + `<figcaption>` ile açıklamalı görseller.
4. 🟡 **ÖNERİLEN:** `loading="lazy"` ile lazy loading, `srcset` + `sizes` ile responsive.

### 3.4. Renk ve Kontrast

1. 🔴 **ZORUNLU:** Metin kontrast oranı en az **4.5:1** (normal metin), **3:1** (büyük metin ≥ 18px bold / ≥ 24px).
2. 🔴 **ZORUNLU:** Bilgi iletmek için **sadece renk** kullanma — ikon, alt çizgi, kalınlık ile destekle.
3. 🔴 **ZORUNLU:** `:focus-visible` ile klavye odak göstergesi — `outline: none` tek başına YASAK.
4. 🟡 **ÖNERİLEN:** Sistem renk temasına saygı: `prefers-color-scheme`, `prefers-reduced-motion`.

## 4. RESPONSIVE MOBİLE-FİRST CSS KURALLARI

### 4.1. Custom Properties (Design Tokens)

```css
:root {
  /* Renk paleti */
  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-primary-light: #DBEAFE;
  --color-background: #F9FAFB;
  --color-surface: #FFFFFF;
  --color-text: #111827;
  --color-text-secondary: #6B7280;
  --color-border: #E5E7EB;
  --color-error: #DC2626;
  --color-success: #16A34A;

  /* Tipografi */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'Fira Code', 'Cascadia Code', monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;

  /* Spacing (4px tabanlı) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Container max-width */
  --container-max: 1200px;
}
```

1. 🔴 **ZORUNLU:** Tüm renk, spacing, tipografi Custom Properties ile `:root`'da tanımlanmalı.
2. 🔴 **ZORUNLU:** Spacing 4px tabanlı scale (0.25rem = 4px).
3. 🟡 **ÖNERİLEN:** Dark mode için `[data-theme="dark"]` veya `prefers-color-scheme` override.

### 4.2. Grid ve Flexbox

1. 🔴 **ZORUNLU:** Sayfa layout'u CSS Grid: `grid-template-areas` veya `grid-template-columns`.
2. 🔴 **ZORUNLU:** Bileşen içi hizalama Flexbox: tek boyutlu (satır veya sütun).
3. 🔴 **ZORUNLU:** `gap` property'si ile spacing (margin değil).
4. 🟡 **ÖNERİLEN:** `clamp()` ile akışkan tipografi ve spacing.
5. 🟠 **YASAK:** Layout için float veya inline-block kullanmak.

### 4.3. Mobile-First Breakpoint'ler

```css
/* Mobil varsayılan (min-width yok) */
.card {
  padding: var(--space-4);
  border-radius: var(--radius-md);
}

/* Tablet (640px+) */
@media (min-width: 640px) {
  .card {
    padding: var(--space-6);
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

1. 🔴 **ZORUNLU:** `min-width` media query — `max-width` değil.
2. 🔴 **ZORUNLU:** Breakpoint'ler: 640px (sm), 768px (md), 1024px (lg), 1280px (xl).
3. 🟡 **ÖNERİLEN:** Container queries (`@container`) modern tarayıcılar için.

## 5. VANILLA JAVASCRIPT KURALLARI (ES6+)

### 5.1. Modül Yapısı

1. 🔴 **ZORUNLU:** ES6 Modules: `<script type="module" src="js/main.js">`.
2. 🔴 **ZORUNLU:** Her dosya tek sorumluluk — `api.js`, `router.js`, `utils.js`.
3. 🟡 **ÖNERİLEN:** `.js` dosyalarında `'use strict'` (modules zaten strict).

### 5.2. API Client (fetch wrapper)

```javascript
// js/api.js
const API_BASE_URL = '{{API_BASE_URL}}';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('accessToken');
    window.location.hash = '#/login';
    throw new Error('Oturum süresi doldu.');
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  get: (url) => request(url),
  post: (url, data) => request(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url, data) => request(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url) => request(url, { method: 'DELETE' }),
};
```

1. 🔴 **ZORUNLU:** `fetch()` wrapper — tek bir yerden API çağrısı.
2. 🔴 **ZORUNLU:** Token localStorage'dan, 401'de temizle + login'e yönlendir.
3. 🟡 **ÖNERİLEN:** AbortController ile request cancellation (timeout).

### 5.3. Hash-based SPA Routing

```javascript
// js/router.js
const routes = [];

export function addRoute(pattern, handler) {
  routes.push({ pattern, handler });
}

function matchRoute(hash) {
  const path = hash.replace('#', '') || '/';

  for (const route of routes) {
    const patternParts = route.pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) continue;

    const params = {};
    let matched = true;

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        matched = false;
        break;
      }
    }

    if (matched) return { handler: route.handler, params };
  }

  return null;
}

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

async function handleRoute() {
  const match = matchRoute(window.location.hash);
  const outlet = document.getElementById('app-outlet');

  if (match) {
    outlet.innerHTML = '<div role="status">Yükleniyor...</div>';
    try {
      const html = await match.handler(match.params);
      outlet.innerHTML = html;
    } catch (err) {
      outlet.innerHTML = `<div role="alert">Hata: ${err.message}</div>`;
    }
  } else {
    outlet.innerHTML = '<div role="alert">Sayfa bulunamadı (404)</div>';
  }
}
```

1. 🔴 **ZORUNLU:** Hash-based routing (`#/path`) — sunucu konfigürasyonu gerektirmez.
2. 🔴 **ZORUNLU:** `:param` pattern'i ile dinamik route'lar.
3. 🔴 **ZORUNLU:** Loading ve error state'ler DOM'a yansıtılmalı.

### 5.4. DOM Manipülasyonu

1. 🔴 **ZORUNLU:** `document.querySelector()` / `querySelectorAll()` — jQuery benzeri kütüphane yok.
2. 🔴 **ZORUNLU:** `element.addEventListener()` — inline `onclick` YASAK.
3. 🔴 **ZORUNLU:** `innerHTML` sadece güvenli içerikte — kullanıcı girdisi için `textContent` veya `createElement`.
4. 🟡 **ÖNERİLEN:** Event delegation — üst element'e tek listener, `e.target` ile filtrele.
5. 🟠 **YASAK:** `document.write()` — sayfayı bozar, CSP ile uyumsuz.

## 6. PERFORMANS KURALLARI

1. 🔴 **ZORUNLU:** CSS `<head>`'de, JS `<body>` sonunda veya `type="module"` ile.
2. 🔴 **ZORUNLU:** Kritik CSS inline (above-the-fold), geri kalan CSS async.
3. 🟡 **ÖNERİLEN:** Font'ları `font-display: swap` ile yükle.
4. 🟡 **ÖNERİLEN:** Resimleri WebP formatında, `loading="lazy"`, `decoding="async"`.
5. 🟡 **ÖNERİLEN:** HTML, CSS, JS minify (build adımı).

## 7. SEO KURALLARI

1. 🔴 **ZORUNLU:** `<title>` her sayfada benzersiz ve açıklayıcı.
2. 🔴 **ZORUNLU:** `<meta name="description">` her sayfada.
3. 🔴 **ZORUNLU:** `<meta charset="UTF-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.
4. 🔴 **ZORUNLU:** Open Graph meta tag'leri: `og:title`, `og:description`, `og:image`, `og:url`.
5. 🔴 **ZORUNLU:** `<html lang="tr">` — doğru dil kodu.
6. 🟡 **ÖNERİLEN:** Structured data: JSON-LD (Schema.org) — breadcrumb, article, organization.
7. 🟡 **ÖNERİLEN:** Canonical URL: `<link rel="canonical" href="...">`.

## 8. ERİŞİLEBİLİRLİK KONTROL LİSTESİ (WCAG 2.1 AA)

1. 🔴 **ZORUNLU:** Skip-to-content link.
2. 🔴 **ZORUNLU:** Tüm içerik klavye ile gezilebilir (Tab, Enter, Escape, Arrow keys).
3. 🔴 **ZORUNLU:** Görünür focus göstergesi (`:focus-visible`).
4. 🔴 **ZORUNLU:** Form elemanlarında label + error + hint.
5. 🔴 **ZORUNLU:** Renk kontrastı ≥ 4.5:1.
6. 🔴 **ZORUNLU:** ARIA landmark roller (banner, navigation, main, contentinfo).
7. 🔴 **ZORUNLU:** Sayfa dil bildirimi (`lang="tr"`).
8. 🟡 **ÖNERİLEN:** `prefers-reduced-motion` ile animasyonları azalt.

## 9. YAYGIN HATALAR (AI'NIN KAÇINMASI GEREKENLER)

1. ❌ **`<div>` her şey için kullanmak** — `<div>` sadece stil wrapper'ı, içerik semantik elementlerde olmalı.
2. ❌ **Başlık seviyesi atlamak** — h1 → h3 (h2'siz) yapılmamalı.
3. ❌ **`alt` attribute'ü eksik bırakmak** — her `<img>`'de alt olmalı (dekoratifse boş).
4. ❌ **Form'da label-for eşleşmesi yapmamak** — ekran okuyucu kullanıcıları input'u tanımlayamaz.
5. ❌ **Sadece renkle bilgi iletmek** — hata/başarı durumlarını ikon + metin ile destekle.
6. ❌ **`outline: none` ile focus göstergesini kaldırmak** — klavye kullanıcıları nerede olduğunu bilemez.
7. ❌ **Modal/dialog'da focus trap yapmamak** — focus modal dışına kaçar, klavye kullanıcısı kaybolur.
8. ❌ **`max-width` media query kullanmak** — mobile-first yaklaşımda `min-width` kullan.

## 10. DİZİN YAPISI KONTROL LİSTESİ

AI, oluşturduğu HTML5 projesinde şunları kontrol etmelidir:

- [ ] `<!DOCTYPE html>` ile başlıyor
- [ ] `<html lang="tr">` dil bildirimi var
- [ ] `<head>` içinde charset, viewport, title, meta description var
- [ ] Skip-to-content link mevcut (`href="#main-content"`)
- [ ] `<header role="banner">` — logo, navigasyon
- [ ] `<nav role="navigation" aria-label="...">` — ana menü
- [ ] `<main id="main-content" role="main" tabindex="-1">` — ana içerik
- [ ] `<footer role="contentinfo">` — copyright, linkler
- [ ] Tüm `<img>`'lerde `alt` attribute'ü var
- [ ] Tüm form input'larında `<label for="id">` eşleşmesi var
- [ ] İnteraktif elementler (buton, toggle, modal) ARIA attribute'leri tam
- [ ] ARIA landmark rolleri doğru kullanılmış
- [ ] `:root` CSS Custom Properties: renk, spacing, tipografi
- [ ] CSS `min-width` media query'lerle mobile-first
- [ ] `gap` ile spacing (margin yerine)
- [ ] JS `type="module"` ile yükleniyor, inline onclick yok
- [ ] Renk kontrastı ≥ 4.5:1
- [ ] Klavye ile tüm içerik gezilebilir
- [ ] Open Graph meta tag'leri mevcut
- [ ] Canonical URL mevcut
