# 🏗️ AI Blueprint Core — AI Kod Asistanları İçin Şablon Mimarisi

Bu proje, **Claude Code, Cursor, Aider** veya lokal LLM'ler (Ollama vb.) gibi yapay zeka kodlama asistanlarının token tüketimini minimize etmek ve halüsinasyon (yanlış kod üretimi) riskini azaltmak amacıyla geliştirilmiş modüler bir bağlam (context) mimarisidir.

Yapay zekaya "Bana bir e-ticaret sitesi yap" demek yerine, sistem CLI parametrelerine göre ilgili katmanları seçici biçimde tarar ve modele sadece **ihtiyacı olan spesifik kuralları, mimariyi ve veritabanı şemalarını** içeren bir master-prompt sunar.

---

## 📂 Katman Mimarisi (8 Katman)

Sistem 8 ana katmandan oluşur. Bu katmanlar, gelen CLI parametrelerine göre (`--project-type`, `--apps`, `--scope`, `--frameworks`) filtrelenerek tek bir optimize master-prompt'ta birleştirilir.

```
ai-blueprint-core/
│
├── 00-registry/          ← Versiyon ve uyumluluk otoritesi
├── 01-globals/           ← Evrensel kodlama standartları
├── 02-domains/           ← İş mantığı ve veri katmanı (25 domain)
├── 03-infrastructures/   ← Production altyapı katmanı
├── 04-apps/              ← Uygulama iskelet kütüphanesi (13 stack)
├── 05-frameworks/        ← UI framework ve kütüphane kuralları (16 framework)
├── 06-datalayer/         ← Veritabanı bağlantı ve entegrasyon katmanı
└── 07-Orders/            ← Master-prompt ve sipariş çıktıları
```

## Tavsiye Edilen Modeller
deepseek-v4-flash

**Her katmanın ortak çalışma prensibi:**
- **Manifest (.json):** "Bu katman nedir, neleri içerir?" — AI'nın giriş noktası
- **Rules / Patterns (.md):** "Ne yapılır, ne yapılmaz?" — zorunlu, yasak, önerilen ve opsiyonel kurallar
- **Templates:** Somut kod şablonları — `{{Placeholder}}` formatı

---

### `00-registry/` — Versiyon ve Bağımlılık Otoritesi

| Dosya | İşlev |
|-------|-------|
| `versions.json` | Tüm paketlerin kilitli versiyonları |
| `compatibility-matrix.json` | 50+ framework uyumluluk kuralı |

**Kural:** AI, paket versiyonlarını asla kendi başına atamaz. Tüm versiyonlar bu dosyadan okunur.

---

### `01-globals/` — Evrensel Kodlama Standartları

| Dosya | Kapsam |
|-------|--------|
| `code-style.md` | İsimlendirme, format, import sıralaması (kebab-case, PascalCase, camelCase, BEM CSS) |
| `strict-logic.md` | Immutability, early return, async/await, memory leak önleme |
| `security.md` | Hardcoded secret yasak, XSS, SQL injection, CSRF, JWT, Helmet, rate limiting |
| `performance.md` | Bundle < 200KB gzipped, code splitting, Promise.all, Web Vitals |

---

### `02-domains/` — İş Mantığı ve Veri Katmanı

Proje türüne göre değişen, kullanılan teknolojiden bağımsız iş kuralları, veritabanı şemaları ve API sözleşmeleri.

Her domain 3 dosyadan oluşur:

| Dosya | İçerik |
|-------|--------|
| `business-logic.md` | İş kuralları, workflow'lar, state machine'ler, validasyon mantığı |
| `db-schema.json` | Tablolar, sütunlar, tipler, index'ler, foreign key'ler |
| `api-contracts.json` | REST API endpoint'leri, request/response şemaları |

**25 Domain:**

| Domain | Tür | Domain | Tür |
|--------|-----|--------|-----|
| `ai-playground` | AI etkileşim platformu | `landing-page` | Tanıtım sayfası |
| `analytics-tools` | Analitik dashboard | `marketplace` | Pazar yeri |
| `blog-platform` | Blog/CMS | `micro-site` | Mikro site |
| `booking-system` | Rezervasyon sistemi | `news-portal` | Haber portalı |
| `cloud-storage` | Bulut depolama | `portfolio` | Portfolyo sitesi |
| `corporate-site` | Kurumsal web sitesi | `realestate-portal` | Emlak portalı |
| `crm-system` | Müşteri ilişkileri yönetimi | `restaurant-pos` | Restoran POS |
| `crowdfunding` | Kitle fonlaması | `saas-dashboard` | SaaS yönetim paneli |
| `crypto-dashboard` | Kripto para dashboard | `social-network` | Sosyal ağ |
| `documentation-hub` | Dokümantasyon merkezi | `ecommerce` | E-ticaret |
| `e-learning` | Online eğitim platformu | `event-management` | Etkinlik yönetimi |
| `fitness-tracker` | Fitness takip | `forum-community` | Forum/topluluk |
| `job-board` | İş ilanı platformu | | |

