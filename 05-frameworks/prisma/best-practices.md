<!--
  BU DOSYANIN AMACI:
  Prisma ile performanslı sorgu optimizasyonu, N+1 problemini çözme ve production best practice'lerini AI'a öğretir.
-->

# PRISMA BEST PRACTICES

## 1. N+1 SORUNU ÇÖZÜMÜ

### 1.1. include ile Eager Loading

```ts
// KÖTÜ: N+1 — her post için ayrı author sorgusu
const posts = await prisma.post.findMany();
for (const post of posts) {
  const author = await prisma.user.findUnique({ where: { id: post.authorId } });
}

// İYİ: include ile tek sorguda
const posts = await prisma.post.findMany({
  include: {
    author: true,
    comments: { take: 5, orderBy: { createdAt: 'desc' } },
  },
});
```

### 1.2. Nested include Sınırlaması

```ts
// DOĞRU: En fazla 2-3 seviye include
const post = await prisma.post.findUnique({
  where: { id },
  include: {
    author: true,                             // Seviye 1
    comments: {
      include: { user: true },                // Seviye 2
    },
  },
});

// YANLIŞ: 4+ seviye include — sorgu patlar
/*
include: {
  author: {
    include: {
      posts: {
        include: {
          comments: {
            include: { user: true }  // Seviye 4!
          }
        }
      }
    }
  }
}
*/
```

## 2. QUERY OPTİMİZASYONU

### 2.1. select ile Sadece İhtiyaç Duyulan Alanlar

```ts
// KÖTÜ: Tüm kolonlar (50+ kolon)
const users = await prisma.user.findMany();

// İYİ: Sadece gerekli alanlar
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    _count: { select: { posts: true } }, // Aggregate
  },
});
```

### 2.2. Pagination (Offset vs Cursor)

```ts
// Offset-based (küçük veri setleri, <10K kayıt)
const page1 = await prisma.post.findMany({
  skip: 0,
  take: 20,
  orderBy: { createdAt: 'desc' },
});

// Cursor-based (büyük veri setleri, >10K kayıt — ÖNERİLEN)
const page1 = await prisma.post.findMany({
  take: 20,
  orderBy: { createdAt: 'desc' },
  cursor: { id: lastPostId },       // Son görülen kaydın ID'si
  skip: 1,                          // Cursor'ın kendisini atla
});
```

**Cursor-based pagination 100K+ kayıtlarda 100x daha hızlıdır.**

### 2.3. Raw Query (Karmaşık Sorgular)

```ts
// Prisma'nın yetişemediği durumlarda:
const result = await prisma.$queryRaw`
  SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as order_count,
    SUM(total_amount) as revenue
  FROM orders
  WHERE created_at >= ${startDate}
  GROUP BY DATE_TRUNC('month', created_at)
  ORDER BY month
`;
```

### 2.4. Index Stratejisi

```prisma
model Product {
  id          String  @id @default(cuid())
  name        String
  categoryId  String  @map("category_id")
  price       Decimal @db.Decimal(19,4)
  createdAt   DateTime @default(now()) @map("created_at")

  // Sık sorgulanan alanlara index
  @@index([categoryId])
  @@index([price])           // Fiyat filtrelemesi için
  @@index([name])            // Ürün araması için (full-text değil)
  @@index([createdAt])       // Sıralama/tarih filtrelemesi

  // Composite index (sık birlikte sorgulanan alanlar)
  @@index([categoryId, price])
  @@index([categoryId, createdAt])

  @@map("products")
}
```

## 3. CONNECTION POOL YÖNETİMİ

```prisma
// PrismaClient connection pool ayarları:
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool (varsayılan: num_cpu * 2 + 1)
  // Serverless için connection limit önemli:
  // connection_limit: 5,
});
```

**Serverless (Vercel, Lambda) için:** Connection limit'i 1-3 arasında tut. Serverless her request'te yeni bağlantı açabilir.

## 4. SOFT DELETE PATTERN

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  deletedAt DateTime? @map("deleted_at")

  @@map("users")
}

// Middleware ile otomatik filtreleme:
prisma.$use(async (params, next) => {
  if (params.model === 'User' && params.action === 'findMany') {
    params.args.where = {
      ...params.args.where,
      deletedAt: null,
    };
  }
  return next(params);
});
```

## 5. SEEDING (Başlangıç Verisi)

```ts
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      role: 'ADMIN',
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

```json
// package.json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

## 6. YAPILMAMASI GEREKENLER

- **Production'da `prisma migrate dev`** — Sadece development için, production'da `migrate deploy`
- **Her request'te yeni PrismaClient** — Global singleton kullan
- **N+1: Loop içinde `findUnique`** — `include` ile eager loading kullan
- **Büyük veri setinde offset pagination** — Cursor-based kullan
- **Migration'ları commit etmemezlik** — Migration'lar Git'e commit EDİLMELİ
- **`$disconnect()` çağırmayı unutma** — Server shutdown'da veya script sonunda
