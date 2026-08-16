<!--
  BU DOSYANIN AMACI:
  AI ajanlarına 04-apps katmanının bütünsel kullanım kılavuzunu sunar.
  Bu README, AI'nın bu katmanı nasıl okuyup uygulayacağını adım adım açıklar.
  Her stack klasörünün (astrojs, nuxtjs, netwebapi, vb.) nasıl kullanılacağını,
  template dosyalarındaki placeholder'ların nasıl doldurulacağını ve
  domain logic ile nasıl eşleştirileceğini gösterir.
-->

# 04-APPS — REFERANS MİMARİ KÜTÜPHANESİ (Application Skeletons)

## KATMAN FELSEFESİ

Bu katman, AI ajanlarının kod üretirken başvurduğu **Referans Mimari Kütüphanesi'dir.** Buradaki her klasör, bir projenin "nasıl görünmesi gerektiğine" dair yetkili kaynaktır.

**Altın Kural:** AI buradaki yapıyı KOPYALAMAZ — buradaki MANTIĞI okur ve UYGULAR. Template'ler başlangıç noktasıdır, bitiş noktası değildir.

### Nasıl Çalışır?

1. **manifest.json** → AI'nın o stack hakkında bilmesi gereken teknik kısıtları ve değişkenleri tanımlar
2. **rules.md** → AI'nın bu stack'i kullanırken uyması gereken best practice kuralları (ZORUNLU/YASAK/ÖNERİLEN)
3. **template/** → AI'nın üzerinde işlem yapacağı, `{{Placeholder}}` ifadeler içeren ham kod dosyaları

## KLASÖR YAPISI

```
04-apps/
├── manifest.json                     ← Bu katmanın ana manifesti (AI giriş noktası)
├── README.md                         ← Bu dosya (kullanım kılavuzu)
│
├── astrojs/                          ← Astro.js 4.x (Static/SSR Frontend)
│   ├── manifest.json                 ← Stack manifesti
│   ├── rules.md                      ← Best practice kuralları
│   └── template/                     ← Kod şablonları
│       ├── astro.config.mjs
│       ├── package.json
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       └── src/
│           ├── pages/index.astro
│           └── layouts/BaseLayout.astro
│
├── nuxtjs/                           ← Nuxt.js 3.x (Vue 3 SSR/SSG Frontend)
│   ├── manifest.json
│   ├── rules.md
│   └── template/
│       ├── nuxt.config.ts
│       ├── package.json
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       ├── app.vue
│       ├── pages/index.vue
│       └── server/api/example.get.ts
│
├── nextjs/                           ← Next.js 14 (React SSR/SSG Frontend)
│   ├── manifest.json
│   ├── rules.md
│   └── template/
│       ├── next.config.js
│       ├── package.json
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       └── app/
│           ├── layout.tsx
│           └── page.tsx
│
├── netblazor/                        ← Blazor 8 (WASM/Server Frontend)
│   ├── manifest.json
│   ├── rules.md
│   └── template/
│       ├── Program.cs
│       ├── App.razor
│       ├── *.csproj
│       └── Pages/Index.razor
│
├── netwebapi/                        ← .NET 8 Web API (RESTful Backend)
│   ├── manifest.json
│   ├── rules.md
│   └── template/
│       ├── Program.cs
│       ├── appsettings.json
│       ├── *.csproj
│       └── Controllers/ExampleController.cs
│
├── node-express/                     ← Node.js Express (Hafif Backend)
│   ├── manifest.json
│   ├── rules.md
│   └── template/
│       ├── package.json
│       ├── .env.example
│       └── src/
│           ├── index.js
│           ├── routes/index.js
│           └── middleware/errorHandler.js
│
├── netmaui/                          ← .NET MAUI 8 (Native Mobile)
│   ├── manifest.json
│   ├── rules.md
│   └── template/
│       ├── App.xaml
│       ├── AppShell.xaml
│       ├── MauiProgram.cs
│       └── *.csproj
│
└── react-native/                     ← React Native (Cross-platform Mobile)
    ├── manifest.json
    ├── rules.md
    └── template/
        ├── package.json
        ├── App.tsx
        ├── app.json
        └── tsconfig.json
```

## AI İŞ AKIŞI (ADIM ADIM)

### Adım 1: Registry'yi Oku

AI, önce `00-registry/versions.json` dosyasından kilitli versiyonları okur. Hangi framework'ün hangi sürümü kullanılacak, bu dosyada kesinleşmiştir.

```json
// versions.json → infrastructures.astrojs → "^4.5.0"
// AI, package.json'da "astro": "^4.5.0" kullanmak ZORUNDADIR
```

### Adım 2: Stack Mapping'i Analiz Et

`.claude/agents-stack-mapping.json` dosyasından projenin frontend ve backend kombinasyonuna göre hangi agent'ların çalışacağını belirle.

```
// Örnek: nuxt-js + dotnet-webapi → database-developer + dotnet-developer + nuxt-developer
// Bu kombinasyon, AI'nın hem nuxtjs/ hem de netwebapi/ stack'lerini okuması gerektiği anlamına gelir
```

### Adım 3: Domain Logic'i Oku

`02-domains/{domain}/business-logic.md` dosyasından iş mantığı kurallarını oku. Burada tanımlanan entity'ler, template'lerdeki `{{ModelName}}` placeholder'larının değerini belirler.

```
// Örnek: ecommerce domain → Product, Category, Cart, Order, Payment entity'leri
// AI, template'lerdeki {{ModelName}} yerine bu entity adlarını koyar
```

### Adım 4: Stack Manifest'lerini Oku

Seçilen stack'in `manifest.json` dosyasını oku. Bu dosya şunları içerir:
- `required_variables` → AI'nın mutlaka tanımlaması gereken değişkenler
- `directory_structure` → Projenin zorunlu dizin yapısı
- `entry_point` → Uygulamanın başlangıç noktası
- `deployment` → Deployment hedefi ve kuralları

### Adım 5: Stack Rules'ları Oku

`rules.md` dosyasını oku. Bu dosya üç seviyede kural içerir:

| Seviye | Anlamı | Örnek |
|--------|--------|-------|
| 🔴 ZORUNLU | Kesinlikle uyulmalı, ihlal → hata | `async/await zorunlu` |
| 🟠 YASAK | Kesinlikle yapılmamalı | `:latest tag KULLANILMAZ` |
| 🟡 ÖNERİLEN | Best practice, kuvvetle tavsiye | `Repository pattern kullan` |
| 🟢 OPSİYONEL | Proje ihtiyacına göre karar ver | `MediatR kullanılabilir` |

### Adım 6: Map & Generate

Bu en kritik adımdır. AI şunları yapar:

1. **Entity Mapping:** `02-domains` business logic'teki entity'leri template'lerdeki `{{Placeholder}}` değerleriyle eşleştirir
2. **Template Expansion:** Template'leri kopyalar, placeholder'ları doldurur
3. **Domain-Specific Logic:** Business logic'teki workflow'ları, validasyonları ve iş kurallarını koda yansıtır
4. **Write Output:** Oluşturulan dosyaları `07-workspaces/` altına yazar

**Placeholder → Değer Eşleştirme Örneği:**

| Template Placeholder | Kaynak | Örnek Değer |
|---------------------|--------|-------------|
| `{{ProjectName}}` | Proje adı | `ECommerceApp` |
| `{{ModelName}}` | Domain entity | `Product` |
| `{{modelName}}` | Domain entity (camelCase) | `product` |
| `{{HumanReadableName}}` | Entity açıklaması | `Ürünler` |
| `{{DomainName}}` | Domain klasör adı | `ecommerce` |

### Adım 7: Infrastructure Uygula

`03-infrastructures` katmanındaki blueprint'leri uygula. Bu, projenin production-ready olması için gerekli tüm altyapıyı oluşturur:
- Dockerfile (multi-stage, non-root, healthcheck)
- docker-compose.yaml
- CI/CD pipeline (GitHub Actions)
- Monitoring konfigürasyonu (Prometheus + Grafana + Loki)
- Nginx reverse proxy
- Secrets yönetimi (.env.example, .gitignore)

### Adım 8: Validate

Oluşturulan projenin manifest → rules → templates zincirine uygunluğunu kontrol et:

- [ ] Tüm `{{Placeholder}}` değerleri değiştirilmiş mi?
- [ ] Versiyonlar `versions.json` ile uyumlu mu?
- [ ] ZORUNLU kuralların hiçbiri ihlal edilmemiş mi?
- [ ] Manifest'te tanımlanan dizin yapısına uyulmuş mu?
- [ ] Paired backend gerekiyorsa oluşturulmuş mu?
- [ ] CC-001 - CC-007 arası tüm cross-cutting infrastructure kuralları uygulanmış mı?
- [ ] Deal breaker'lardan hiçbiri mevcut değil mi?

## STACK SEÇİM TABLOSU

AI, proje tipine göre aşağıdaki tablodan uygun stack'i seçer:

| Proje Tipi | Frontend Stack | Backend Stack | Deployment |
|-----------|---------------|---------------|------------|
| Kurumsal / Landing Page | astrojs | — (yok) | Vercel |
| Haber / Dergi | astrojs | node-express | Vercel |
| E-Ticaret (tam) | nuxtjs | netwebapi | Vercel + Azure |
| SaaS / CRM | nuxtjs | netwebapi | Vercel + Azure |
| LMS / Booking | nuxtjs | netwebapi | Vercel + Azure |
| Admin Panel | netblazor | netwebapi | Azure |
| Mobil Uygulama (.NET) | netmaui | netwebapi | App Store + Azure |
| Mobil Uygulama (RN) | react-native | netwebapi | App Store + Azure |
| Next.js Projesi | nextjs | netwebapi | Vercel + Azure |

## PLACEHOLDER KONVANSİYONLARI

Template dosyalarında aşağıdaki placeholder formatları kullanılır:

### Case Formatları

| Format | Placeholder | Örnek Çıktı |
|--------|------------|-------------|
| PascalCase | `{{ProjectName}}` | `ECommerceApp` |
| camelCase | `{{projectName}}` | `ecommerceApp` |
| kebab-case | `{{project-name}}` | `ecommerce-app` |
| snake_case | `{{project_name}}` | `ecommerce_app` |
| SCREAMING_SNAKE | `{{PROJECT_NAME}}` | `ECOMMERCE_APP` |

### Domain Entity Placeholder'ları

| Placeholder | Anlamı | Kaynak |
|------------|--------|--------|
| `{{ModelName}}` | Entity adı (PascalCase) | 02-domains business-logic.md |
| `{{modelName}}` | Entity adı (camelCase) | 02-domains business-logic.md |
| `{{model-name}}` | Entity adı (kebab-case) | 02-domains business-logic.md |
| `{{model_names}}` | Entity adı çoğul (snake_case) | 02-domains business-logic.md |
| `{{HumanReadableName}}` | İnsan tarafından okunabilir ad | Entity açıklaması |
| `{{Description}}` | Entity açıklaması (Türkçe) | Business logic |
| `{{DomainName}}` | Domain adı (PascalCase) | 02-domains klasör adı |

### Infrastructure Placeholder'ları (03-infrastructures ile ortak)

| Placeholder | Örnek | Kaynak |
|------------|-------|--------|
| `{PROJECT_NAME}` | `ecommerce-app` | Proje adı |
| `{DOMAIN}` | `example.com` | Kullanıcı girdisi |
| `{FRONTEND_PORT}` | `3000` | Stack manifesti |
| `{BACKEND_PORT}` | `5000` | Stack manifesti |
| `{DB_TYPE}` | `mssql` / `postgresql` | Stack manifesti |

## CROSS-CUTTING RULES

Tüm stack'lerde geçerli 7 genel kural:

| ID | Kural | Severity |
|----|-------|----------|
| AS-001 | Tüm `{{Placeholder}}` değerleri değiştirilmelidir | ZORUNLU |
| AS-002 | Tüm `_meta` açıklamaları korunmalıdır | ZORUNLU |
| AS-003 | Versiyonlar `00-registry/versions.json`'dan okunur | ZORUNLU |
| AS-004 | Business logic entity'leri placeholder'ları belirler | ZORUNLU |
| AS-005 | `03-infrastructures` kuralları her stack için geçerlidir | ZORUNLU |
| AS-006 | Template'ler başlangıç noktasıdır, bitiş noktası değildir | ÖNEMLİ |
| AS-007 | Her stack'in kendi agent'ı vardır | ÖNEMLİ |

## DEAL BREAKERS

Bunlardan herhangi biri varsa, AI'nın ürettiği proje referans mimariye uygun DEĞİLDİR:

1. ❌ Template dosyasında `{{Placeholder}}` bırakılmış
2. ❌ Versiyon numarası `00-registry/versions.json`'dan farklı
3. ❌ ZORUNLU bir kural ihlal edilmiş
4. ❌ Manifest'te tanımlanmayan bir dosya yapısı kullanılmış
5. ❌ Stack'in `paired_backend` gerektirmesine rağmen backend oluşturulmamış
6. ❌ Deployment target manifest'tekinden farklı seçilmiş
7. ❌ Dizin yapısı manifest'teki `directory_structure` ile uyuşmuyor
8. ❌ Cross-cutting rules (AS-001 - AS-007) ihlal edilmiş
9. ❌ 03-infrastructures cross-cutting rules (CC-001 - CC-007) uygulanmamış
10. ❌ Business logic entity'leri template'lere doğru yansıtılmamış

## ENTEGRASYON NOKTALARI

04-apps katmanı diğer katmanlarla şu noktalarda entegre olur:

### 04-apps ↔ 00-registry
- `versions.json` → her stack'in manifest.json'unda `version` alanı buradan okunur
- AI, package.json / .csproj oluştururken sadece bu versiyonları kullanır

### 04-apps ↔ 02-domains
- `business-logic.md` → entity adları, template'lerdeki `{{ModelName}}` placeholder'ını belirler
- Domain workflow'ları → Controller/Service metodlarının içeriğini şekillendirir
- Validasyon kuralları → FluentValidation / Joi schema'larını belirler

### 04-apps ↔ 03-infrastructures
- `docker/manifest.json` → Hangi Dockerfile template'inin kullanılacağını belirler
- `ci-cd/manifest.json` → Deployment target'ını belirler (Vercel vs Azure)
- `secrets/manifest.json` → Hangi `.env.example` template'inin kullanılacağını belirler
- `networking/manifest.json` → Reverse proxy yapılandırmasını belirler
- `monitoring/manifest.json` → Hangi monitoring stack'inin ekleneceğini belirler

## ÖZET

Bu katman, AI'nın bir projeyi sıfırdan üretmesi için gereken tüm referans mimari bilgisini içerir. AI, bu katmandaki manifest → rules → templates zincirini takip ederek:

1. Hangi stack'lerin mevcut olduğunu bilir (manifest)
2. Her stack'te neyi yapıp neyi yapamayacağını bilir (rules)
3. Çıktıyı doğru formatta ve yapıda üretir (templates)
4. Domain logic ile kodu eşleştirir (mapping)
5. Production-ready altyapıyı uygular (integration with 03-infrastructures)

Her şey tek bir hedefe hizmet eder: **AI'nın, bir iş mantığı tanımından yola çıkarak, production-ready, best practice'lere uygun, tam teşekküllü bir proje üretebilmesi.**
