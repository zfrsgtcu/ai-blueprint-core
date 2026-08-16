# Agent Tanımları (Specialist Roles)

Bu dizin, proje geliştirme sürecinde kullanılan **uzman agent tanımlarını** içerir. Her agent, belirli bir uzmanlık alanında tutarlı, kaliteli ve kurallara uygun çıktı üretmesi için tasarlanmıştır.

---

## 📁 Agent Kategorileri

### 🔹 Backend Agent'ları (`backend/`)
API tasarımı, veritabanı yönetimi ve business logic implementasyonu konusunda uzmanlaşmış agent'lar.

| Dosya | Rol | Uzmanlık Alanı |
|-------|-----|----------------|
| `dotnet-developer.md` | .NET Core 9 Backend Geliştirici | RESTful API, EF Core, JWT auth, MSSQL |
| `nodejs-developer.md` | Node.js Backend Geliştirici | Express/Fastify, hafif API'ler, Vercel serverless |
| `database-developer.md` | MSSQL Veritabanı Uzmanı | Schema tasarımı, index stratejileri, query optimizasyonu |

**İlişkili Stack'ler:** Tüm .NET backend stack'leri (`ecommerce`, `saas-crm`, `booking`, `lms`, vb.)

---

### 🔹 Frontend Agent'ları (`frontend/`)
UI/UX implementasyonu, component geliştirme ve responsive tasarım konusunda uzmanlaşmış agent'lar.

| Dosya | Rol | Uzmanlık Alanı |
|-------|-----|----------------|
| `astro-developer.md` | Astro.js Site Geliştirici | Statik/dinamik siteler, SEO, markdown içerik |
| `nuxt-developer.md` | Nuxt.js (Vue 3) Uygulama Geliştirici | SSR/SPA, Pinia state, API integration |
| `ui-designer.md` | UI/UX Visual Specialist | TailwindCSS, GSAP animasyonlar, Swiper/FancyBox |
| `mobile-developer.md` | Mobil Uygulama Geliştirici | .NET MAUI, React Native, push notification, biyometri |

**İlişkili Stack'ler:** Tüm frontend içeren stack'ler (`corporate-portfolio`, `landing-page`, `ecommerce`, `native-mobile`, vb.)

---

### 🔹 DevOps Agent'ları (`devops/`)
CI/CD pipeline, deployment stratejisi ve infrastructure management konusunda uzmanlaşmış agent'lar.

| Dosya | Rol | Uzmanlık Alanı |
|-------|-----|----------------|
| `vercel-deploy.md` | Vercel Deploy Uzmanı | Frontend/Node.js deploy, environment variables, build optimization |
| `azure-deploy.md` | Azure App Service Deploy Uzmanı | .NET Web API deploy, CORS, Azure SQL, Application Insights |
| `ci-cd-pipeline.md` | GitHub Actions CI/CD Yöneticisi | Workflow yönetimi, multi-environment deployment, secret management |

**İlişkili Stack'ler:** Tüm stack'ler (her projede CI/CD gerekir)

---

### 🔹 QA Agent'ları (`qa/`)
Test stratejisi, otomasyon ve kalite güvencesi konusunda uzmanlaşmış agent'lar.

| Dosya | Rol | Uzmanlık Alanı |
|-------|-----|----------------|
| `testing-strategy.md` | Test Stratejisi Uzmanı | Unit/integration/E2E test planlama, coverage hedefleri |
| `test-cases.md` | Manuel Test Senaryoları Oluşturucu | Positive/negative senaryolar, regression test listesi |

**İlişkili Stack'ler:** Tüm stack'ler (her projede test gereklidir)

---

### 🔹 Project Manager Agent'ları (`project-manager/`)
Proje planlaması, gereksinim analizi ve ilerleme takibi konusunda uzmanlaşmış agent'lar.

| Dosya | Rol | Uzmanlık Alanı |
|-------|-----|----------------|
| `requirements.md` | Gereksinim Analisti | Kullanıcı hikayeleri, kabul kriterleri, NFR tanımlama |
| `progress-tracking.md` | Proje İlerleme Takipçisi | Sprint planlama, risk raporlama, deploy takibi |

**İlişkili Stack'ler:** Tüm stack'ler (her projede proje yönetimi gerekir)

---

## 🔗 Mapping'e Entegrasyon

Bu agent'lar `agents-stack-mapping.json` dosyası üzerinden workflow'lara entegre edilir. Örneğin:

```json
{
  "condition": { "frontend": ["nuxt-js"], "backend": ["dotnet-webapi"] },
  "agents": [
    {"category": "backend", "subagent": "database-developer"},
    {"category": "backend", "subagent": "dotnet-developer"},
    {"category": "frontend", "subagent": "nuxt-developer"},
    {"category": "qa", "subagent": "testing-strategy"}
  ]
}
```

---

## 📚 İlişkili Dokümanlar

- [Stack Template Library](../stacks/README.md) — Proje tipi template'leri ve teknolojiler
- [Agent-Stack Mapping](../agents-stack-mapping.json) — Hangi stack için hangi agent'ların çalıştırılacağı
- [Workflows](../workflows/README.md) — Workflow kullanım rehberi

---

## 📝 Notlar

- Her agent dosyası **standart şablona** göre hazırlanmıştır (rol, sorumluluklar, teknolojiler, best practices, çıktı formatı, referans linkler)
- Agent'lar **framework-aware** — Astro.js, Nuxt.js, MAUI gibi teknolojilere özel bilgiler içerir
- Yeni agent eklemek için: ilgili kategori klasörüne yeni bir `.md` dosyası ekle ve `agents-stack-mapping.json` dosyasına referans ver
