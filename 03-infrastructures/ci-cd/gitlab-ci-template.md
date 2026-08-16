<!--
  BU DOSYANIN AMACI:
  AI ajanlarına GitLab CI pipeline şablonu sunar. GitHub Actions alternatifi olarak kullanılır.
  Proje GitLab'da host ediliyorsa AI bu şablonu seçer.
-->

# GITLAB CI PIPELINE TEMPLATE

Dosya yolu: `.gitlab-ci.yml`

```yaml
# GitLab CI/CD Pipeline
# Bu dosya AI tarafından proje konfigürasyonuna göre özelleştirilir.

stages:
  - lint
  - build
  - test
  - deploy

variables:
  NODE_VERSION: "20"
  DOTNET_VERSION: "8.0"

# =============================================================================
# CACHE (Tüm job'lar için ortak)
# =============================================================================
.npm_cache: &npm_cache
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
      - .npm/
    policy: pull-push

.nuget_cache: &nuget_cache
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - ~/.nuget/packages/
    policy: pull-push

# =============================================================================
# LINT STAGE
# =============================================================================
lint:
  stage: lint
  image: {BUILD_IMAGE}
  <<: *{CACHE_REF}
  script:
    - {INSTALL_CMD}
    - {LINT_CMD}
  only:
    - merge_requests
    - branches

# =============================================================================
# BUILD STAGE
# =============================================================================
build:
  stage: build
  image: {BUILD_IMAGE}
  <<: *{CACHE_REF}
  script:
    - {INSTALL_CMD}
    - {BUILD_CMD}
  artifacts:
    paths:
      - {BUILD_OUTPUT_PATH}
    expire_in: 7 days
  only:
    - merge_requests
    - branches
    - main
    - develop

# =============================================================================
# TEST STAGE
# =============================================================================
test:
  stage: test
  image: {BUILD_IMAGE}
  <<: *{CACHE_REF}
  script:
    - {INSTALL_CMD}
    - {TEST_CMD}
  artifacts:
    when: always
    paths:
      - {TEST_RESULTS_PATH}
    expire_in: 30 days
  only:
    - merge_requests
    - branches

# =============================================================================
# DEPLOY STAGING
# =============================================================================
deploy_staging:
  stage: deploy
  image: {DEPLOY_IMAGE}
  script:
    - {DEPLOY_STAGING_CMD}
  environment:
    name: staging
    url: {STAGING_URL}
  only:
    - develop
  when: manual

# =============================================================================
# DEPLOY PRODUCTION
# =============================================================================
deploy_production:
  stage: deploy
  image: {DEPLOY_IMAGE}
  script:
    - {DEPLOY_PRODUCTION_CMD}
  environment:
    name: production
    url: {PRODUCTION_URL}
  only:
    - main
  when: manual
```

## PLACEHOLDER DEĞERLERİ

| Placeholder | Node.js Projesi | .NET Projesi |
|-------------|-----------------|--------------|
| `{BUILD_IMAGE}` | `node:20-alpine` | `mcr.microsoft.com/dotnet/sdk:8.0` |
| `{CACHE_REF}` | `npm_cache` | `nuget_cache` |
| `{INSTALL_CMD}` | `npm ci` | `dotnet restore` |
| `{LINT_CMD}` | `npm run lint` | `dotnet format --verify-no-changes` |
| `{BUILD_CMD}` | `npm run build` | `dotnet build -c Release --no-restore` |
| `{TEST_CMD}` | `npm run test` | `dotnet test -c Release --no-build` |
| `{BUILD_OUTPUT_PATH}` | `dist/` | `src/*/bin/Release/net8.0/` |
| `{TEST_RESULTS_PATH}` | `coverage/` | `**/TestResults/` |
| `{DEPLOY_IMAGE}` | `node:20-alpine` | `mcr.microsoft.com/azure-cli:latest` |
| `{STAGING_URL}` | Proje staging URL'i | Proje staging URL'i |
| `{PRODUCTION_URL}` | Proje production URL'i | Proje production URL'i |
