<!--
  BU DOSYANIN AMACI:
  Prisma ORM'in CI/CD pipeline'larında migration, type generation ve test stratejilerini AI'a öğretir.

  İLGİLİ DOSYALAR:
  - 04-frameworks/prisma/config-rules.md
  - 04-frameworks/prisma/best-practices.md
  - 03-infrastructures/ci-cd/
-->

# CI/CD + PRISMA ENTEGRASYONU

## 1. GITHUB ACTIONS TEMEL İŞ AKIŞI

```yaml
name: CI
on: [push, pull_request]

jobs:
  prisma:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test123
          POSTGRES_DB: testdb
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    env:
      DATABASE_URL: postgresql://postgres:test123@localhost:5432/testdb

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma migrate deploy
      - run: npm test
```

## 2. MIGRATION STRATEJİSİ

### 2.1. Geliştirme Branch'leri (PR'lar)

```yaml
# PR açıldığında:
- name: Check migration
  run: |
    npx prisma migrate diff \
      --from-schema prisma/schema.prisma \
      --to-migrations prisma/migrations \
      --exit-code
  # Exit code 2: migration eksik → PR fail
```

### 2.2. Production Deployment

```yaml
# Production deploy iş akışı:
deploy:
  needs: [test, build]
  runs-on: ubuntu-latest
  environment: production  # Manuel onay gerektirir
  steps:
    - run: npx prisma migrate deploy  # SADECE deploy, diff DEĞİL
```

**Production'da migration otomatik çalıştırılmamalı, manuel onay mekanizması olmalı.**

## 3. PRISMA CLIENT CACHE

```yaml
- name: Cache Prisma Client
  uses: actions/cache@v4
  with:
    path: |
      node_modules/.prisma
      node_modules/@prisma
    key: prisma-${{ runner.os }}-${{ hashFiles('prisma/schema.prisma') }}
```

Her push'ta `prisma generate` 10-15 saniye sürer. Cache ile 1 saniyeye düşer.

## 4. TYPE SAFETY CHECK

```yaml
- name: Type check
  run: |
    npx prisma generate
    npx tsc --noEmit  # Prisma Client tipleri ile birlikte
```

## 5. TEST VERİTABANI STRATEJİSİ

```ts
// test-setup.ts — CI'da test DB'sini hazırla
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Test DB'sini sıfırla
  await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE');
  await prisma.$executeRawUnsafe('CREATE SCHEMA public');

  // Migration'ları uygula
  const { execSync } = require('child_process');
  execSync('npx prisma migrate deploy', { env: process.env });
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

## 6. YAPILMAMASI GEREKENLER

- **Production'da `prisma migrate dev`** — Interaktif prompt bekler, CI donar
- **Migration'ı test etmeden production'a push** — Her zaman staging'de test et
- **Prisma Client cache'leme** — Her build'de 10-15s kayıp
- **Migration hatasını CI'da görmezden gelme** — `continue-on-error: true` kullanma
- **Seed data'yı production'da çalıştırma** — `prisma db seed` sadece development/staging