---

### `03-infrastructures/` — Production-Ready Altyapı Katmanı

Uygulamanın işletim ortamını tanımlar. "Blueprint-as-Code" yaklaşımıyla çalışır.

| Modül | İçerik |
|-------|--------|
| `docker/` | Container ve orchestration (Dockerfile + docker-compose şablonları, 11 production kuralı) |
| `ci-cd/` | GitHub Actions ve GitLab CI pipeline şablonları |
| `monitoring/` | Prometheus + Grafana + Loki gözlemlenebilirlik yapılandırması |
| `networking/` | Nginx, Traefik, Caddy reverse proxy yapılandırmaları |
| `secrets/` | Secret yönetimi, .env.example, güvenli yapılandırma |

**Cross-Cutting Kurallar (CC-001 — CC-007):** Tüm placeholder'lar değiştirilmeli, `:latest` tag kullanılmamalı, healthcheck zorunlu, HTTPS zorunlu, secret'lar asla kodda olmamalı, log'lar JSON stdout'a, non-root user ile container çalıştırılmalı.

---

### `04-apps/` — Referans Mimari Kütüphanesi (Application Skeletons)

AI ajanlarının kod üretirken başvurduğu referans mimari kütüphanesi.

**13 Stack:**

| Stack | Tür | Dil |
|-------|-----|-----|
| `astrojs` | Static/SSR Frontend | JS/TS |
| `nextjs` | SSR/SSG Frontend | JS/TS |
| `nuxtjs` | SSR/SSG Frontend | JS/TS (Vue 3) |
| `react` | SPA Frontend | JS/TS |
| `vue` | SPA Frontend | JS/TS |
| `svelte` | Compiled Frontend | JS/TS |
| `html` | Static Frontend | HTML/CSS/JS |
| `netwebapi` | RESTful Backend | C# (.NET 8) |
| `netblazor` | WASM/Server Frontend | C# (.NET 8) |
| `netmaui` | Native Mobile | C# (.NET 8) |
| `node-express` | Hafif Backend | JS/TS (Node.js) |
| `nodejs` | Genel Backend | JS/TS (Node.js) |
| `react-native` | Cross-platform Mobile | JS/TS |

