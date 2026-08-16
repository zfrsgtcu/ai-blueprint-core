<!--
  BU DOSYANIN AMACI:
  Prisma ORM için veritabanı bağlantı bilgilerinin güvenli yönetimini, environment variable stratejisini ve secret rotation yöntemlerini AI'a öğretir.

  İLGİLİ DOSYALAR:
  - 04-frameworks/prisma/config-rules.md
  - 04-frameworks/prisma/best-practices.md
  - 03-infrastructures/secrets/
-->

# SECRETS + PRISMA ENTEGRASYONU

## 1. DATABASE URL GÜVENLİĞİ

```env
# .env (DEVELOPMENT, gitignore'a EKLE):
DATABASE_URL=postgresql://postgres:devpassword@localhost:5432/devdb

# .env.example (GIT'E COMMIT EDİLEBİLİR):
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
```

```bash
# .gitignore'da ZORUNLU:
.env
.env.*
!.env.example
```

## 2. PRODUCTION SECRET YÖNETİMİ

### 2.1. Environment Variable (Basit)

```ts
// prisma.ts — Singleton client:
import { PrismaClient } from '@prisma/client';

// Zod ile runtime validasyon:
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),  // Migration için ayrı URL (connection pool bypass)
});

const env = envSchema.parse(process.env);

const prisma = new PrismaClient({
  datasources: {
    db: { url: env.DATABASE_URL },
  },
});
```

### 2.2. Vault Entegrasyonu (Gelişmiş)

```ts
// HashiCorp Vault veya Azure Key Vault'tan DB URL'yi al:
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

async function getDatabaseUrl(): Promise<string> {
  // Azure Key Vault:
  const credential = new DefaultAzureCredential();
  const client = new SecretClient('https://myapp-vault.vault.azure.net', credential);
  const secret = await client.getSecret('DATABASE-URL');
  return secret.value!;
}

// VEYA HashiCorp Vault:
// import vault from 'node-vault';
// const { data } = await vault.read('database/creds/app');
// const url = `postgresql://${data.username}:${data.password}@host:5432/db`;
```

## 3. CONNECTION STRING ŞİFRELEME

```ts
// Hassas bileşenleri ayır (opsiyonel, sadece yüksek güvenlikli ortamlar):
function buildDatabaseUrl(): string {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || '5432';
  const database = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;  // Secret manager'dan gelir

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}
```

## 4. CI/CD'DE SECRET YÖNETİMİ

```yaml
# GitHub Actions:
jobs:
  test:
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}  # GitHub Secrets'tan
    steps:
      - run: npx prisma migrate deploy

  deploy:
    environment: production
    env:
      DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
    steps:
      - run: npx prisma migrate deploy
```

## 5. MIGRATION SIRASINDA GÜVENLİK

```bash
# Migration çalıştıran kullanıcıya asla superuser yetkisi verme:
# Geliştirme: full access
DATABASE_URL=postgresql://dev_user:password@localhost:5432/devdb

# Production migration: sadece schema değişikliği yetkisi
DATABASE_URL=postgresql://migration_user:password@production-host:5432/proddb
# migration_user: CREATE TABLE, ALTER TABLE, DROP TABLE yetkisi var
# ama SELECT, INSERT, UPDATE, DELETE YOK (veriye erişemez)
```

## 6. SECRET ROTATION

```ts
// Veritabanı şifresi değiştiğinde client'ı yeniden başlat:
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

let prismaClient: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }
  return prismaClient;
}

export async function rotateDatabaseCredentials(newUrl: string): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
  }
  process.env.DATABASE_URL = newUrl;
  prismaClient = new PrismaClient();
  await prismaClient.$connect();
}
```

## 7. YAPILMAMASI GEREKENLER

- **`.env` dosyasını git'e commit etme** — `.gitignore`'da olduğundan emin ol
- **Production DATABASE_URL'ini kodda hardcode** — Her zaman environment variable veya vault
- **Migration user'a SELECT/INSERT yetkisi verme** — Sadece DDL yetkileri yeterli
- **Connection string'de `?sslmode=disable` kullanma** — Production'da `?sslmode=require` ZORUNLU
- **Shadow database URL'ini atlama** — `shadowDatabaseUrl` Prisma Migrate için gereklidir (özellikle cloud DB'lerde)
