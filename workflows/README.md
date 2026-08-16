# Workflows

Bu dizin, proje olusturma ve feature development islemlerini otomatiklestiren workflow script'lerini icerir.

---

## 📁 Workflow Dosyalari

| Dosya | Açiklama |
|-------|----------|
| `feature-dev.mjs` | Feature Development Workflow — Stack'e göre dinamik agent resolution ile **iki-seviyeli** (category/subagent) agent'lar calistirir |

---

## 🚀 feature-dev Workflow

### Ne Ister?

Bir proje tipi secilir ve bir feature/task tanimlanir. Workflow:
1. Ilgili stack konfigürasyonunu yükler
2. Stack'e göre hangi **category/subagent**'larin calisacagini belirler (mapping dosyasi üzerinden)
3. Her kategorideki agent'lari **serial** veya **parallel** olarak calistirir
4. Her departman gerçek kod dosyalari olusturur

### Kullanim

```bash
/workflow feature-dev --stack ecommerce --feature "Urun ekleme sayfasi"
```

veya proje konfigürasyonundan:

```bash
/workflow feature-dev --projectConfig "{\"stack\": \"lms\"}" --feature "Video streaming entegrasyonu"
```

---

## 🔗 İki-Seviyeli Agent Resolution (YENİ)

Workflow, `agents-stack-mapping.json` dosyasina bakarak **iki-seviyeli** olarak hangi agent'larin calisacagini belirler:

### Seviye 1: Category (Kategori)
- `backend`, `frontend`, `devops`, `qa`, `project-manager`

### Seviye 2: Subagent (Alt Uzman)
- Her kategori icin birden fazla subagent olabilir (orn. `backend`: `dotnet-developer`, `database-developer`)

### Execution Stratejileri

| Mode | Açiklama | Örnek Kategori |
|------|----------|----------------|
| **serial** | Agent'lar sirayla calisir (birinin cikti si sonrakinin girdisi olabilir) | `backend`, `frontend`, `qa` |
| **parallel** | Agent'lar paralel calisir (bagimsiz gorevler icin) | `devops` (`vercel-deploy` + `azure-deploy`) |

### Stack'e Göre Calistirilan Agent'lar

| Stack Tipi | Category/Subagent Listesi |
|------------|---------------------------|
| Static Site (Astro.js) | `frontend/astro-developer`, `devops/vercel-deploy` |
| Dynamic Full-Stack (Nuxt + .NET) | `backend/database-developer`, `backend/dotnet-developer`, `frontend/nuxt-developer`, `qa/testing-strategy`, `devops/azure-deploy` |
| Mobile Backend (React Native) | `backend/database-developer`, `backend/dotnet-developer`, `frontend/mobile-developer`, `qa/testing-strategy`, `devops/azure-deploy` |
| Native MAUI / Blazor Hybrid | `backend/database-developer`, `backend/dotnet-developer`, `frontend/mobile-developer`, `qa/testing-strategy`, `devops/azure-deploy` |

---

## 📊 Yeni Pipeline Akışı (YENİ)

```
Stack JSON (.claude/stacks/*.json)
  |
  v
agents-stack-mapping.json (reads stack.frontend + stack.backend → {category, subagent} listesi)
  |
  v
 agentsByCategory'e Grupla
  |
  v
For each category:
  ├─ execution === 'parallel' → Promise.all(subagents.map(executeAgent))
  └─ execution === 'serial'  → for loop ile sırayla executeAgent()
      │
      For each subagent in order:
        1. Load definition from agents/{category}/{subagent}.md
        2. Inject stack-specific context from departmentPrompts.{category}
        3. Execute agent with combined prompt
        4. Capture output for next agent's input (serial only)
  |
  v
Aggregate results by category/subagent → Summary report
```

---

## Çıktılar

Her agent:
- Gerçek kod dosyalari olusturur (placeholder degil, production-ready)
- Belirtilen schema'ya uygun JSON cikti verir
- Workflow sonunda **kategori bazli** ozet rapor olusturulur

### Özet Rapor Formatı (YENİ)
```markdown
## 📊 Workflow Özet Raporu

**Proje:** E-Ticaret
**Hedef:** Urun ekleme sayfasi
**Calistirilan Agent'lar:** [backend/database-developer, backend/dotnet-developer, frontend/nuxt-developer]

### ✅ Oluşturulan Dosyalar (Kategori Bazlı):
#### backend/database-developer Agent:
- my-project/db/migrations/001_create_products_table.cs

#### backend/dotnet-developer Agent:
- my-project/src/API/Controllers/ProductsController.cs

#### frontend/nuxt-developer Agent:
- my-project/pages/products/create.vue
```

---

## ⚙️ Yeni Workflow Ekleme

1. `.claude/workflows/` dizinine yeni bir JS dosyasi ekleyin
2. `export default async function main() { ... }` yapisi kullanin
3. Gerekirse yardimci fonksiyonlar (loadStackConfig, agent cagirma) ekleyin
4. Workflow'unuzu calistirmek icin: `/workflow <filename> --args`

---

## 📚 Iliskili Dokümanlar

- [Stack Template Library](../stacks/README.md) — Stack'ler ve teknolojiler (iki-seviyeli mapping tablosu ile)
- [Agent Tanımları](../agents/) — Agent rol ve sorumluluklari (kategori/subagent yapisi)
- [System Overview](../README.md) — Genel mimari ve kurulum