Her stack: `manifest.json` (teknik kısıtlar) + `rules.md` (best practice'ler) + `template/` (kod şablonları)

---

### `05-frameworks/` — UI Framework ve Kütüphane Kuralları

Projeye dahil edilen ek paketlerin nasıl yapılandırılacağını ve kullanılacağını belirtir.

**16 Framework:** `tailwindcss`, `gsap`, `swiper`, `framer-motion`, `three`, `iconify`, `fancyapps`, `chartjs`, `zustand`, `pinia`, `prisma`, `mongoose`, `mssql`, `redis`, `socket-io`, `jwt`

Her framework: `config-rules.md` (konfigürasyon) + `best-practices.md` (performans, güvenlik) + `capability.json` (AI'ya açık API)

---

### `06-datalayer/` — Veritabanı Entegrasyon Katmanı

Projenin ihtiyaç duyduğu veritabanı bağlantı ve entegrasyon çözümleri.

| Kaynak | İçerik |
|--------|--------|
| `postgresql/` | PostgreSQL bağlantı yapılandırması ve integration template |
| `mongodb/` | MongoDB ODM yapılandırması |
| `redis/` | Redis cache ve message broker entegrasyonu |
| `mssql/` | MSSQL bağlantı ve sorgu yapılandırması |
| `sqlite/` | SQLite embedded veritabanı entegrasyonu |

Her kaynak: `capability.json` + `implementation_pattern.md` + `integration_template/`

---

### `07-Orders/` — Master-Prompt Deposu

Blueprint sisteminin çıktı katmanı. Kullanıcıdan gelen proje talepleri, cache-reversing süreciyle derlenmiş master-prompt dosyaları halinde burada saklanır.

Her master-prompt, projenin tüm reçetesini tek dosyada içerir: proje özeti, domain iş mantığı, global kurallar, app stack konfigürasyonu, framework kuralları, versiyon bilgileri ve build talimatları.

---

## 🔄 Cache-Reversing Mimarisi

Bu sistem **cache-reversing** pattern'i ile çalışır. Geleneksel yaklaşımda AI build sırasında ihtiyaç duydukça katmanlara tekrar tekrar bakar. Cache-reversing bu akışı tersine çevirir: **tüm gerekli bilgi, build'den önce toplanıp master-prompt'e gömülür.**

```
┌─────────────────────────────────────────────────────────────────────┐
│  FAZ 1: CREATE — Master-Prompt Oluşturma (Seçici Katman Taraması)   │
│                                                                     │
│  Kullanıcı parametreleri → AI ilgili katmanları seçici biçimde tarar│
│  → 07-Orders/{name}-master-prompt.md (tüm reçete tek dosyada)       │
├─────────────────────────────────────────────────────────────────────┤
│  FAZ 2: BUILD — Master-Prompt'tan Proje Üretimi                     │
│                                                                     │
│  AI sadece master-prompt'i okur, katmanlara geri dönmez.            │
├─────────────────────────────────────────────────────────────────────┤
│  FAZ 3: REVISION — Değişiklik ve Güncelleme                         │
│                                                                     │
│  Kullanıcı değişiklik ister → AI master-prompt'i doğrudan günceller  │
│  (katmanlar yeniden taranmaz)                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Scope Bazlı Filtreleme

| Scope | Domain | 03-infra | 06-datalayer |
|-------|--------|----------|--------------|
| `frontend` + backend yok | Sadece UI/UX/SEO | Atlanır | Atlanır |
| `frontend` + backend var | UI/UX + API/DB | Sadece deployment | İlgili olanlar |
| `backend` | Sadece backend | Tamamı | Tamamı |
| `fullstack` | Tamamı | Tamamı | Tamamı |

---

## 🚀 Kullanım

### Parametreler

| Parametre | Açıklama | Örnek |
|-----------|----------|-------|
| `--project-type` | Proje türü (02-domains'teki domain adı) | `landing-page`, `ecommerce` |
| `--apps` | Kullanılacak stack (04-apps'teki ad) | `html`, `nextjs`, `netwebapi` |
| `--scope` | Kapsam | `frontend`, `backend`, `fullstack` |
| `--frameworks` | Framework listesi (virgülle ayrılmış) | `tailwindcss,gsap,iconify` |
| `--feature` | Proje detayları (renk, font, içerik) | Serbest metin |
| `--name` | Proje adı | `Avşa Pansiyon` |

### Örnek Komut

```
--project-type "landing-page"
--apps "html"
--scope "frontend"
--frameworks "tailwindcss,swiper,iconify,gsap"
--feature "Koyu temalı, tek sayfa spor salonu tanıtım sitesi"
--name "Zafer Spor Salonu"
```

### Süreç

**Aşama 1 — Master-Prompt Oluşturma:**
1. AI, kullanıcı parametrelerini alır
2. Scope'a göre ilgili katmanları seçici biçimde tarar
3. Tüm bilgiyi tek bir master-prompt'ta birleştirir (`07-Orders/`)
4. Kullanıcıya incelemesi için sunar

**Aşama 2 — Proje Build:**
1. Kullanıcı master-prompt'u onaylar (`<!-- APPROVED -->`)
2. AI sadece master-prompt'i okuyarak projeyi inşa eder
3. Katmanlara geri dönmez — tüm bilgi master-prompt'tadır

---

## 🤖 Yeni Bir AI ile Kullanım

Bu sistem, herhangi bir AI modeli tarafından sıfır bağlamla kullanılabilir:

1. **Sistem Prompt'u:** `system_prompt.md` dosyasını AI'ya sistem prompt'u olarak verin
2. **Dizin Erişimi:** `ai-blueprint-core/` dizininin tamamına okuma erişimi
3. **Kullanıcı Parametreleri:** İlk mesaj olarak parametreleri girin

AI, `system_prompt.md`'deki talimatlarla katmanları seçici biçimde tarar, master-prompt oluşturur ve projeyi inşa eder.

**Önemli notlar:**
- AI katmanları asla kendi başına değiştirmez, sadece okur
- AI, master-prompt'ta `<!-- APPROVED -->` header'ı olmadan build yapmaz
- Revizyon istekleri doğrudan master-prompt üzerinde yapılır, katmanlar yeniden taranmaz

---

## 📋 Placeholder Konvansiyonları

| Format | Örnek |
|--------|-------|
| PascalCase | `{{ProjectName}}` |
| camelCase | `{{projectName}}` |
| kebab-case | `{{project-name}}` |
| snake_case | `{{project_name}}` |
| SCREAMING_SNAKE | `{{PROJECT_NAME}}` |

---

## 🎯 Hedef

AI'nın, bir iş mantığı tanımından yola çıkarak, best practice'lere uygun, production-ready bir proje üretebilmesi.

Her şey tek bir prensibe dayanır: AI'ya her şeyi anlatmak yerine, **sadece o an ihtiyacı olanı, doğru formatta, kesin kurallarla** vermek.
