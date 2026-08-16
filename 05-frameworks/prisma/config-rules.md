<!--
  BU DOSYANIN AMACI:
  Prisma ORM'in doğru şekilde kurulmasını, schema tasarım kurallarını ve framework'lere entegrasyonunu AI'a öğretir.
-->

# PRISMA CONFIGURATION RULES

## 1. KURULUM

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider postgresql
```

### Veritabanı Seçenekleri

| Provider | Schema'da `provider` | Kullanım |
|----------|---------------------|----------|
| PostgreSQL | `"postgresql"` | E-ticaret, SaaS, genel amaçlı |
| MySQL | `"mysql"` | WordPress benzeri, paylaşımlı hosting |
| SQLite | `"sqlite"` | Geliştirme, demo, tek dosya |
| SQL Server | `"sqlserver"` | Enterprise, .NET ekosistemi |
| MongoDB | `"mongodb"` | Döküman tabanlı, esnek şema |
| CockroachDB | `"cockroachdb"` | Dağıtık SQL |

## 2. SCHEMA TASARIM KURALLARI

### 2.1. Temel Schema Yapısı

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  posts     Post[]
  profile   Profile?

  @@map("users")
}
```

### 2.2. İlişki Kuralları (ZORUNLU)

```prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  authorId  String   @map("author_id")
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments  Comment[]
  tags      PostTag[]

  @@index([authorId])
  @@map("posts")
}

// Explicit many-to-many (önerilen)
model PostTag {
  postId String @map("post_id")
  tagId  String @map("tag_id")
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
  @@map("post_tags")
}
```

**Kurallar:**
- Foreign key alanları her zaman `@map` ile snake_case
- `onDelete: Cascade` (child) veya `onDelete: Restrict` (critical data)
- Many-to-many: Explicit join table (implicit yerine)
- Her modelde `@@map("tablo_adi")` (snake_case)

### 2.3. Decimal Kullanımı (Finansal Veriler)

```prisma
model Order {
  id          String   @id @default(cuid())
  totalAmount Decimal  @map("total_amount") @db.Decimal(19, 4)
  taxAmount   Decimal  @map("tax_amount") @db.Decimal(19, 4)

  @@map("orders")
}
```

**Float KULLANMA.** Finansal hesaplamalarda float yuvarlama hatası verir. `Decimal(19,4)` formatı ZORUNLU.

### 2.4. Enum Kullanımı

```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPING
  DELIVERED
  CANCELLED
  REFUNDED
}

model Order {
  status OrderStatus @default(PENDING)
}
```

Enum'lar veritabanında native enum tipi olarak saklanır (PostgreSQL). String olarak saklamak için `@map("status")` string field olarak tanımla.

## 3. CLIENT KULLANIM KURALLARI

### 3.1. Singleton Client (Next.js)

```ts
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Next.js'te hot reload her seferinde yeni PrismaClient oluşturur.** Global singleton pattern ZORUNLU.

### 3.2. Transaction Kullanımı

```ts
// Birden fazla yazma işlemi:
const [order, stockUpdate] = await prisma.$transaction([
  prisma.order.create({ data: orderData }),
  prisma.product.update({
    where: { id: productId },
    data: { stock: { decrement: quantity } },
  }),
]);

// Interactive transaction (karmaşık mantık):
const result = await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  if (order.total > 1000) {
    await tx.notification.create({ data: { orderId: order.id } });
  }
  return order;
});
```

**Birden fazla yazma işlemi her zaman transaction içinde olmalıdır.**

## 4. MİGRASYON KOMUTLARI

```bash
# Geliştirme: Schema değişikliğini migration'a dönüştür
npx prisma migrate dev --name add_user_role

# Production: Migration'ları uygula
npx prisma migrate deploy

# Migration olmadan DB'yi schema'ya senkronize et (prototip)
npx prisma db push

# Client'ı yeniden generate et
npx prisma generate
```

## 5. YAPILMAMASI GEREKENLER

- **Float tipini finansal verilerde kullanMA** — Decimal kullan
- **Production'da `prisma db push`** — Migration geçmişi kaybolur, `migrate deploy` kullan
- **Client'ı request başına new PrismaClient()** — Connection pool tükenir
- **Enum değeri değiştirirken migration'ı unutMA** — PostgreSQL native enum ALTER TYPE gerektirir
- **`@@map` veya `@map` olmadan model/field tanımlama** — Veritabanı snake_case, Prisma camelCase
