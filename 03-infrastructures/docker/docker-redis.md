<!--
  BU DOSYANIN AMACI:
  Redis'in Docker container'ında doğru yapılandırılmasını, persistence ayarlarını, cluster/sentinel topolojisini ve uygulama ile entegrasyonunu AI'a öğretir.

  İLGİLİ DOSYALAR:
  - 04-frameworks/redis/config-rules.md
  - 04-frameworks/redis/best-practices.md
  - 03-infrastructures/docker/
-->

# DOCKER + REDIS ENTEGRASYONU

## 1. DOCKER COMPOSE (TEMEL)

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  app:
    build: .
    depends_on:
      redis:
        condition: service_healthy
    environment:
      REDIS_URL: redis://redis:6379
```

## 2. REDIS.CONF (Production Ayarları)

```conf
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence (cache kullanımı için yeterli):
save 900 1      # 15 dk'da en az 1 değişiklik → snapshot
save 300 10     # 5 dk'da en az 10 değişiklik
save 60 10000   # 1 dk'da en az 10000 değişiklik

# Güvenlik:
requirepass ${REDIS_PASSWORD}
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
rename-command DEBUG ""

# Ağ:
bind 0.0.0.0     # Container'da gerekli (dış bağlantı için)
protected-mode no # Container'da gerekli
```

## 3. PERSISTENCE (RDB vs AOF)

```yaml
services:
  redis-cache:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru --save "" --appendonly no
    # Cache-only: persistence KAPALI, performans öncelikli

  redis-session:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 128mb --maxmemory-policy allkeys-lru
    # Session store: AOF açık, veri kaybı kabul edilemez
```

## 4. REDIS CLUSTER (Docker Compose)

```yaml
services:
  redis-node-0:
    image: redis:7-alpine
    command: redis-server --port 6379 --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes
    ports:
      - "6379:6379"

  redis-node-1:
    image: redis:7-alpine
    command: redis-server --port 6379 --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes

  redis-node-2:
    image: redis:7-alpine
    command: redis-server --port 6379 --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes

  # Cluster init (tek seferlik):
  redis-cluster-init:
    image: redis:7-alpine
    command: >
      redis-cli --cluster create
      redis-node-0:6379 redis-node-1:6379 redis-node-2:6379
      --cluster-replicas 0 --cluster-yes
    depends_on:
      - redis-node-0
      - redis-node-1
      - redis-node-2
```

## 5. SESSION STORE ENTEĞRASYONU

```ts
// Express + connect-redis (container'a bağlanır):
import RedisStore from 'connect-redis';
import session from 'express-session';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',  // Docker Compose servis adı
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy(times) {
    return Math.min(times * 100, 3000);
  },
});

app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
}));

// Graceful shutdown:
process.on('SIGTERM', async () => {
  await redis.quit();
  process.exit(0);
});
```

## 6. YAPILMAMASI GEREKENLER

- **Production'da `protected-mode no`** — Container dışında çalışan Redis için `yes` olmalı, container içinde mecburi `no`
- **`bind 127.0.0.1` container içinde** — Dış bağlantıya izin vermez, `bind 0.0.0.0` kullan
- **AOF ve RDB ikisini de kapatma** — En az biri açık olmalı, aksi halde restart'ta tüm veri kaybolur
- **Cluster'ı single-node çalıştırma** — Production'da en az 3 master + 3 replica (6 node)
- **Redis'i root kullanıcıyla çalıştırma** — `redis:7-alpine` varsayılan olarak `redis` kullanıcısıyla çalışır
