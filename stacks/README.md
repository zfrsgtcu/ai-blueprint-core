# Stack Template Library

## 📦 Proje Türlerine Göre Önceden Tanımlanmış Teknoloji Yığınları

Her proje türü için **optimized stack template'leri**. Departman prompt'ları bu stack'lere göre dinamik olarak özelleştirilir.

---

## 🗂️ Stack Listesi

| # | Proje Türü | Frontend | Backend | Database | Deploy |
|---|------------|----------|---------|----------|--------|
| 1 | **Kurumsal & Portfolyo** | Astro.js | Node.js (opsiyonel) | SQLite | Vercel |
| 2 | **Landing Page** | Astro.js | Gerekmez | - | Vercel |
| 3 | **Haber & Dergi** | Astro.js | Node.js/.NET | MSSQL (Natro) | Vercel |
| 4 | **E-Ticaret** | Nuxt.js | .NET Web API | MSSQL (Natro) | Vercel + Azure |
| 5 | **İlan & Sınıflandırılmış** | Nuxt.js | .NET Web API | MSSQL (Natro) | Vercel + Azure |
| 6 | **Randevu / Booking** | Nuxt.js | .NET Web API | MSSQL (Natro) | Vercel + Azure |
| 7 | **E-Öğrenme (LMS)** | Nuxt.js | .NET Web API | MSSQL (Natro) | Vercel + Azure |
| 8 | **SaaS / CRM** | Nuxt.js | .NET Web API | MSSQL (Natro) | Vercel + Azure |
| 9 | **Özel Yönetim Paneli** | Nuxt.js/Blazor | .NET Web API | MSSQL (Natro) | Vercel/Azure |
| 10 | **Mobil Backend** | React Native | .NET Web API | MSSQL (Natro) | Azure |
| 11 | **Native Mobil (MAUI)** | .NET MAUI | .NET Web API | MSSQL/SQLite | Azure + Store |
| 12 | **Hibrit (Blazor+MAUI)** | Blazor Hybrid | .NET Web API | MSSQL/SQLite | Azure + Store |

---

## 📁 Dosya Yapısı

```
.claude/stacks/
├── README.md                          # Bu dosya
├── corporate-portfolio.json           # 1. Kurumsal & Portfolyo
├── landing-page.json                  # 2. Landing Page
├── news-magazine.json                 # 3. Haber & Dergi
├── ecommerce.json                     # 4. E-Ticaret
├── classifieds.json                   # 5. İlan & Sınıflandırılmış
├── booking.json                       # 6. Randevu / Booking
├── lms.json                           # 7. E-Öğrenme (LMS)
├── saas-crm.json                      # 8. SaaS / CRM
├── admin-panel.json                   # 9. Özel Yönetim Paneli
├── mobile-backend.json                # 10. Mobil Backend
├── native-mobile.json                 # 11. Native Mobil (MAUI)
└── hybrid-blazor-maui.json            # 12. Hibrit (Blazor+MAUI)
```

---

## 🚀 Kullanım

### 1. Yeni Proje Başlatma
```bash
/project-init my-project --stack ecommerce --name "Online Mağazam"
```

Otomatik olarak `.claude/projects/my-project.json` oluşturulur ve seçilen stack template'i kopyalanır.

### 2. Workflow Çalıştırma
```bash
/workflow feature-dev --feature "Ürün ekleme sayfası"
```

Workflow, proje konfigürasyonundaki stack'e göre departman prompt'larını dinamik olarak günceller:
- **Backend Agent**: ".NET Web API kullan, MSSQL veritabanı şeması oluştur..."
- **Frontend Agent**: "Nuxt.js ile SSR yap, SwiperJS ürün galerisi ekle..."
- **DevOps Agent**: "Vercel + Azure deploy et..."

---

## 🎨 Stack Template Yapısı

Her template şu alanları içerir:

```json
{
  "id": "ecommerce",
  "name": "E-Ticaret",
  "description": "...",
  "type": "dynamic-ecommerce",
  
  "stack": {
    "frontend": "nuxt-js",
    "backend": "dotnet-webapi",
    "database": "mssql-natro",
    "deploy": "vercel-azure"
  },
  
  "uiLibraries": [...],
  "extraServices": [...],
  "compliance": ["kvkk", "gdpr"],
  "features": [...],
  "designGuidelines": {...},
  "departmentPrompts": {
    "backend": "...",
    "frontend": "...",
    "qa": "...",
    "devops": "..."
  },
  "performanceTargets": {...},
  
  "docs": {
    "nuxtjs": [
      { "name": "Ana Dokümantasyon", "url": "https://nuxt.com/docs" },
      { "name": "Getting Started", "url": "https://nuxt.com/docs/getting-started/introduction" }
    ],
    "dotnet-webapi": [
      { "name": "Ana Dokümantasyon", "url": "https://learn.microsoft.com/aspnet/core" },
      { "name": "Create a Web API", "url": "https://learn.microsoft.com/aspnet/core/tutorials/first-web-api" }
    ]
  }
}
```

