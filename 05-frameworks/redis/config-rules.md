<!--
  BU DOSYANIN AMACI:
  Redis'in farklı kullanım senaryolarına göre (cache, session store, queue, pub/sub) doğru konfigürasyonunu AI'a öğretir.
-->

# REDIS CONFIGURATION RULES

## 1. CLIENT SEÇİMİ

| Ekosistem | Paket | Kullanım |
|-----------|-------|----------|
| Node.js | `ioredis` | Önerilen (cluster, sentinel, pipeline, lua) |
| Node.js (basit) | `redis` (node-redis) | v4+ native Promise, basit kullanım |
| .NET | `StackExchange.Redis` | En popüler, ConnectionMultiplexer |
| Next.js (Edge) | `@upstash/redis` | Edge Runtime uyumlu, HTTP-based |

## 2. NODE.JS KURULUMU

### 2.1. ioredis (Önerilen)

```bash
npm install ioredis
```

```ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,                    // Hangi database (0-15)
  maxRetriesPerRequest: 3,  // Request başına retry
  retryStrategy(times) {     // Bağlantı retry stratejisi
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableOfflineQueue: false, // Serverless için: bağlantı yoksa hata ver
});

redis.on('error', (err) => {
  console.error('Redis bağlantı hatası:', err);
});
```

### 2.2. node-redis (Basit Alternatif)

```bash
npm install redis
```

```ts
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL, // 'redis://localhost:6379'
});

redis.on('error', (err) => console.error('Redis Error:', err));

await redis.connect();
```

### 2.3. Upstash Redis (Next.js Edge / Serverless)

```bash
npm install @upstash/redis
```

```ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// HTTP-based, Edge Runtime uyumlu
const value = await redis.get('key');
```

## 3. KULLANIM SENARYOLARINA GÖRE KONFİGÜRASYON

### 3.1. Cache (Önbellek)

```ts
// Temel cache pattern:
async function getCached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fn();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

// Kullanım:
const products = await getCached('products:featured', 3600, () =>
  prisma.product.findMany({ where: { featured: true } })
);
```

**Cache TTL Stratejisi:**
- Ürün listesi: 1 saat (3600s)
- Kullanıcı profili: 15 dakika (900s)
- Kategori listesi: 24 saat (86400s)
- Ana sayfa içeriği: 5 dakika (300s)
- Stok sayısı: 30 saniye (pessimistic değilse)

### 3.2. Session Store

```ts
// Redis ile session yönetimi (express-session):
import session from 'express-session';
import RedisStore from 'connect-redis';

app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 gün
  },
}));
```

### 3.3. Rate Limiting

```ts
// Express rate-limit:
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:',
  }),
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100,                  // 15 dakikada max 100 istek
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 3.4. Pub/Sub (Realtime)

```ts
// Publisher
const pub = new Redis();
await pub.publish('orders:new', JSON.stringify({ orderId: '123' }));

// Subscriber (ayrı bağlantı)
const sub = new Redis();
sub.subscribe('orders:new');
sub.on('message', (channel, message) => {
  console.log(`${channel}:`, JSON.parse(message));
});
```

### 3.5. Queue (BullMQ)

```bash
npm install bullmq
```

```ts
import { Queue, Worker } from 'bullmq';

const queue = new Queue('email', { connection: redis });

// Job ekle
await queue.add('welcome-email', { userId: '123' });

// Worker
const worker = new Worker('email', async (job) => {
  await sendEmail(job.data.userId);
}, { connection: redis });
```

## 4. KEY İSİMLENDİRME STANDARDI

```
# Pattern: domain:entity:id
users:profile:abc123
products:list:featured
sessions:sess_xyz789
cache:api:users:page1
rate:ip:192.168.1.1
queue:email:waiting
lock:inventory:product_456
```

## 5. YAPILMAMASI GEREKENLER

- **`KEYS *` production'da** — Milyonlarca key'de Redis'i bloklar, `SCAN` kullan
- **Tek connection ile hem pub hem sub** — Subscriber ayrı connection ister
- **Cache'de infinite TTL** — Her key'e TTL ver, aksi halde bellek şişer
- **Büyük value (10MB+)** — Redis string max 512MB ama 100KB üstü performansı düşürür
- **Production'da `FLUSHALL`** — Tüm datayı siler, asla production'da
- **SSL olmadan public Redis** — Her zaman `tls: {}` ile şifrele
