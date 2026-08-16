<!--
  BU DOSYANIN AMACI:
  Mongoose/MongoDB'nin Docker container'ında doğru yapılandırılmasını, replica set gereksinimlerini ve bağlantı stratejilerini AI'a öğretir.

  İLGİLİ DOSYALAR:
  - 04-frameworks/mongoose/config-rules.md
  - 04-frameworks/mongoose/best-practices.md
  - 03-infrastructures/docker/
-->

# DOCKER + MONGOOSE ENTEGRASYONU

## 1. MULTI-STAGE DOCKERFILE

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build  # TypeScript derlemesi varsa

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER appuser
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## 2. MONGO DB DOCKER COMPOSE

### 2.1. Geliştirme Ortamı

```yaml
services:
  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      mongodb:
        condition: service_healthy
    environment:
      MONGODB_URI: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/mydb?authSource=admin
```

### 2.2. Replica Set (Transaction'lar için ZORUNLU)

MongoDB transaction'ları replica set gerektirir. Development'da single-node replica set:

```yaml
services:
  mongodb:
    image: mongo:7.0
    command: mongod --replSet rs0 --bind_ip_all
    # ... diğer ayarlar aynı
```

```bash
# Container başladıktan sonra replica set'i başlat:
docker exec -it mongodb mongosh --eval "rs.initiate({_id:'rs0', members:[{_id:0, host:'localhost:27017'}]})"
```

## 3. CONNECTION STRING

```env
# Geliştirme (local Docker):
MONGODB_URI=mongodb://admin:password@mongodb:27017/mydb?authSource=admin

# Production (Atlas / yönetilen):
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/mydb?retryWrites=true&w=majority
```

**Container içinde `localhost` KULLANMA.** `localhost` container'ın kendisini işaret eder. Docker Compose'da servis adını kullan: `mongodb:27017`.

## 4. SINGLETON CONNECTION (Serverless Container)

```ts
// lib/mongoose.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,  // Serverless: bağlantı yoksa buffer'lama
      serverSelectionTimeoutMS: 5000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

## 5. YAPILMAMASI GEREKENLER

- **Production'da MongoDB'yi Docker container'da çalıştırma** — MongoDB Atlas veya yönetilen servis kullan
- **Transaction kullanıp replica set kurmama** — `MongoServerError: Transaction numbers are only allowed on a replica set member`
- **Container'da `localhost` bağlantısı** — Servis adını kullan
- **`bufferCommands: true` serverless'ta** — Bağlantı yoksa istekler sonsuza kadar buffer'da bekler
