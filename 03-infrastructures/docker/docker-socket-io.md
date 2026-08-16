<!--
  BU DOSYANIN AMACI:
  Socket.IO'nun Docker container'ında doğru yapılandırılmasını, horizontal scaling stratejisini (Redis adapter) ve WebSocket'in load balancer/Nginx ile entegrasyonunu AI'a öğretir.

  İLGİLİ DOSYALAR:
  - 04-frameworks/socket-io/config-rules.md
  - 04-frameworks/socket-io/best-practices.md
  - 05-integrations/networking/networking-socket-io.md
  - 03-infrastructures/docker/
-->

# DOCKER + SOCKET.IO ENTEGRASYONU

## 1. TEK SUNUCULU DOCKERFILE

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules

USER appuser
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

## 2. DOCKER COMPOSE (Tek Sunucu)

```yaml
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      PORT: 3001
      CLIENT_URL: http://localhost:3000

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - app
```

## 3. HORIZONTAL SCALING (Çok Instance + Redis Adapter)

```yaml
services:
  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  app-1:
    build: .
    environment:
      PORT: 3001
      REDIS_HOST: redis

  app-2:
    build: .
    environment:
      PORT: 3001
      REDIS_HOST: redis

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - app-1
      - app-2
```

### 3.1. Socket.IO Server (Redis Adapter)

```ts
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

const pubClient = new Redis({ host: 'redis' });
const subClient = pubClient.duplicate();

const io = new Server(httpServer, {
  adapter: createAdapter(pubClient, subClient),
  cors: { origin: process.env.CLIENT_URL },
});

// Graceful shutdown ZORUNLU:
process.on('SIGTERM', async () => {
  io.close();  // Tüm bağlantıları kapat
  await pubClient.quit();
  await subClient.quit();
  process.exit(0);
});
```

## 4. STICKY SESSION KONFİGÜRASYONU

Socket.IO scaling yaparken sticky session ZORUNLUDUR. Aynı client'ın istekleri her zaman aynı instance'a gitmeli:

```nginx
upstream socket_nodes {
    ip_hash;  # Sticky session: IP'ye göre yönlendir
    server app-1:3001;
    server app-2:3001;
}

server {
    location /socket.io/ {
        proxy_pass http://socket_nodes;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 5. HEALTHCHECK

```dockerfile
# Socket.IO sunucusu için healthcheck:
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/socket.io/?transport=polling || exit 1
```

## 6. YAPILMAMASI GEREKENLER

- **Çok instance çalıştırıp Redis adapter kullanmama** — Mesajlar sadece bağlı olunan instance'a gider
- **Sticky session olmadan horizontal scaling** — Handshake hatası, bağlantı kopar
- **`SIGTERM`'da soketleri kapatmama** — Aktif bağlantılar aniden kopar
- **Healthcheck'te sadece HTTP port kontrolü** — Socket.IO healthcheck endpoint'ini kontrol et
- **Tüm instance'larda aynı Redis adapter kullanma** — Her instance kendi pub/sub client'ını oluşturmalı
