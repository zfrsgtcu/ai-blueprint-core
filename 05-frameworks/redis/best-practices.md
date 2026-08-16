<!--
  BU DOSYANIN AMACI:
  Redis ile performans optimizasyonu, anti-pattern'lerden kaçınma, cache stratejileri ve production güvenliği kurallarını AI'a öğretir.
-->

# REDIS BEST PRACTICES

## 1. CACHE STRATEJİLERİ

### 1.1. Cache-Aside (En Yaygın)

```ts
async function getProduct(id: string): Promise<Product> {
  // 1. Cache'e bak
  const cached = await redis.get(`product:${id}`);
  if (cached) return JSON.parse(cached);

  // 2. Veritabanından al
  const product = await prisma.product.findUnique({ where: { id } });

  // 3. Cache'e yaz
  if (product) {
    await redis.setex(`product:${id}`, 3600, JSON.stringify(product));
  }

  return product;
}
```

### 1.2. Write-Through / Write-Behind

```ts
async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  // 1. Veritabanını güncelle
  await prisma.product.update({ where: { id }, data });

  // 2. Cache'i güncelle (write-through)
  const product = await prisma.product.findUnique({ where: { id } });
  await redis.setex(`product:${id}`, 3600, JSON.stringify(product));
}
```

### 1.3. Cache Invalidation (En Zor Problem)

```ts
// Tek ürün güncellemesi: cache'i güncelle veya sil
await redis.del(`product:${productId}`);

// Liste cache'leri: prefix ile sil
const keys = await redis.keys('products:list:*');
if (keys.length) await redis.del(keys);

// VEYA pattern subscribe ile otomatik invalidasyon:
// Ürün güncellendiğinde pub/sub ile diğer servislere haber ver
await pub.publish('cache:invalidate', JSON.stringify({ pattern: 'products:*' }));
```

## 2. DATA STRUCTURE DOĞRU KULLANIMI

### 2.1. String vs Hash

```ts
// KÖTÜ: Ayrı ayrı string key'ler
await redis.set('user:123:name', 'John');
await redis.set('user:123:email', 'john@example.com');
await redis.set('user:123:role', 'admin');

// İYİ: Hash (tek key, memory efficient)
await redis.hset('user:123', {
  name: 'John',
  email: 'john@example.com',
  role: 'admin',
});

// Sadece email'i al:
const email = await redis.hget('user:123', 'email');
```

Hash, benzer objelerde %40 daha az bellek kullanır.

### 2.2. Sorted Set (Leaderboard / Ranking)

```ts
// Satış sıralaması:
await redis.zadd('sales:leaderboard', 1500, 'product:A');
await redis.zadd('sales:leaderboard', 1200, 'product:B');
await redis.zadd('sales:leaderboard', 800, 'product:C');

// Top 10:
const top10 = await redis.zrevrange('sales:leaderboard', 0, 9, 'WITHSCORES');
```

### 2.3. List/Stream (Message Queue)

```ts
// Basit queue (List)
await redis.lpush('email:queue', JSON.stringify({ to: 'a@b.com', template: 'welcome' }));

// Consumer:
const job = await redis.brpop('email:queue', 0); // 0 = sonsuz bekle
```

## 3. PIPELINE VE TRANSACTION

### 3.1. Pipeline (Toplu İşlem)

```ts
// KÖTÜ: Sıralı 100 komut = 100 round-trip
for (const item of items) {
  await redis.set(`item:${item.id}`, JSON.stringify(item));
}

// İYİ: Pipeline = 1 round-trip
const pipeline = redis.pipeline();
for (const item of items) {
  pipeline.set(`item:${item.id}`, JSON.stringify(item));
}
await pipeline.exec();
```

### 3.2. Transaction (Atomic)

```ts
// MULTI/EXEC: Tüm komutlar atomik
const result = await redis
  .multi()
  .incr('order:counter')
  .hset(`order:${orderId}`, 'status', 'pending')
  .exec();
```

## 4. DISTRIBUTED LOCK

```ts
// Kaynak bazlı kilit (stok güncelleme gibi):
async function withLock<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const lockKey = `lock:${key}`;
  const lockValue = crypto.randomUUID();

  // Lock al
  const acquired = await redis.set(lockKey, lockValue, 'PX', ttl, 'NX');
  if (!acquired) {
    throw new Error('Kaynak kullanımda, tekrar deneyin');
  }

  try {
    return await fn();
  } finally {
    // Lock'u sadece biz koyduysak kaldır (Lua script ile atomic)
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await redis.eval(script, 1, lockKey, lockValue);
  }
}
```

## 5. MEMORY OPTİMİZASYONU

### 5.1. maxmemory-policy

```
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru  # En uygun: az kullanılanı at
```

Policy seçenekleri:
- `allkeys-lru`: Az kullanılan key'leri at (cache için ideal)
- `volatile-lru`: TTL'li key'lerden az kullanılanı at
- `noeviction`: Bellek dolunca hata ver (queue için)

### 5.2. Key Boyutu

```
# İdeal key boyutları:
- String value: < 10KB
- Hash field sayısı: < 1000
- List/Set eleman sayısı: < 10000
```

## 6. YAPILMAMASI GEREKENLER

- **Production'da `KEYS *`** — `SCAN` ile değiştir
- **Büyük veri setlerini cache'leme** — 1MB'dan büyük objeleri cache'leme
- **Hot Key problemi** — Aynı key'e 1000+ concurrent istek, replica ile dağıt
- **`FLUSHDB`/`FLUSHALL` production'da** — Veri kaybı, rename-command ile disable et
- **Lock release'de race condition** — Her zaman Lua script ile atomik kontrol yap
- **Single Redis node** — Production'da en az Sentinel (2 node) veya Cluster
