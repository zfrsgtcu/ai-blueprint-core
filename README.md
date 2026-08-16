# MCP Proje Yönetim Sistemi

Bu dizin, yapay zeka destekli proje olusturma ve feature development islemlerini otomatiklestiren sistem dosyalarini icerir.

---

## 🏗️ Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│                    Proje Yönetim Sistemi                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────────┐    ┌───────────┐ │
│  │   Stacks     │    │ Agent Mapping    │    │ Workflows │ │
│  │              │    │                  │    │           │ │
│  │ Proje tipi-  │───▶│ Hangi agent'lar │───▶│ Feature   │ │
│  │ leri ve      │    │ calisacak?      │    │ Dev       │ │
│  │ teknoloji    │    │ (dinamik)       │    │ Workflow  │ │
│  │ konfigür.    │    └──────────────────┘    └───────────┘ │
│  └──────────────┘              │                            │
│                                ▼                              │
│                    ┌──────────────────┐                      │
│                    │   Agent Tanımları │                      │
│                    │                  │                      │
│                    │ backend.md       │                      │
│                    │ frontend.md      │                      │
│                    │ mobile-client.md │                      │
│                    │ qa.md            │                      │
│                    │ devops.md        │                      │
│                    └──────────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Yapısı

```
.claude/
├── README.md                          # Bu dosya — sistem genel bakis
├── agents-stack-mapping.json          # Stack → Agent eşleme tablosu (YENİ)
│
├── agents/                            # Agent rol ve sorumluluk tanimlari
│   ├── backend.md                     # Backend Developer (API, DB, business logic)
│   ├── frontend.md                    # Frontend Developer (UI/UX, component)
│   ├── mobile-client.md               # Mobile Client Developer (React Native)
│   ├── qa.md                          # QA/Testing Engineer (test stratejisi)
│   └── devops.md                      # DevOps/Infrastructure Engineer
│
├── stacks/                            # Proje tipi template'leri
│   ├── README.md                      # Stack listesi ve mapping tablosu
│   ├── corporate-portfolio.json       # Kurumsal & Portfolyo (Astro.js)
│   ├── landing-page.json              # Landing Page (Astro.js)
│   ├── news-magazine.json             # Haber & Dergi (Astro.js + Node/.NET)
│   ├── ecommerce.json                 # E-Ticaret (Nuxt.js + .NET)
│   ├── classifieds.json               # İlan & Sınıflandırılmış
│   ├── booking.json                   # Randevu / Booking
│   ├── lms.json                       # E-Öğrenme (LMS)
│   ├── saas-crm.json                  # SaaS / CRM
│   ├── admin-panel.json               # Özel Yönetim Paneli
│   ├── mobile-backend.json            # Mobil Backend (React Native)
│   ├── native-mobile.json             # Native Mobil (MAUI)
│   └── hybrid-blazor-maui.json        # Hibrit (Blazor + MAUI)
│
├── workflows/                         # Otomatik is akislari
│   ├── README.md                      # Workflow kullanimi ve dokümantasyon
│   └── feature-dev.js                 # Feature Development workflow
│
├── projects/                          # Proje konfigürasyonlari (oluşturulduktan sonra)
│   └── <project-name>.json
│
└── design-practices/                  # UI/UX tasarım pratikleri
    └── *.json
```

---

## 🚀 Hızli Baslangic

### 1. Yeni Proje Başlatma

```bash
/project-init my-project --stack ecommerce --name "Online Mağazam"
```

Bu komut:
- `my-project` dizinini olusturur
- Seçilen stack template'ini kopyalar
- `.claude/projects/my-project.json` konfigürasyon dosyasi yaratir

### 2. Feature Geliştirme

```bash
/workflow feature-dev --stack ecommerce --feature "Urun ekleme sayfasi"
```

Workflow:
1. Stack konfigürasyonunu yükler
2. Hangi agent'larin calisacagini otomatik belirler
3. Her departman kod dosyalari olusturur
4. Ozet rapor sunar

