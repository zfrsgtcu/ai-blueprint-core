<!--
  BU DOSYANIN AMACI:
  Prisma ORM'in monitoring araçlarıyla entegrasyonunu, query performans takibini ve yavaş sorgu tespitini AI'a öğretir.

  İLGİLİ DOSYALAR:
  - 04-frameworks/prisma/config-rules.md
  - 04-frameworks/prisma/best-practices.md
  - 03-infrastructures/monitoring/
-->

# MONITORING + PRISMA ENTEGRASYONU

## 1. PRISMA QUERY LOGGING

```ts
const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
    {
      level: 'query',
      emit: 'event',
    },
  ],
});

// Yavaş sorguları tespit et (100ms üstü):
prisma.$on('query' as any, (e: any) => {
  if (e.duration > 100) {
    console.warn('YAVAŞ SORGU:', {
      query: e.query,
      duration: `${e.duration}ms`,
      params: e.params,
    });
  }
});
```

## 2. SENTRY ENTEGRASYONU

```bash
npm install @sentry/node @prisma/instrumentation
```

```ts
import * as Sentry from '@sentry/node';
import { PrismaInstrumentation } from '@prisma/instrumentation';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    Sentry.prismaIntegration({
      prismaInstrumentation: new PrismaInstrumentation(),
    }),
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
```

## 3. PROMETHEUS METRIK'LERİ

```ts
import { Registry, Counter, Histogram } from 'prom-client';

const register = new Registry();

// Prisma sorgu metrik'leri:
const prismaQueryDuration = new Histogram({
  name: 'prisma_query_duration_ms',
  help: 'Prisma sorgu süresi (ms)',
  labelNames: ['model', 'operation'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
});

prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;

  prismaQueryDuration.observe(
    { model: params.model || 'unknown', operation: params.action },
    duration
  );

  return result;
});
```

## 4. CONNECTION POOL MONITORING

```ts
// Her 30 saniyede bağlantı havuzu durumunu kontrol et:
setInterval(async () => {
  // Prisma connection pool durumu (direct metric yok, engine'den okunur)
  const metrics = await prisma.$metrics.json();
  console.log('Pool:', {
    active: metrics.poolActive,
    idle: metrics.poolIdle,
    waiting: metrics.poolWaiting,
    total: metrics.poolTotal,
  });
}, 30000);
```

## 5. ALERT EŞİKLERİ

| Metrik | Eşik | Önem |
|--------|------|------|
| Sorgu süresi > 500ms | > 5/dakika | HIGH |
| Sorgu süresi > 1000ms | > 1 | CRITICAL |
| Connection pool waiting | > 5 | HIGH |
| Connection pool errors | > 1/dakika | CRITICAL |
| Migration hatası | Herhangi | CRITICAL |

## 6. STRUCTURED LOGGING

```ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});

prisma.$on('query' as any, (e: any) => {
  logger.info({
    msg: 'prisma_query',
    duration_ms: e.duration,
    query: e.query.substring(0, 200), // Tam query'yi loglama, PII riski
  });
});

prisma.$on('error' as any, (e: any) => {
  logger.error({
    msg: 'prisma_error',
    error: e.message,
    target: e.target,
  });
});
```

## 7. YAPILMAMASI GEREKENLER

- **Production'da tüm query'leri loglama** — Log maliyeti ve PII riski (kullanıcı verisi log'da)
- **`$metrics`'i her request'te çağırma** — Engine metrik'leri maliyetli, interval ile oku
- **Sentry'de tracesSampleRate: 1.0 (production)** — Maliyeti katlar, 0.1 yeterli
- **Yavaş sorguları sadece uyarı olarak bırakma** — Alert tetikleyip index eklenmesini sağla
