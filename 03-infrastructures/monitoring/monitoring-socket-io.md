<!--
  BU DOSYANIN AMACI:
  Socket.IO server'ının monitoring araçlarıyla entegrasyonunu, bağlantı metrik'lerini ve real-time uygulama gözlemlenebilirliğini AI'a öğretir.

  İLGİLİ DOSYALAR:
  - 04-frameworks/socket-io/config-rules.md
  - 04-frameworks/socket-io/best-practices.md
  - 03-infrastructures/monitoring/
-->

# MONITORING + SOCKET.IO ENTEGRASYONU

## 1. SOCKET.IO METRİK'LERİ

```ts
import { Server } from 'socket.io';
import { Registry, Counter, Gauge } from 'prom-client';

const register = new Registry();

const connectedClients = new Gauge({
  name: 'socket_io_connected_clients',
  help: 'Aktif bağlı client sayısı',
  registers: [register],
});

const eventsTotal = new Counter({
  name: 'socket_io_events_total',
  help: 'Toplam Socket.IO event sayısı',
  labelNames: ['event', 'direction'], // direction: 'received' | 'sent'
  registers: [register],
});

const connectionErrors = new Counter({
  name: 'socket_io_connection_errors_total',
  help: 'Bağlantı hataları',
  labelNames: ['reason'],
  registers: [register],
});
```

## 2. METRİK TOPLAMA

```ts
const io = new Server(httpServer);

// Her 10 saniyede bağlantı sayısını güncelle:
setInterval(() => {
  connectedClients.set(io.engine.clientsCount);
}, 10000);

io.on('connection', (socket) => {
  // Bağlantı metrik'leri:
  socket.on('disconnect', (reason) => {
    if (reason !== 'client namespace disconnect') {
      connectionErrors.inc({ reason });
    }
  });

  // Event metrik'leri (hooked via proxy):
  const originalEmit = socket.emit.bind(socket);
  socket.emit = function (event: string, ...args: any[]) {
    eventsTotal.inc({ event, direction: 'sent' });
    return originalEmit(event, ...args);
  };

  // Gelen event'ler:
  socket.onAny((event) => {
    eventsTotal.inc({ event, direction: 'received' });
  });
});
```

## 3. HEALTH ENDPOINT

```ts
import express from 'express';

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    socketConnections: io.engine.clientsCount,
    memory: process.memoryUsage(),
    timestamp: Date.now(),
  });
});

// Detaylı health (internal):
app.get('/health/detailed', async (req, res) => {
  const redisPing = await pubClient.ping().catch(() => 'FAIL');

  res.json({
    status: redisPing === 'PONG' ? 'ok' : 'degraded',
    socket: {
      connected: io.engine.clientsCount,
      rooms: io.sockets.adapter.rooms.size,
    },
    redis: redisPing === 'PONG' ? 'connected' : 'disconnected',
  });
});
```

## 4. SENTRY ENTEGRASYONU

```ts
import * as Sentry from '@sentry/node';

Sentry.init({ dsn: process.env.SENTRY_DSN });

io.on('connection', (socket) => {
  socket.on('error', (err) => {
    Sentry.captureException(err, {
      tags: { component: 'socket-io' },
      extra: {
        socketId: socket.id,
        userId: socket.data.user?.id,
      },
    });
  });

  // Event handler hatalarını Sentry'e gönder:
  const handlers = new Map<string, Function>();

  socket.onAny(async (event, ...args) => {
    try {
      // Handler'ları çalıştır...
    } catch (err) {
      Sentry.captureException(err, {
        tags: { component: 'socket-io', event },
        extra: { socketId: socket.id },
      });
    }
  });
});
```

## 5. DASHBOARD METRİK'LERİ

```ts
// Prometheus metrics endpoint:
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

```yaml
# docker-compose.yaml'da Prometheus + Grafana:
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"  # Grafana UI port'u
```

## 6. ALERT EŞİKLERİ

| Metrik | Eşik | Önem |
|--------|------|------|
| Bağlantı sayısı aniden düşmesi | 1 dakikada %50+ | CRITICAL |
| Connection error rate | > 10/dakika | HIGH |
| Event işleme süresi | > 1000ms | HIGH |
| Redis adapter bağlantı kopması | Herhangi | CRITICAL |

## 7. YAPILMAMASI GEREKENLER

- **Her socket event'inde `Sentry.captureException`** — 10K event = 10K Sentry hatası, rate limit
- **Prometheus metrik'lerini `socket.emit` override ile bozmak** — Orijinal emit referansını sakla
- **Health endpoint'i public** — Internal detayları sadece monitoring ağına expose et
- **Bağlantı metrik'lerini toplamama** — Scaling kararları için bağlantı trendleri kritik
