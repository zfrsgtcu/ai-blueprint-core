<!--
  BU DOSYANIN AMACI:
  Microsoft SQL Server entegrasyonunun doğru konfigürasyonunu, connection string güvenliğini ve .NET/Node.js client kullanımını AI'a öğretir.
-->

# MSSQL CONFIGURATION RULES

## 1. CLIENT SEÇİMİ

| Ekosistem | Paket | Kullanım |
|-----------|-------|----------|
| Node.js | `mssql` (tedious driver) | Bağımsız, hafif |
| Node.js + ORM | `prisma` + `datasource sqlserver` | Tip güvenli, migration |
| Node.js + Query Builder | `knex` + `mssql` dialect | Raw SQL odaklı |
| .NET | `Microsoft.Data.SqlClient` | Native, en hızlı |
| .NET + ORM | `Entity Framework Core` + `UseSqlServer` | Tam ORM |

## 2. NODE.JS KURULUMU

### 2.1. mssql Paketi

```bash
npm install mssql
```

```ts
import sql from 'mssql';

const config: sql.config = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_SERVER,
  database: process.env.MSSQL_DATABASE,
  options: {
    encrypt: true,       // Azure için ZORUNLU, on-premise için önerilen
    trustServerCertificate: false, // Production'da ASLA true olmamalı
    connectionTimeout: 15000,
    requestTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Connection Pool
const pool = await sql.connect(config);
const result = await pool.request()
  .input('email', sql.NVarChar, email)
  .query('SELECT * FROM users WHERE email = @email');
```

### 2.2. Connection String Formatı

```
# SQL Server Authentication
Server=localhost,1433;Database=AppDb;User Id=app_user;Password=StrongP@ss;Encrypt=yes;TrustServerCertificate=no;

# Windows Authentication (on-premise)
Server=localhost;Database=AppDb;Trusted_Connection=true;Encrypt=yes;TrustServerCertificate=no;

# Azure SQL Database
Server=tcp:myserver.database.windows.net,1433;Database=AppDb;User Id=app_user;Password=StrongP@ss;Encrypt=yes;Authentication=ActiveDirectoryPassword;
```

## 3. PRISMA + MSSQL KONFİGÜRASYONU

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
  // DATABASE_URL="sqlserver://localhost:1433;database=AppDb;user=app_user;password=StrongP@ss;encrypt=true;trustServerCertificate=false"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now()) @map("created_at")

  @@map("users")
}
```

**MSSQL'de `@id @default(autoincrement())` IDENTITY sütunu oluşturur.**

## 4. .NET + ENTITY FRAMEWORK CORE

```csharp
// Program.cs
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=AppDb;Trusted_Connection=true;TrustServerCertificate=yes;"
  }
}
```

## 5. GÜVENLİK KURALLARI (ZORUNLU)

### 5.1. SQL Injection Önleme

```ts
// KÖTÜ: Template literal ile sorgu
const query = `SELECT * FROM users WHERE name = '${userInput}'`;
// BU ASLA YAPILMAZ

// İYİ: Parametreli sorgu
const result = await pool.request()
  .input('name', sql.NVarChar, userInput)
  .query('SELECT * FROM users WHERE name = @name');

// prisma'da otomatik parametreli
const user = await prisma.user.findFirst({ where: { name: userInput } });
```

### 5.2. Connection String Güvenliği

- Connection string ASLA kodda hard-coded olmamalı
- `TrustServerCertificate=true` sadece DEVELOPMENT'da
- Production'da her zaman `Encrypt=true`
- App Service / Azure SQL'de Managed Identity kullan

## 6. MİGRASYON YÖNETİMİ

```bash
# Prisma (Node.js)
npx prisma migrate dev --name init  # Dev
npx prisma migrate deploy           # Production

# EF Core (.NET)
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## 7. YAPILMAMASI GEREKENLER

- **Production'da `TrustServerCertificate=true`** — Man-in-the-middle saldırısına açık
- **Raw SQL'de string interpolation** — SQL injection riski
- **Connection string'i frontend'de expose etme** — Sunucu tarafında kalmalı
- **`sa` hesabı kullanma** — Her uygulama için ayrı düşük yetkili kullanıcı
- **Production'da `prisma db push`** — Migration geçmişi kaybolur
