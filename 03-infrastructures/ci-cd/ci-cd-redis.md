<!--
  BU DOSYANIN AMACI:
  Redis'in CI/CD pipeline'larında test ortamı sağlama, cache invalidation stratejileri ve deployment best practice'lerini AI'a öğretir.

  İLGİLİ DOSYALAR:
  - 04-frameworks/redis/config-rules.md
  - 04-frameworks/redis/best-practices.md
  - 03-infrastructures/ci-cd/
-->

# CI/CD + REDIS ENTEGRASYONU

## 1. GITHUB ACTIONS İLE REDIS SERVICE

```yaml
name: CI with Redis
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 5

    env:
      REDIS_URL: redis://localhost:6379

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
```

## 2. CACHE INVALIDATION (Deploy Sonrası)

```yaml
# Deploy sonrası cache temizleme:
deploy:
  needs: [test, build]
  runs-on: ubuntu-latest
  environment: production
  steps:
    - name: Deploy to production
      run: ./deploy.sh

    - name: Invalidate cache
      run: |
        redis-cli -h ${{ secrets.REDIS_HOST }} \
          -p ${{ secrets.REDIS_PORT }} \
          -a ${{ secrets.REDIS_PASSWORD }} \
          --scan --pattern 'products:*' | \
          xargs redis-cli -h ${{ secrets.REDIS_HOST }} DEL

    - name: Warm up cache
      run: |
        curl -s https://api.example.com/products/featured > /dev/null
        curl -s https://api.example.com/categories > /dev/null
```

## 3. MIGRATION + CACHE STRATEJİSİ

```ts
// Deployment sırasında cache flush (opsiyonel):
import Redis from 'ioredis';

async function invalidateCache(postDeployUrl: string) {
  const redis = new Redis(process.env.REDIS_URL!);

  // Tüm ürün cache'lerini temizle
  const stream = redis.scanStream({ match: 'products:*', count: 100 });
  const pipeline = redis.pipeline();

  stream.on('data', (keys: string[]) => {
    if (keys.length) {
      keys.forEach(key => pipeline.del(key));
    }
  });

  stream.on('end', async () => {
    await pipeline.exec();
    // Warmup: endpoint'i çağır
    await fetch(postDeployUrl);
    await redis.quit();
  });
}
```

## 4. TEST TEARDOWN

```ts
// Her test dosyası sonrası Redis temizliği:
import Redis from 'ioredis';

let redis: Redis;

beforeAll(() => {
  redis = new Redis(process.env.REDIS_URL!);
});

afterEach(async () => {
  // Test DB'sini temizle (CI'da DB 0 kullanılıyor varsayımı)
  await redis.flushdb();
});

afterAll(async () => {
  await redis.quit();
});
```

## 5. RATE LIMIT TESTİ

```ts
// CI'da rate limit testi — Redis rate limiter'ı test et:
describe('Rate Limiter', () => {
  it('100 isteğe izin verir, 101. isteği reddeder', async () => {
    const redis = new Redis(process.env.REDIS_URL!);
    const key = `rate:test:${Date.now()}`;
    const windowMs = 5000; // CI için kısa pencere
    const maxRequests = 100;

    for (let i = 0; i < maxRequests; i++) {
      const count = await redis.incr(key);
      if (i === 0) await redis.pexpire(key, windowMs);
      expect(count).toBeLessThanOrEqual(maxRequests);
    }

    const exceeded = await redis.incr(key);
    expect(exceeded).toBeGreaterThan(maxRequests); // Limit aşıldı

    await redis.del(key);
    await redis.quit();
  });
});
```

## 6. YAPILMAMASI GEREKENLER

- **Production'da `FLUSHALL`/`FLUSHDB`** — CI'da sadece test amaçlı kullan
- **Redis olmadan rate limit testi** — Memory-based rate limiter CI'da yanıltıcı olur
- **Test DB'sini başka testlerle paylaşma** — Her test kendi prefix'ini kullansın veya `FLUSHDB` ile temizlesin
- **Uzun cache warmup** — Deploy süresini uzatır, sadece kritik endpoint'leri warmup yap
- **Cache invalidate olmadan deploy** — Kullanıcılar eski veri görür
