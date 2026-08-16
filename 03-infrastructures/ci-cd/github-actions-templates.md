<!--
  BU DOSYANIN AMACI:
  AI ajanlarına GitHub Actions workflow şablonları sunar.
  AI, projenin infrastructure ve deployment target'ına göre uygun şablonu seçer.
  Tüm {PLACEHOLDER} değerleri AI tarafından gerçek proje değerleriyle değiştirilir.
-->

# GITHUB ACTIONS WORKFLOW TEMPLATES

## Template 1: CI Workflow (Tüm Projeler İçin)

Dosya yolu: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main, develop]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      {SETUP_STEP}

      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: {CACHE_PATH}
          key: {CACHE_KEY}
          restore-keys: {CACHE_RESTORE_KEYS}

      - name: Install dependencies
        run: {INSTALL_CMD}

      - name: Run linter
        run: {LINT_CMD}

  build:
    name: Build
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      {SETUP_STEP}

      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: {CACHE_PATH}
          key: {CACHE_KEY}
          restore-keys: {CACHE_RESTORE_KEYS}

      - name: Install dependencies
        run: {INSTALL_CMD}

      - name: Build
        run: {BUILD_CMD}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: {BUILD_OUTPUT_PATH}
          retention-days: 7

  test:
    name: Test
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      {SETUP_STEP}

      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: {CACHE_PATH}
          key: {CACHE_KEY}
          restore-keys: {CACHE_RESTORE_KEYS}

      - name: Install dependencies
        run: {INSTALL_CMD}

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: {BUILD_OUTPUT_PATH}

      - name: Run tests
        run: {TEST_CMD}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: {TEST_RESULTS_PATH}
          retention-days: 30
```

### PLACEHOLDER DEĞERLERİ

| Placeholder | Node.js Projesi | .NET Projesi |
|-------------|-----------------|--------------|
| `{SETUP_STEP}` | `uses: actions/setup-node@v4` + `node-version: '20'` + `cache: 'npm'` | `uses: actions/setup-dotnet@v4` + `dotnet-version: '8.0.x'` |
| `{CACHE_PATH}` | `~/.npm` | `~/.nuget/packages` |
| `{CACHE_KEY}` | `npm-${{ hashFiles('**/package-lock.json') }}` | `nuget-${{ hashFiles('**/*.csproj') }}` |
| `{CACHE_RESTORE_KEYS}` | `npm-` | `nuget-` |
| `{INSTALL_CMD}` | `npm ci` | `dotnet restore` |
| `{LINT_CMD}` | `npm run lint` | `dotnet format --verify-no-changes` |
| `{BUILD_CMD}` | `npm run build` | `dotnet build --configuration Release --no-restore` |
| `{BUILD_OUTPUT_PATH}` | `dist/` veya `.output/` | `src/{ProjectName}/bin/Release/net8.0/` |
| `{TEST_CMD}` | `npm run test` | `dotnet test --configuration Release --no-build --verbosity normal` |
| `{TEST_RESULTS_PATH}` | `coverage/` | `**/TestResults/*.trx` |

---

## Template 2: Vercel Deploy Workflow

Dosya yolu: `.github/workflows/deploy-vercel.yml`

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: ${{ github.ref == 'refs/heads/main' && 'production' || 'preview' }}
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        id: deploy
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ github.ref == 'refs/heads/main' && '--prod' || '' }}
          working-directory: {FRONTEND_DIR}
```

---

## Template 3: Azure App Service Deploy Workflow (.NET Backend)

Dosya yolu: `.github/workflows/deploy-azure.yml`

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]
  workflow_dispatch:  # Manuel tetikleme

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://{AZURE_APP_NAME}.azurewebsites.net
    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'

      - name: Restore dependencies
        run: dotnet restore

      - name: Build
        run: dotnet build --configuration Release --no-restore

      - name: Publish
        run: dotnet publish {PROJECT_PATH} -c Release -o ${{ runner.temp }}/publish

      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: {AZURE_APP_NAME}
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
          package: ${{ runner.temp }}/publish
```

---

## Template 4: Docker Build + Push + Deploy Workflow

Dosya yolu: `.github/workflows/deploy-docker.yml`

```yaml
name: Build and Deploy Docker

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  docker:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: {REGISTRY_URL}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: {DOCKER_CONTEXT}
          file: {DOCKERFILE_PATH}
          push: true
          tags: |
            {REGISTRY_URL}/{IMAGE_NAME}:latest
            {REGISTRY_URL}/{IMAGE_NAME}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy to Azure Container Apps
        uses: azure/container-apps-deploy-action@v1
        with:
          containerAppName: {CONTAINER_APP_NAME}
          resourceGroup: {RESOURCE_GROUP}
          imageToDeploy: {REGISTRY_URL}/{IMAGE_NAME}:${{ github.sha }}
          azureCredentials: ${{ secrets.AZURE_CREDENTIALS }}
```

---

## AI KULLANIM KURALLARI

1. Projenin deployment target'ına göre doğru template'i seç:
   - **Vercel**: Static veya SSR frontend projeleri (Astro.js, Nuxt.js, Next.js)
   - **Azure App Service**: .NET Web API backend
   - **Azure Container Apps**: Containerized deployment gerektiren projeler
   - **Hybrid**: Frontend Vercel + Backend Azure (iki ayrı workflow dosyası)

2. `ci.yml` HER projede zorunludur.

3. Production deploy workflow'unda `environment: production` tanımı zorunludur.

4. TÜM `{PLACEHOLDER}` değerlerini gerçek proje değerleriyle değiştir:
   - `{PROJECT_NAME}` → proje adı (kebab-case)
   - `{FRONTEND_DIR}` → frontend kaynak dizini (örn: `./frontend` veya `./`)
   - `{AZURE_APP_NAME}` → Azure'da tanımlı uygulama adı
   - `{REGISTRY_URL}` → container registry URL'i

5. Secret'ları tanımlarken GitHub Secrets kullanımını belgele (README'ye veya setup dokümanına ekle).
