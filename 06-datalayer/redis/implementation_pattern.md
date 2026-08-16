<!-- PURPOSE OF THIS FILE: Redis implementation best practice'leri — AI ajanının uyması gereken ZORUNLU/YASAK/ÖNERİLEN kurallar -->
# Redis Implementation Pattern

## Genel Prensipler

- 🔴 **ZORUNLU:** Redis bağlantısı singleton olarak oluşturulur. Her istekte yeni bağlantı açılmaz.
- 🔴 **ZORUNLU:** Redis devre dışı kaldığında uygulama ÇALIŞMAYA DEVAM EDER. Cache miss → veritabanından okuma fallback'i her zaman uygulanır.
- 🔴 **ZORUNLU:** Tüm cache anahtarlarına TTL (Time To Live) atanır. Sonsuz süreli cache OLUŞTURULMAZ.
- 🟠 **YASAK:** `KEYS *` komutu production'da kullanılmaz (O(n), tüm veritabanını bloklar). Yerine `SCAN` kullanılır.
- 🟡 **ÖNERİLEN:** Cache aside pattern (Lazy Loading) varsayılan strateji olarak kullanılır.

## Güvenlik Kuralları

- 🔴 **ZORUNLU:** Production'da Redis password (`requirepass`) zorunludur.
- 🔴 **ZORUNLU:** Redis port'u dış dünyaya açılmaz, sadece uygulama container'ı ile iletişim kurar.
- 🔴 **ZORUNLU:** Redis'te ASLA hassas veri (şifre, token, PII) saklanmaz. Cache'lenebilir veriler: ürün listesi, kategori ağacı, oturum ID'leri.
- 🟠 **YASAK:** `FLUSHALL` veya `FLUSHDB` production'da kullanılmaz.

## Kodlama Standartları

### .NET (StackExchange.Redis + IDistributedCache)
```csharp
// ✅ DOĞRU — Cache aside pattern
public async Task<Product?> GetProductAsync(int id)
{
    var cacheKey = $"product:{id}";
    var cached = await _cache.GetStringAsync(cacheKey);

    if (cached is not null)
        return JsonSerializer.Deserialize<Product>(cached);

    var product = await _repository.GetByIdAsync(id);
    if (product is not null)
    {
        var options = new DistributedCacheEntryOptions
            .SetSlidingExpiration(TimeSpan.FromMinutes(10));
        await _cache.SetStringAsync(cacheKey,
            JsonSerializer.Serialize(product), options);
    }
    return product;
}
```

### Node.js (ioredis)
```javascript
// ✅ DOĞRU — Redis singleton + graceful degradation
const Redis = require('ioredis');

let redis = null;

function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://default:{{REDIS_PASSWORD}}@{{REDIS_HOST}}:{{REDIS_PORT}}', {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null; // 3 denemeden sonra vazgeç
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.warn('Redis bağlantı hatası (cache devre dışı):', err.message);
    });
  }
  return redis;
}

// ✅ DOĞRU — Cache aside
async function getCachedOrFetch(key, ttlSeconds, fetchFn) {
  try {
    const redis = getRedis();
    if (redis.status !== 'ready') throw new Error('Redis bağlı değil');

    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    const data = await fetchFn();
    if (data) {
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
    }
    return data;
  } catch {
    // Graceful degradation: Redis yoksa doğrudan fetch
    return fetchFn();
  }
}
```

## Cache Stratejileri

| Pattern | Ne Zaman | Nasıl |
|---------|---------|-------|
| **Cache Aside** | Read-heavy, seyrek güncelleme | Önce cache'e sor → miss ise DB'den oku → cache'e yaz |
| **Write Through** | Veri tutarlılığı kritik | Yazma anında hem DB'ye hem cache'e yaz |
| **Write Behind** | Yüksek yazma hızı gerekli | Async olarak önce cache'e yaz, arkada DB'ye yaz |

## Performans

- 🔴 **ZORUNLU:** `KEYS *` yerine `SCAN` kullanılır.
- 🟡 **ÖNERİLEN:** Pipeline ile batch işlemler (N komutu tek round-trip'te gönder).
- 🟡 **ÖNERİLEN:** Büyük objeler (>1MB) cache'lenmez veya sıkıştırılır.
- 🟡 **ÖNERİLEN:** Memory policy: `allkeys-lru` (en eski kullanılmayanları at).

## Yaygın Hatalar

1. **Redis down → uygulama crash** — Graceful degradation yok, cache bağlantı hatası tüm uygulamayı çökertiyor.
2. **TTL olmadan cache** — Sonsuz süreli cache, bellek sızıntısına ve stale data'ya yol açar.
3. **`KEYS *` kullanmak** — Production'da tüm veritabanını bloklar.
4. **Her istekte yeni bağlantı** — Connection pool tükenir.
5. **Cache invalidation stratejisi yok** — Güncellenen verinin cache'i temizlenmez, eski veri gösterilir.
6. **Hassas veriyi cache'lemek** — Şifre, token, PII Redis'te saklanmaz.
7. **Prod'da password olmadan Redis** — Açık Redis sunucusu güvenlik açığıdır.
