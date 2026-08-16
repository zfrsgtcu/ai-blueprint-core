<!--
  BU DOSYANIN AMACI:
  Redis bağlantı şifresinin, ACL kullanıcı yönetiminin ve production secret stratejisinin AI'a öğretir.

  İLGİLİ DOSYALAR:
  - 04-frameworks/redis/config-rules.md
  - 04-frameworks/redis/best-practices.md
  - 03-infrastructures/secrets/
-->

# SECRETS + REDIS ENTEGRASYONU

## 1. REDIS PAROLA YÖNETİMİ

```env
# .env (gitignore):
REDIS_PASSWORD=SuperSecretRedisPass123!

# Production: rediss:// ile TLS + parola
REDIS_URL=rediss://default:${REDIS_PASSWORD}@redis.internal:6380/0
```

```ts
// Parola environment variable'dan:
const redis = new Redis({
  host: process.env.REDIS_HOST!,
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
});
```

## 2. REDIS ACL KULLANICI YÖNETİMİ

```bash
# /etc/redis/users.acl — Redis 6+ ACL:
# Default user'ı kapat:
user default off

# Admin (tam yetki):
user admin on >AdminStrongPass123! ~* &* +@all

# App kullanıcısı (sınırlı yetki, KEYS ve FLUSHDB yok):
user app on >AppStrongPass123! ~app:* ~cache:* +@read +@write +@connection -@dangerous

# Read-only reporting user:
user readonly on >ReadOnlyPass123! ~* +@read -@write -@dangerous
```

```yaml
# docker-compose.yaml — ACL dosyasını mount et:
services:
  redis:
    image: redis:7-alpine
    command: redis-server /etc/redis/users.acl
    volumes:
      - ./redis/users.acl:/etc/redis/users.acl:ro
```

```ts
// App kullanıcısıyla bağlan:
const redis = new Redis({
  host: 'redis',
  port: 6379,
  username: 'app',        // ACL username
  password: 'AppStrongPass123!',
});
```

## 3. REDIS ACL ROL TABLOSU

| Role | Yetki | Kullanım |
|------|-------|----------|
| `admin` | `+@all` | Bakım, migration, monitoring |
| `app` | `+@read +@write +@connection -@dangerous` | Normal uygulama işlemleri |
| `readonly` | `+@read -@write -@dangerous` | Dashboard, analitik, read-only servisler |
| `session` | `+@read +@write +@connection -@dangerous ~session:*` | Sadece session key'leri |

## 4. UPSTASH REDIS SECRETS

```env
# Upstash konsolundan alınan token (HTTPS zaten):
UPSTASH_REDIS_REST_URL=https://usw1-holy-fox-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AZaBcDeFgH1234567890abcdefghijKLMNOPQRSTUV

# NOT: Upstash token = parola değil, REST API token'ı
# Token'ı environment variable'da tut, kodda hardcode yapma
```

```ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

## 5. REDIS PAROLA ROTATION

```bash
# Redis ACL parola değişimi (downtime olmadan):
redis-cli ACL SETUSER app resetpass NewAppPass456!
redis-cli ACL SAVE

# Uygulama aynı anda yeni parolayla bağlanır:
# REDIS_PASSWORD=NewAppPass456!
```

```ts
// Graceful rotation: eski client'ı disconnect et, yeniyle bağlan:
export async function rotateRedisPassword(newPassword: string): Promise<void> {
  const oldClient = redisClient;
  redisClient = new Redis({
    host: process.env.REDIS_HOST!,
    password: newPassword,
  });

  // 5 saniye sonra eski bağlantıyı kapat:
  setTimeout(() => oldClient.disconnect(), 5000);
}
```

## 6. REDIS SENTINEL AUTH

```ts
const redis = new Redis({
  sentinels: [
    { host: 'sentinel-1', port: 26379 },
    { host: 'sentinel-2', port: 26379 },
    { host: 'sentinel-3', port: 26379 },
  ],
  name: 'mymaster',
  sentinelPassword: process.env.REDIS_SENTINEL_PASSWORD,
  sentinelUsername: 'sentinel_user',
  password: process.env.REDIS_MASTER_PASSWORD,
  username: 'app',
});
```

## 7. YAPILMAMASI GEREKENLER

- **Redis parolasız production** — `requirepass` veya ACL ile MUTLAKA auth zorunlu
- **Default user'ı açık bırakma** — `user default off` yap
- **Tüm servislere aynı Redis kullanıcısı** — ACL ile servis başına ayrı user/password
- **`KEYS *` yetkisini app user'ına verme** — `-@dangerous` ile block'la
- **Parolayı loglama** — Redis bağlantı hatası mesajları parola içerebilir, loglarken filtrele
- **Hardcoded Redis parolası** — Environment variable veya Secret Manager kullan
