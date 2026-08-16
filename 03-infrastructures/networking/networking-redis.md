<!--
  BU DOSYANIN AMACI:
  Redis'in ağ katmanında güvenli yapılandırılmasını, TLS bağlantısını, firewall kurallarını ve production networking best practice'lerini AI'a öğretir.

  İLGİLİ DOSYALAR:
  - 04-frameworks/redis/config-rules.md
  - 04-frameworks/redis/best-practices.md
  - 03-infrastructures/networking/
-->

# NETWORKING + REDIS ENTEGRASYONU

## 1. REDIS BAĞLANTI GÜVENLİĞİ

### 1.1. TLS/SSL Bağlantısı

```ts
import Redis from 'ioredis';
import fs from 'fs';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6380,  // TLS port'u
  password: process.env.REDIS_PASSWORD,
  tls: {
    ca: fs.readFileSync('/etc/ssl/certs/redis-ca.pem'),
    // Mutual TLS (opsiyonel):
    cert: fs.readFileSync('/etc/ssl/certs/redis-client.crt'),
    key: fs.readFileSync('/etc/ssl/certs/redis-client.key'),
  },
});
```

### 1.2. Upstash Redis (HTTPS üzerinden)

```ts
import { Redis } from '@upstash/redis';

// Upstash zaten HTTPS üzerinden, ek TLS yapılandırması gerekmez:
const redis = new Redis({
  url: 'https://usw1-holy-fox-12345.upstash.io',
  token: process.env.UPSTASH_REDIS_TOKEN!,
});
```

## 2. FIREWALL KURALLARI

```yaml
# docker-compose.yaml — Redis'i sadece app ağına expose et:
services:
  redis:
    image: redis:7-alpine
    networks:
      - internal  # Sadece internal ağda
    # ports kullanma — dışarıya kapalı

  app:
    networks:
      - internal
      - web  # Web'ten erişilebilir

networks:
  internal:
    internal: true  # Docker internal network, dış erişim yok
  web:
    driver: bridge
```

## 3. CONNECTION STRING GÜVENLİĞİ

```env
# Güvenli: TLS ile
REDIS_URL=rediss://user:password@redis-host:6380/0

# Geliştirme: TLS yok
REDIS_URL=redis://localhost:6379/0

# Production: MUTLAKA rediss:// (TLS)
REDIS_URL=rediss://default:${REDIS_PASSWORD}@${REDIS_HOST}:6380/0
```

## 4. REDIS CLUSTER NETWORKING

```ts
const cluster = new Redis.Cluster([
  { host: 'redis-node-0', port: 6379 },
  { host: 'redis-node-1', port: 6379 },
  { host: 'redis-node-2', port: 6379 },
], {
  redisOptions: {
    password: process.env.REDIS_PASSWORD,
    tls: process.env.NODE_ENV === 'production' ? {} : undefined,
  },
  scaleReads: 'slave',  // Okumaları replicalara dağıt
});
```

## 5. NGINX TCP PROXY (HARİCİ ERİŞİM İÇİN)

```nginx
# nginx.conf — Redis TCP stream proxy (ihtiyaç varsa)
stream {
    upstream redis_backend {
        server redis-node-0:6379;
        server redis-node-1:6379;
        server redis-node-2:6379;
    }

    server {
        listen 6379 ssl;
        proxy_pass redis_backend;
        ssl_certificate /etc/ssl/certs/redis-public.crt;
        ssl_certificate_key /etc/ssl/private/redis-public.key;
    }
}
```

## 6. TIMEOUT VE KEEPALIVE

```ts
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  connectTimeout: 5000,       // Bağlantı timeout: 5s
  keepAlive: 10000,           // TCP keepalive: 10s
  retryStrategy(times) {
    if (times > 10) return null; // 10 deneme sonra vazgeç
    return Math.min(times * 200, 3000);
  },
});
```

## 7. YAPILMAMASI GEREKENLER

- **Production'da TLS olmadan Redis bağlantısı** — `rediss://` kullan, `redis://` değil
- **Redis'i public IP'ye expose etme** — Sadece internal ağda, Docker network'ünde
- **`bind 0.0.0.0` ile public interface'e bağlama** — Sadece app sunucusunun IP'sine bind et
- **Firewall olmadan Redis** — En azından `iptables` veya security group ile IP kısıtlaması yap
- **Connection string'de şifre** — Environment variable'dan al, kodda gömülü olmasın
