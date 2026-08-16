<!--
  BU DOSYANIN AMACI:
  Prisma ORM'in Docker container'ında doğru yapılandırılmasını, multi-stage build optimizasyonunu ve serverless container tuzaklarını AI'a öğretir.

  İLGİLİ DOSYALAR:
  - 04-frameworks/prisma/config-rules.md
  - 04-frameworks/prisma/best-practices.md
  - 03-infrastructures/docker/
-->

# DOCKER + PRISMA ENTEGRASYONU

## 1. MULTI-STAGE DOCKERFILE

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci --only=production

# Stage 2: Prisma Client Generate
FROM node:20-alpine AS generate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma/
RUN npx prisma generate

# Stage 3: Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=generate --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=generate --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=generate --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --chown=nextjs:nodejs . .

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

## 2. MIGRATION STRATEJİSİ

### 2.1. Container Başlatma Sırası

```yaml
# docker-compose.yaml
services:
  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build: .
    depends_on:
      db:
        condition: service_healthy  # DB hazır olana kadar bekle
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/mydb
    command: >
      sh -c "npx prisma migrate deploy && node server.js"
```

### 2.2. Migration Komutu

```bash
# Container içinde MUTLAKA bunu kullan:
npx prisma migrate deploy

# ASLA production container'da bunu KULLANMA:
npx prisma migrate dev  # Development için, prompt bekler!
npx prisma db push      # Migration olmadan şemayı zorla değiştirir
```

## 3. ENVIRONMENT VARIABLES

```env
# .env (development)
DATABASE_URL=postgresql://postgres:password@localhost:5432/mydb

# Container'da ENV değişkeni olarak geç
# docker run -e DATABASE_URL=postgresql://...
# VEYA docker-compose.yaml'da environment bloğunda
```

**Prisma Client, build zamanında DATABASE_URL'e İHTİYAÇ DUYMAZ.** `prisma generate` sadece şemayı okur, veritabanına bağlanmaz. Bu yüzden multi-stage build'de DATABASE_URL sadece runtime stage'de gereklidir.

## 4. SERVERLESS CONTAINER (Next.js Özel)

```dockerfile
# Next.js + Prisma için özel Dockerfile:
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
COPY prisma ./prisma/
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "server.js"]
```

**Serverless Container uyarısı:** Her request yeni bir Lambda/container başlatıyorsa, connection pool limit'ini 1-3 arası tut. Aksi halde veritabanı bağlantı limitini aşarsın.

## 5. YAPILMAMASI GEREKENLER

- **Production container'da `prisma migrate dev`** — Interaktif prompt bekler, container donar
- **`prisma generate`'i runtime'da yapma** — Build time'da yap, `.prisma/client` output'unu kopyala
- **Multi-stage build'de `COPY node_modules` yapma** — Sadece `.prisma` ve `@prisma` dizinlerini kopyala
- **DB migration'ı app başlangıcında otomatik yapma (production)** — CI/CD pipeline'ında kontrol ederek yap