### 📚 `docs` Alanı Nedir?

Her stack, kullandığı framework'lerin **referans dokümantasyon linklerini** içerir. Bu linkler:
- ✅ Departman agent'larının doğru syntax ve best practices'i uygulamasını sağlar
- ✅ Framework'ün resmi dokümantasyonuna doğrudan erişim sunar
- ✅ Güncel kalır (resmi kaynaklara yönlendirme)

**Örnek Stack'ler:**
- **E-Ticaret**: Nuxt.js, .NET Web API, MSSQL, Stripe, Persona
- **Kurumsal Site**: Astro.js, TailwindCSS, GSAP, SwiperJS
- **Mobil Uygulama**: .NET MAUI, Blazor Hybrid, MSSQL

---

## 📚 Dokümantasyon Linkleri Kullanımı

Workflow çalıştığında, departman agent'ları ilgili framework dokümanlarına erişir:

```javascript
// Örnek: E-Ticaret stack'i için Frontend Agent
const docs = stackConfig.docs.nuxtjs;
// → https://nuxt.com/docs/getting-started/introduction

// Örnek: Kurumsal Site stack'i için DevOps Agent
const docs = stackConfig.docs.vercel;
// → https://vercel.com/docs/getting-started
```

**Agent'lar bu linkleri kullanarak:**
- Framework'ün kendi konvansiyonlarını uygular
- Doğru syntax ve API kullanır
- Best practices'e uygun kod yazar

---

## ⚙️ Özelleştirme

### Yeni Stack Eklemek İçin:
1. `.claude/stacks/` altına yeni bir JSON dosyası oluştur
2. Yukarıdaki yapıya uygun template yaz
3. README.md'ye ekle

### Mevcut Stack'i Değiştirmek İçin:
- İlgili JSON dosyasını düzenle
- Departman prompt'larını güncelle
- UI kütüphanelerini ekle/çıkar

---

## 🔗 Workflow Entegrasyonu

Stack template'leri `feature-dev.js` workflow'u ile entegre çalışır:

```javascript
// Stack'e göre departman prompt'ları dinamik olarak yüklenir
const stackConfig = await loadStackConfig(project.stack);
const departmentPrompts = stackConfig.departmentPrompts;

// Her departmana özel prompt gönderilir
const backendResult = await agent(departmentPrompts.backend, { ... });
```

---

## 📊 Compliance & Güvenlik

Her stack template'i ilgili compliance gereksinimlerini içerir:

| Stack | KVKK | GDPR | PCI-DSS | ISO 27001 | SOC 2 |
|-------|------|------|---------|-----------|-------|
| Kurumsal | ✅ | ✅ | - | - | - |
| E-Ticaret | ✅ | ✅ | ✅ | - | - |
| SaaS/CRM | ✅ | ✅ | - | ✅ | ✅ |
| Mobil | ✅ | ✅ | - | - | - |

---

## 🔗 Stack-Agent Mapping (İki-Seviyeli Yapı)

Her stack, `agents-stack-mapping.json` dosyasina gore **iki-seviyeli** olarak hangi agent'larin calistirilacagini belirler:

### Seviye 1: Category (Kategori)
- `backend`, `frontend`, `devops`, `qa`, `project-manager`

### Seviye 2: Subagent (Alt Uzman)
- Her kategori icin birden fazla subagent olabilir (orn. `backend`: `dotnet-developer`, `database-developer`)

### Execution Stratejileri
- **serial**: Agent'lar sirayla calisir (birinin cikti si sonrakinin girdisi olabilir)
- **parallel**: Agent'lar paralel calisir (bagimsiz gorevler icin)

---

### Mevcut Stack'ler ve Calistirilan Agent'lar

