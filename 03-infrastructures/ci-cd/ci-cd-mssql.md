<!--
  BU DOSYANIN AMACI:
  MSSQL'in CI/CD pipeline'larında test veritabanı sağlama, migration deploy ve .NET build stratejilerini AI'a öğretir.

  İLGİLİ DOSYALAR:
  - 04-frameworks/mssql/config-rules.md
  - 04-frameworks/mssql/best-practices.md
  - 03-infrastructures/ci-cd/
-->

# CI/CD + MSSQL ENTEGRASYONU

## 1. GITHUB ACTIONS İLE MSSQL

```yaml
name: .NET + MSSQL CI
on: [push, pull_request]

jobs:
  build-test:
    runs-on: ubuntu-latest
    services:
      mssql:
        image: mcr.microsoft.com/mssql/server:2022-latest
        env:
          ACCEPT_EULA: "Y"
          MSSQL_SA_PASSWORD: "TestPass123!"
          MSSQL_PID: Developer
        options: >-
          --health-cmd="/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P TestPass123! -C -Q 'SELECT 1'"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=10
          --health-start-period=30s
        ports:
          - 1433:1433

    env:
      ConnectionStrings__Default: Server=localhost,1433;Database=TestDb;User Id=sa;Password=TestPass123!;TrustServerCertificate=True;

    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0'

      - name: Create test database
        run: |
          /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P TestPass123! -C -Q "CREATE DATABASE TestDb"

      - name: Run EF Core migrations
        run: dotnet ef database update --project src/Infrastructure

      - name: Run tests
        run: dotnet test --collect:"XPlat Code Coverage"
```

## 2. MIGRATION STRATEJİSİ

### 2.1. EF Core Migration (Development)

```bash
# Yeni migration oluştur (development):
dotnet ef migrations add AddCustomerTable

# Migration'ı veritabanına uygula:
dotnet ef database update
```

### 2.2. Idempotent Script (Production)

```bash
# SQL script oluştur (idempotent):
dotnet ef migrations script --idempotent -o ./migrations/production.sql

# Bu script'i CI'dan manuel onayla çalıştır:
sqlcmd -S production-server -U appuser -P $DB_PASSWORD -d AppDb -i ./migrations/production.sql
```

## 3. NODE.JS + MSSQL CI (Prisma / mssql)

```yaml
name: Node.js + MSSQL CI
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mssql:
        image: mcr.microsoft.com/mssql/server:2022-latest
        env:
          ACCEPT_EULA: "Y"
          MSSQL_SA_PASSWORD: "TestPass123!"
        ports:
          - 1433:1433

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: |
          # MSSQL tools kur
          curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
          curl https://packages.microsoft.com/config/ubuntu/22.04/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list
          sudo apt-get update
          sudo ACCEPT_EULA=Y apt-get install -y mssql-tools18

      - run: npm ci
      - run: npm test
```

## 4. TEST VERİTABANI (Node.js)

```ts
// test-helper.ts
import sql from 'mssql';

const config = {
  server: 'localhost',
  port: 1433,
  user: 'sa',
  password: 'TestPass123!',
  options: { trustServerCertificate: true },
};

beforeAll(async () => {
  const pool = await sql.connect(config);
  await pool.request().query('CREATE DATABASE TestDb');
  await pool.close();
});

afterAll(async () => {
  const pool = await sql.connect({ ...config, database: 'TestDb' });
  await pool.request().query('USE master; ALTER DATABASE TestDb SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE TestDb;');
  await pool.close();
});
```

## 5. CI/CD Pipeline Adımları (Tam)

```yaml
# 1. Build → 2. Unit Test → 3. Integration Test → 4. Staging Deploy → 5. E2E Test → 6. Manual Approval → 7. Production Deploy
stages:
  - build
  - test
  - staging
  - production  # Environment protection ile manuel onay
```

## 6. YAPILMAMASI GEREKENLER

- **CI'da `dotnet ef database update` ile production DB'ye dokunma** — Script oluştur, manuel çalıştır
- **MSSQL container'ı 30 saniyeden az bekleme** — SQL Server başlangıcı yavaş, start_period: 30s minimum
- **Test DB'sini temizlememe** — Her test çalışması temiz DB ile başlamalı
- **EF Core migration'ı otomatik production'a deploy** — Her zaman idempotent script + manuel onay
