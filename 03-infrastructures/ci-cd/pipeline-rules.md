<!--
  BU DOSYANIN AMACI:
  AI ajanlarına CI/CD pipeline oluşturma kurallarını öğretir.
  Her infrastructure ve deployment target kombinasyonu için farklı pipeline stratejileri içerir.
  AI bu kurallara göre .github/workflows/*.yml veya .gitlab-ci.yml dosyalarını üretir.
-->

# CI/CD PIPELINE RULES

## 1. GENEL PRENSİPLER (TÜM PLATFORMLAR İÇİN)

### Pipeline Tetikleyicileri
- **Push**: Tüm branch'lere push yapıldığında CI çalışır
- **Pull Request**: main/master ve develop branch'lerine PR açıldığında CI çalışır
- **Schedule**: Her gece 03:00'te full test suite (opsiyonel)
- **Manual**: Production deploy her zaman manuel onay gerektirir

### Multi-Environment Stratejisi
```
Development: Her push → Lint + Build + Unit Test + Auto Deploy to Dev
Staging:     Merge to develop → Lint + Build + Unit Test + Integration Test + Auto Deploy to Staging
Production:  Merge to main → Tüm testler + Manuel Approval + Deploy to Production
```

### Cache Stratejisi (ZORUNLU)
Build süresini kısaltmak için bağımlılıklar cache'lenmelidir:
- **npm**: `~/.npm` veya `node_modules` cache
- **NuGet**: `~/.nuget/packages` cache
- **Docker**: BuildKit cache veya layer caching

## 2. GITHUB ACTIONS KURALLARI

### Workflow Dosya Yapısı
```
.github/
└── workflows/
    ├── ci.yml              # Tüm branch'ler için CI (lint + build + test)
    ├── deploy-staging.yml  # develop branch'inden staging'e deploy
    └── deploy-production.yml # main branch'inden production'a deploy (manuel onaylı)
```

### CI Workflow (ci.yml) — Zorunlu Adımlar

```yaml
name: CI
on:
  push:
    branches: ['**']
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - [Dil/Framework setup]
      - [Bağımlılık cache restore]
      - run: [lint komutu]

  build:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - [Dil/Framework setup]
      - [Bağımlılık cache restore]
      - [Bağımlılık yükleme]
      - run: [build komutu]

  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - [Test ortamı hazırlığı]
      - run: [test komutu]
```

### Deployment Workflow — Zorunlu Environment Koruması

```yaml
deploy:
  needs: test
  runs-on: ubuntu-latest
  environment:
    name: production
    url: https://{PROJECT_URL}
  steps:
    - [Deploy adımları]
```

### Secret Yönetimi
- TÜM secret'lar `${{ secrets.SECRET_NAME }}` sözdizimiyle kullanılır
- Workflow dosyasına ASLA secret yazılmaz
- Environment-specific secret'lar environment scope ile tanımlanır
- Production secret'ları için ortam koruma kuralları (environment protection rules) etkinleştirilir

## 3. DEPLOYMENT TARGET'A GÖRE KURALLAR

### Vercel Deployment
- Frontend projeleri için varsayılan hedef
- `vercel.json` ile konfigürasyon
- Preview deployment: Her PR için otomatik preview URL
- Production: main branch merge → otomatik deploy
- Environment variables: Vercel Dashboard veya CLI (`vercel env add`)

### Azure App Service Deployment
- .NET backend projeleri için varsayılan hedef
- Azure CLI veya `azure/webapps-deploy@v2` action kullanılır
- Deployment slot: staging + production swap
- Connection string'ler Azure Key Vault'tan alınır

### Azure Container Apps Deployment
- Containerized deployment için
- ACR'ye push → Container Apps'e deploy
- Revision management ve traffic splitting

## 4. DİL/FRAMEWORK'A GÖRE SPESİFİK KURALLAR

### .NET Web API
```yaml
- name: Setup .NET
  uses: actions/setup-dotnet@v4
  with:
    dotnet-version: '8.0.x'

- name: Restore dependencies
  run: dotnet restore

- name: Build
  run: dotnet build --configuration Release --no-restore

- name: Test
  run: dotnet test --configuration Release --no-build --verbosity normal
```

### Node.js (Nuxt.js / Next.js / Astro.js)
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'

- name: Install dependencies
  run: npm ci

- name: Lint
  run: npm run lint

- name: Build
  run: npm run build

- name: Test
  run: npm run test
```

## 5. YAYGIN HATALAR (AI'NIN KAÇINMASI GEREKENLER)

1. ❌ Workflow dosyasına secret/API key yazmak
2. ❌ Production deploy'da manuel approval (environment protection) eksikliği
3. ❌ Test aşamasını atlayıp direkt deploy etmek
4. ❌ Cache kullanmamak (her seferinde tüm bağımlılıkları indirmek)
5. ❌ `npm install` kullanmak (CI'da `npm ci` kullanılmalı)
6. ❌ Aynı branch'de birden fazla workflow çalıştırmak (`cancel-in-progress` yok)
7. ❌ Environment URL'ini tanımlamamak
8. ❌ Deployment sonrası healthcheck eksikliği
