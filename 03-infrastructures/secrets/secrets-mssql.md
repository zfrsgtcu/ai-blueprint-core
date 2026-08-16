<!--
  BU DOSYANIN AMACI:
  MSSQL bağlantı bilgilerinin güvenli yönetimini, Windows Authentication vs SQL Authentication kararını ve production secret stratejisini AI'a öğretir.

  İLGİLİ DOSYALAR:
  - 04-frameworks/mssql/config-rules.md
  - 04-frameworks/mssql/best-practices.md
  - 03-infrastructures/secrets/
-->

# SECRETS + MSSQL ENTEGRASYONU

## 1. CONNECTION STRING GÜVENLİĞİ

### 1.1. SQL Authentication

```env
# Geliştirme:
MSSQL_CONNECTION=Server=localhost,1433;Database=DevDb;User Id=sa;Password=DevPass123!;TrustServerCertificate=True;

# Production:
MSSQL_CONNECTION=Server=tcp:myapp.database.windows.net,1433;Database=AppDb;User Id=appuser;Password=${MSSQL_PASSWORD};Encrypt=True;TrustServerCertificate=False;
```

### 1.2. Windows Authentication (Integrated Security)

```env
# On-premise .NET uygulaması:
MSSQL_CONNECTION=Server=localhost;Database=AppDb;Integrated Security=True;TrustServerCertificate=True;

# Domain account ile:
MSSQL_CONNECTION=Server=db-server;Database=AppDb;Integrated Security=True;User Id=DOMAIN\\AppUser;Password=${DOMAIN_PASSWORD};
```

## 2. AZURE KEY VAULT ENTEGRASYONU

```csharp
// Program.cs — .NET uygulaması:
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;

var builder = WebApplication.CreateBuilder(args);

// Azure Key Vault'tan connection string'i al:
var keyVaultUri = builder.Configuration["KeyVaultUri"];
var credential = new DefaultAzureCredential();
builder.Configuration.AddAzureKeyVault(
    new Uri(keyVaultUri!),
    credential
);

// Connection string artık appsettings.json'da DEĞİL, Key Vault'ta:
var connectionString = builder.Configuration.GetConnectionString("Default");
```

```json
// appsettings.json (SADECE Key Vault referansı, şifre YOK):
{
  "ConnectionStrings": {
    "Default": ""
  },
  "KeyVaultUri": "https://myapp-vault.vault.azure.net/"
}
```

## 3. ENVIRONMENT DEĞİŞKENİ VALİDASYONU

```ts
// Node.js tarafında:
import { z } from 'zod';

const envSchema = z.object({
  MSSQL_HOST: z.string(),
  MSSQL_PORT: z.coerce.number().default(1433),
  MSSQL_DATABASE: z.string(),
  MSSQL_USER: z.string(),
  MSSQL_PASSWORD: z.string().min(8, 'SQL şifresi en az 8 karakter olmalı'),
  MSSQL_ENCRYPT: z.enum(['true', 'false']).default('true'),
});

const env = envSchema.parse(process.env);
```

## 4. CONNECTION STRING BUILDER

```ts
import sql from 'mssql';

function buildConfig(): sql.config {
  return {
    server: process.env.MSSQL_HOST!,
    port: Number(process.env.MSSQL_PORT) || 1433,
    database: process.env.MSSQL_DATABASE!,
    user: process.env.MSSQL_USER!,
    password: process.env.MSSQL_PASSWORD!,  // Sadece runtime'da string olarak var
    options: {
      encrypt: process.env.MSSQL_ENCRYPT !== 'false',
      trustServerCertificate: process.env.NODE_ENV !== 'production',
    },
  };
}

// Hiçbir yerde config string'ini loglama:
console.log('SQL bağlantısı:', process.env.MSSQL_HOST); // SADECE host
// console.log(config); // KESİNLİKLE YAPMA — şifre loglanır
```

## 5. MINIMUM PERMISSION PRENSİBİ

```sql
-- App kullanıcısına sadece gerekli yetkileri ver:
CREATE LOGIN app_user WITH PASSWORD = 'StrongPass123!';
CREATE USER app_user FOR LOGIN app_user;

-- Sadece gerekli izinler:
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO app_user;
GRANT EXECUTE ON SCHEMA::dbo TO app_user;  -- Stored procedure'ler için

-- Migration user'ına DDL yetkisi (ayrı kullanıcı):
CREATE LOGIN migration_user WITH PASSWORD = 'AnotherStrongPass!';
CREATE USER migration_user FOR LOGIN migration_user;
GRANT ALTER, CREATE TABLE, CREATE PROCEDURE TO migration_user;
-- migration_user SELECT yapamaz (veriye erişemez)
```

## 6. YAPILMAMASI GEREKENLER

- **SA kullanıcısıyla production bağlantısı** — App'e özel login oluştur
- **Connection string'de `Password=...` hardcode** — Her zaman environment variable veya Key Vault
- **App kullanıcısına sysadmin yetkisi** — Minimum yetki prensibi
- **Loglarda connection string basma** — PII/Security ihlali
- **Development şifresini production'da kullanma** — Her ortam için ayrı şifre