### 3. Yeni Stack Ekleme

1. `.claude/stacks/<yeni-stack>.json` dosyasi olusturun (varolan bir stack'i referans alin)
2. `agents-stack-mapping.json` dosyasina yeni kural ekleyin
3. Gerekirse yeni agent tanimi ekleyin (`agents/` dizini)
4. `stacks/README.md` ve bu README'yi guncelleyin

---

## 🔗 Stack-Agent Eşleme (İki-Seviyeli Yapı)

Her stack, `agents-stack-mapping.json` dosyasina gore **iki-seviyeli** olarak hangi agent'larin calistirilacagini belirler:

### Seviye 1: Category (Kategori)
- `backend`, `frontend`, `devops`, `qa`, `project-manager`

### Seviye 2: Subagent (Alt Uzman)
- Her kategori icin birden fazla subagent olabilir (orn. `backend`: `dotnet-developer`, `database-developer`)

### Execution Stratejileri
- **serial**: Agent'lar sirayla calisir (birinin cikti si sonrakinin girdisi olabilir)
- **parallel**: Agent'lar paralel calisir (bagimsiz gorevler icin)

| Stack Tipi | Calistirilan Agent'lar (Category/Subagent) |
|------------|-------------------------------------------|
| Static Site (Astro.js) | `frontend/astro-developer`, `devops/vercel-deploy` |
| Dynamic Full-Stack (Nuxt + .NET) | `backend/database-developer`, `backend/dotnet-developer`, `frontend/nuxt-developer`, `qa/testing-strategy`, `devops/azure-deploy` |
| Mobile Backend (React Native) | `backend/database-developer`, `backend/dotnet-developer`, `frontend/mobile-developer`, `qa/testing-strategy`, `devops/azure-deploy` |
| Native MAUI / Blazor Hybrid | `backend/database-developer`, `backend/dotnet-developer`, `frontend/mobile-developer`, `qa/testing-strategy`, `devops/azure-deploy` |

Detayli tablo icin [stacks/README.md](./stacks/README.md) bakin.

---

## 📚 Dokümantasyon

- **[Stack Template Library](./stacks/README.md)** — Mevcut stack'ler, teknolojiler ve mapping tablosu
- **[Workflows](./workflows/README.md)** — Workflow kullanimi ve pipeline akisi
- **[Agent Tanımları](./agents/)** — Her agent'in rol ve sorumluluklari

---

## ⚙️ Özelleştirme

### Yeni Agent Ekleme

1. `agents/<agent-name>.md` dosyasi olusturun (mevcut format: `# Rol`, `## Sorumluluklar`, `## Çıktı Formatı`, `## Kalite Kriterleri`)
2. `agents-stack-mapping.json` dosyasina agent'i ekleyin (`agentKeys` array'ine)
3. Gerekirse yeni kural ekleyin (`stackAgentRules` array'ine)

### Mevcut Stack'i Degistirme

1. Ilgili `.json` dosyasini duzenleyin
2. `departmentPrompts` alanindaki departman prompt'larini guncelleyin
3. UI kütüphanelerini veya extra servisleri ekleyin/çıkarın

---

## 🎯 Senaryolar

### Feature Development (Yeni Özellik)
Tüm ilgili departmanlar koordineli çalisarak production-ready kod olusturur.

### Maintenance / Bug Fix
Mevcut feature'ı refactor et, bug fix yap veya performans iyilestir.

### Planning Session
Sprint planning icin mimari kararlar al, task breakdown yap.

---

## 📝 Notlar

- Bu sistem **dinamik** çalisir — her stack için farkli agent listesi kullanilir
- Agent tanimlari **framework-aware** — Astro.js, Nuxt.js, MAUI gibi teknolojilere özel bilgiler icerir
- Yeni stack eklemek icin sadece JSON dosyasi + mapping kurali yeterli
- Workflow'lar **seri pipeline** olarak çalisir (bir agent sonraki agent'in girdisini olusturur)
