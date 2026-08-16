<!--
  BU DOSYANIN AMACI:
  Redis'in monitoring araçlarıyla entegrasyonunu, bellek kullanım takibini ve cache hit/miss ratio analizini AI'a öğretir.

  İLGİLİ DOSYALAR:
  - 04-frameworks/redis/config-rules.md
  - 04-frameworks/redis/best-practices.md
  - 03-infrastructures/monitoring/
-->

# MONITORING + REDIS ENTEGRASYONU

## 1. REDIS METRİK'LERİ (Prometheus)

```ts
import Redis from 'ioredis';
import { Registry, Gauge, Counter } from 'prom-client';

const register = new Registry();

const redisMemory = new Gauge({
  name: 'redis_memory_used_bytes',
  help: 'Redis bellek kullanımı',
  registers: [register],
});

const redisConnectedClients = new Gauge({
  name: 'redis_connected_clients',
  help: 'Bağlı client sayısı',
  registers: [register],
});

const redisCommandsTotal = new Counter({
  name: 'redis_commands_total',
  help: 'Toplam Redis komut sayısı',
  labelNames: ['command'],
  registers: [register],
});

const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Cache hit sayısı',
  registers: [register],
});

const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Cache miss sayısı',
  registers: [register],
});
```

## 2. METRİK TOPLAMA

```ts
const monitor = new Redis(process.env.REDIS_URL!);

// Her 15 saniyede Redis INFO metrik'lerini topla:
setInterval(async () => {
  try {
    const info = await monitor.info('memory', 'clients', 'stats');

    // Bellek:
    const usedMemory = info.match(/used_memory:(\d+)/)?.[1];
    if (usedMemory) redisMemory.set(Number(usedMemory));

    // Bağlantı:
    const clients = info.match(/connected_clients:(\d+)/)?.[1];
    if (clients) redisConnectedClients.set(Number(clients));

    // Cache hit/miss ratio:
    const hits = info.match(/keyspace_hits:(\d+)/)?.[1];
    const misses = info.match(/keyspace_misses:(\d+)/)?.[1];
    if (hits && misses) {
      const ratio = Number(hits) / (Number(hits) + Number(misses)) * 100;
      console.log(`Cache hit ratio: ${ratio.toFixed(1)}%`);
    }
  } catch (err) {
    console.error('Redis metrik hatası:', err);
  }
}, 15000);
```

## 3. CACHE HIT/MISS TRACKING

```ts
class MonitoredCache {
  constructor(private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (value) {
      cacheHits.inc();
      return JSON.parse(value);
    }
    cacheMisses.inc();
    return null;
  }

  async set(key: string, ttl: number, value: unknown): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}

// Hit ratio alert: %80 altına düşerse cache stratejisini gözden geçir
const cache = new MonitoredCache(new Redis(process.env.REDIS_URL!));
```

## 4. SLOW LOG MONITORING

```ts
// Yavaş Redis komutlarını izle (10000 mikrosaniye = 10ms):
const slowLog = await monitor.slowlog('get', 10); // Son 10 yavaş komut
for (const log of slowLog) {
  console.warn('Yavaş Redis komutu:', {
    command: log[3],
    duration_us: log[2],
    timestamp: new Date(log[1] * 1000),
  });
}
```

## 5. MEMORY ALERT

```ts
const MAX_MEMORY_PERCENT = 80;

setInterval(async () => {
  const info = await monitor.info('memory');
  const used = Number(info.match(/used_memory:(\d+)/)?.[1] || 0);
  const max = Number(info.match(/maxmemory:(\d+)/)?.[1] || 0);

  if (max > 0) {
    const percent = (used / max) * 100;
    if (percent > MAX_MEMORY_PERCENT) {
      console.error(`Redis bellek kullanımı %${percent.toFixed(1)} — eşik %${MAX_MEMORY_PERCENT}`);
      // Alert gönder (Sentry, Slack, PagerDuty vb.)
    }
  }
}, 60000);
```

## 6. ALERT EŞİKLERİ

| Metrik | Eşik | Önem |
|--------|------|------|
| Bellek kullanımı | > %80 | HIGH |
| Bellek kullanımı | > %95 | CRITICAL |
| Cache hit ratio | < %80 | MEDIUM |
| Cache hit ratio | < %50 | HIGH |
| Bağlı client | Ani düşüş | HIGH |
| Slow log komut sayısı | > 10/saat | MEDIUM |
| Rejected connections | > 1/dakika | CRITICAL |

## 7. YAPILMAMASI GEREKENLER

- **`INFO ALL` yerine spesifik section isteme** — `INFO memory` + `INFO stats`, gereksiz veri transferini önler
- **Her request'te `SLOWLOG` kontrolü** — Dakikada bir yeterli
- **Memory alert eşiğini %100 yapma** — `maxmemory-policy allkeys-lru` olsa bile %95'te alert ver
- **Hit ratio'yu sadece counter'dan hesaplama** — Oran olarak hesapla (% olarak)
- **Redis container'ını monitörsüz bırakma** — EN AZ bellek ve bağlantı metrik'leri toplanmalı
