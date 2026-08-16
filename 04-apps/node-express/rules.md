<!--
  BU DOSYANIN AMACI:
  AI ajanlarına Node.js + Express.js (TypeScript) ile proje geliştirirken uyması gereken best practice kurallarını öğretir.
  Express routing, JWT auth, Zod validation, MongoDB/Mongoose veya MSSQL/Prisma, error handling,
  ve Vercel serverless deployment kurallarını kapsar.
-->

# NODE.JS + EXPRESS (TYPESCRIPT) — BEST PRACTICE RULES

## 1. GENEL PRENSİPLER

Node.js + Express, TypeScript ile yazılmış hafif ve hızlı REST API'ler için idealdir. MVC benzeri yapı: Routes (controller), Services (iş mantığı), Models (veri). Tüm I/O async/await.

1. 🔴 **ZORUNLU:** TypeScript kullan — `.ts` uzantılı, strict mode açık.
2. 🔴 **ZORUNLU:** Async/await ile tüm I/O operasyonları — callback kullanma.
3. 🔴 **ZORUNLU:** Route → Service → Model katman ayrımı.
4. 🔴 **ZORUNLU:** Environment variables `.env` dosyasından, `dotenv` ile yüklenmeli.

## 2. PROJE YAPISI KURALLARI

```
src/
├── index.ts          # Uygulama giriş noktası
├── config/
│   └── env.ts        # Environment variable doğrulama (Zod)
├── routes/
│   └── {{modelName}}s.ts  # Route handler'lar
├── models/
│   └── {{ModelName}}.ts   # Veritabanı modeli (Mongoose/Prisma)
├── services/
│   └── {{modelName}}.service.ts  # İş mantığı
├── middleware/
│   ├── auth.ts       # JWT doğrulama
│   ├── errorHandler.ts  # Global hata yakalama
│   └── validate.ts   # Zod validation middleware
└── types/
    └── index.ts      # Paylaşılan tipler
```

1. 🔴 **ZORUNLU:** Bu dizin yapısına sadık kal.
2. 🔴 **ZORUNLU:** `src/config/env.ts` — tüm environment variable'lar Zod ile doğrulansın, `process.env` direkt kullanma.
3. 🟡 **ÖNERİLEN:** Her domain entity'si için ayrı route/service/model dosyası.

```typescript
// src/config/env.ts — ZORUNLU
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

export const env = envSchema.parse(process.env);
```

## 3. EXPRESS ROUTE KURALLARI

1. 🔴 **ZORUNLU:** Her route dosyası `express.Router()` export etmeli.
2. 🔴 **ZORUNLU:** Route path'leri çoğul: `/api/{{model_names}}`.
3. 🔴 **ZORUNLU:** Route handler sadece HTTP istek/yanıt yönetir, iş mantığı service'te.
4. 🟡 **ÖNERİLEN:** Route dosyaları `index.ts` ile barrel export.

```typescript
// src/routes/{{modelName}}s.ts — STANDART YAPI
import { Router } from 'express';
import * as {{modelName}}Service from '../services/{{modelName}}.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { create{{ModelName}}Schema, update{{ModelName}}Schema } from '../types';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await {{modelName}}Service.getAll();
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await {{modelName}}Service.getById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, validate(create{{ModelName}}Schema), async (req, res, next) => {
  try {
    const item = await {{modelName}}Service.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, validate(update{{ModelName}}Schema), async (req, res, next) => {
  try {
    const item = await {{modelName}}Service.update(req.params.id, req.body);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const deleted = await {{modelName}}Service.remove(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
```

## 4. ZOD VALIDATION KURALLARI

1. 🔴 **ZORUNLU:** Tüm request body/query/params Zod ile doğrulanmalı.
2. 🔴 **ZORUNLU:** Environment variables Zod ile doğrulanmalı (`src/config/env.ts`).
3. 🟡 **ÖNERİLEN:** Schema'lar `src/types/` altında, route başına ayrı dosya.
4. 🟠 **YASAK:** `req.body` validation olmadan kullanmak — güvenlik açığı.

```typescript
// src/types/{{modelName}}.types.ts — Zod Schema ÖRNEK
import { z } from 'zod';

export const create{{ModelName}}Schema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
  }),
});

export type Create{{ModelName}}Input = z.infer<typeof create{{ModelName}}Schema>['body'];
```

## 5. JWT AUTHENTICATION KURALLARI

1. 🔴 **ZORUNLU:** Auth middleware `req.headers.authorization` Bearer token'ı doğrulamalı.
2. 🔴 **ZORUNLU:** Doğrulanan kullanıcı `(req as AuthRequest).user`'a eklenmeli.
3. 🔴 **ZORUNLU:** JWT secret en az 256-bit, `.env`'de, production'da Vercel env.
4. 🟡 **ÖNERİLEN:** Refresh token + access token ikilisi, HTTP-only cookie.