| # | Proje Türü | Frontend | Backend | Database | Deploy | Agirilan Agent'lar (Category/Subagent) |
|---|------------|----------|---------|----------|--------|---------------------------------------|
| 1 | **Kurumsal & Portfolyo** | Astro.js | - | SQLite | Vercel | `frontend/astro-developer`, `devops/vercel-deploy` |
| 2 | **Landing Page** | Astro.js | Gerekmez | - | Vercel | `frontend/astro-developer`, `devops/vercel-deploy` |
| 3 | **Haber & Dergi** | Astro.js | Node.js/.NET | MSSQL (Natro) | Vercel | `backend/nodejs-developer`, `frontend/astro-developer`, `qa/testing-strategy`, `devops/ci-cd-pipeline` |
| 4 | **E-Ticaret** | Nuxt.js | .NET Web API | MSSQL (Natro) | Vercel + Azure | `backend/database-developer`, `backend/dotnet-developer`, `frontend/nuxt-developer`, `qa/testing-strategy`, `devops/azure-deploy` |
| 5 | **İlan & Sınıflandırılmış** | Nuxt.js | .NET Web API | MSSQL (Natro) | Vercel + Azure | `backend/database-developer`, `backend/dotnet-developer`, `frontend/nuxt-developer`, `qa/testing-strategy`, `devops/azure-deploy` |
| 6 | **Randevu / Booking** | Nuxt.js | .NET Web API | MSSQL (Natro) | Vercel + Azure | `backend/database-developer`, `backend/dotnet-developer`, `frontend/nuxt-developer`, `qa/testing-strategy`, `devops/azure-deploy` |
| 7 | **E-Öğrenme (LMS)** | Nuxt.js | .NET Web API | MSSQL (Natro) | Vercel + Azure | `backend/database-developer`, `backend/dotnet-developer`, `frontend/nuxt-developer`, `qa/testing-strategy`, `devops/azure-deploy` |
| 8 | **SaaS / CRM** | Nuxt.js | .NET Web API | MSSQL (Natro) | Vercel + Azure | `backend/database-developer`, `backend/dotnet-developer`, `frontend/nuxt-developer`, `qa/testing-strategy`, `devops/azure-deploy` |
| 9 | **Özel Yönetim Paneli** | Nuxt.js/Blazor | .NET Web API | MSSQL (Natro) | Vercel/Azure | `backend/database-developer`, `backend/dotnet-developer`, `frontend/nuxt-developer`, `qa/testing-strategy`, `devops/azure-deploy` |
| 10 | **Mobil Backend** | React Native | .NET Web API | MSSQL (Natro) | Azure | `backend/database-developer`, `backend/dotnet-developer`, `frontend/mobile-developer`, `qa/testing-strategy`, `devops/azure-deploy` |
| 11 | **Native Mobil (MAUI)** | .NET MAUI | .NET Web API | MSSQL/SQLite | Azure + Store | `backend/database-developer`, `backend/dotnet-developer`, `frontend/mobile-developer`, `qa/testing-strategy`, `devops/azure-deploy` |
| 12 | **Hibrit (Blazor+MAUI)** | Blazor Hybrid | .NET Web API | MSSQL/SQLite | Azure + Store | `backend/database-developer`, `backend/dotnet-developer`, `frontend/mobile-developer`, `qa/testing-strategy`, `devops/azure-deploy` |

---

### Agent Kategorileri ve Subagent'lar

| Category | Subagent'lar | Execution Mode |
|----------|--------------|----------------|
| **backend** | `dotnet-developer`, `nodejs-developer`, `database-developer` | serial |
| **frontend** | `astro-developer`, `nuxt-developer`, `ui-designer`, `mobile-developer` | serial |
| **devops** | `vercel-deploy`, `azure-deploy`, `ci-cd-pipeline` | parallel |
| **qa** | `testing-strategy`, `test-cases` | serial |
| **project-manager** | `requirements`, `progress-tracking` | serial |

> **Not:** `devops` kategorisinde `vercel-deploy` ve `azure-deploy` **parallel** calisir (bagimsiz deploy stratejileri), `ci-cd-pipeline` ise **serial** calisir (dig erleri tamamlanmadan once olusturulamaz).

---

## 📚 Dokümantasyon Linkleri Kullanimi

Workflow calistiginda, departman agent'lari ilgili framework dokümanlarina erisir:

```javascript
// Ornek: E-Ticaret stack'i icin Frontend Agent
const docs = stackConfig.docs.nuxtjs;
// → https://nuxt.com/docs/getting-started/introduction

// Ornek: Kurumsal Site stack'i icin DevOps Agent
const docs = stackConfig.docs.vercel;
// → https://vercel.com/docs/getting-started
```

**Agent'lar bu linkleri kullanarak:**
- Framework'un kendi konvansiyonlarini uygular
- Dogru syntax ve API kullanir
- Best practices'e uygun kod yazar

---

## 💡 İpuçları

- **Karıştırdığınızda**: Hangi stack'in daha uygun olduğunu anlamak için `description` alanına bakın
- **Özel gereksinimler**: Stack template'ine `extraServices` ekleyerek özelleştirin
- **Test etmek için**: `/project-init --dry-run` ile stack'i test edebilirsiniz