## 6. ERROR HANDLING KURALLARI

1. 🔴 **ZORUNLU:** Global error handler middleware — 4 parametreli `(err, req, res, next)`.
2. 🔴 **ZORUNLU:** Route'larda try-catch + `next(err)` pattern'i.
3. 🟡 **ÖNERİLEN:** Custom `AppError` sınıfı (statusCode, message, isOperational).
4. 🟠 **YASAK:** Production'da stack trace döndürmek.

## 7. VERİTABANI KURALLARI

### MongoDB / Mongoose
1. 🔴 **ZORUNLU:** Schema'lar `src/models/` altında, PascalCase dosya adı.
2. 🔴 **ZORUNLU:** Connection string `.env`'de, production'da Vercel env.
3. 🟡 **ÖNERİLEN:** Mongoose plugin'leri: timestamps, soft delete (mongoose-delete).

### MSSQL / Prisma
1. 🔴 **ZORUNLU:** `prisma/schema.prisma` dosyası proje kökünde.
2. 🔴 **ZORUNLU:** Migration: `npx prisma migrate dev --name <name>`.
3. 🔴 **ZORUNLU:** `@prisma/client` singleton — `src/config/database.ts`'te tek instance.

## 8. GÜVENLİK KURALLARI

1. 🔴 **ZORUNLU:** `helmet` middleware — HTTP header güvenliği.
2. 🔴 **ZORUNLU:** `cors` middleware — belirli origin'ler, wildcard yok.
3. 🔴 **ZORUNLU:** Rate limiting — `express-rate-limit` (opsiyonel ama önerilen).
4. 🟠 **YASAK:** `eval()`, `Function()` constructor — code injection riski.
5. 🟡 **ÖNERİLEN:** `express-mongo-sanitize` (MongoDB için NoSQL injection önlemi).

## 9. DEPLOYMENT KURALLARI (Vercel)

1. 🔴 **ZORUNLU:** `vercel.json` ile serverless function konfigürasyonu.
2. 🔴 **ZORUNLU:** Root'ta `api/` klasörü yerine `vercel.json`'da `src/index.ts`'i işaret et.
3. 🔴 **ZORUNLU:** Environment variables Vercel dashboard'da.
4. 🟡 **ÖNERİLEN:** Cold start için dependencies'i minimize et.

```json
// vercel.json
{
  "builds": [{ "src": "src/index.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/index.ts" }]
}
```

## 10. YAYGIN HATALAR (AI'NIN KAÇINMASI GEREKENLER)

1. ❌ **Callback pattern kullanmak** — async/await kullan.
2. ❌ **Validation yapmadan `req.body` kullanmak** — güvenlik ve veri bütünlüğü.
3. ❌ **`process.env` direkt kullanmak** — `src/config/env.ts` üzerinden Zod ile doğrulanmış env kullan.
4. ❌ **Hata yakalamayı unutmak** — her route try-catch + next(err).
5. ❌ **Production'da stack trace döndürmek** — bilgi sızıntısı.
6. ❌ **CORS'u `*` ile açmak** — belirli origin'ler tanımla.
7. ❌ **Callback'te `res.json()` sonrası `return` yazmamak** — "headers already sent" hatası.

## 11. DİZİN YAPISI KONTROL LİSTESİ

AI, oluşturduğu Node.js Express projesinde şunları kontrol etmelidir:

- [ ] `src/index.ts` mevcut — Express app oluşturma, middleware kaydı, server start
- [ ] `src/config/env.ts` mevcut — Zod ile environment variable doğrulama
- [ ] `src/routes/` klasörü mevcut — domain route dosyaları
- [ ] `src/models/` klasörü mevcut — Mongoose schema veya Prisma model
- [ ] `src/services/` klasörü mevcut — iş mantığı
- [ ] `src/middleware/auth.ts` mevcut — JWT doğrulama
- [ ] `src/middleware/errorHandler.ts` mevcut — global error handler
- [ ] `src/middleware/validate.ts` mevcut — Zod validation middleware
- [ ] `package.json`'da gerekli bağımlılıklar: express, cors, helmet, dotenv, zod
- [ ] `tsconfig.json` mevcut — strict mode, ES2022 target, outDir
- [ ] `.env.example` mevcut (`.env` gitignore'da)
- [ ] Tüm route'larda try-catch + next(err)
- [ ] CORS origin'leri environment variable'dan
- [ ] `helmet()` kullanılmış
