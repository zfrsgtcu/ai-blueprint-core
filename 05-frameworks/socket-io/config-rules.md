<!--
  BU DOSYANIN AMACI:
  Socket.IO'nun framework'e göre doğru kurulumunu, CORS yapılandırmasını ve scaling stratejilerini AI'a öğretir.
-->

# SOCKET.IO CONFIGURATION RULES

## 1. KURULUM

```bash
# Server
npm install socket.io

# Client
npm install socket.io-client
```

### 1.1. Versiyon Uyumu

| Server (socket.io) | Client (socket.io-client) |
|-------------------|--------------------------|
| v4.x | v4.x |
| v3.x | v3.x |

**Server ve client MAJOR versiyonları aynı olmalıdır.** v3 server ↔ v4 client çalışmaz.

## 2. SERVER KONFİGÜRASYONU

### 2.1. Express + Socket.IO

```ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,       // 60s cevap yoksa disconnect
  pingInterval: 25000,      // 25s'de bir ping
  connectTimeout: 45000,    // Bağlantı timeout
  maxHttpBufferSize: 1e6,  // Max mesaj boyutu: 1MB
});

io.on('connection', (socket) => {
  console.log('Client bağlandı:', socket.id);

  socket.on('disconnect', (reason) => {
    console.log('Client ayrıldı:', reason);
  });
});

httpServer.listen(3001);
```

### 2.2. Next.js API Route ile Socket.IO

```ts
// pages/api/socket.ts (Pages Router)
import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      cors: { origin: '*' },
    });

    io.on('connection', (socket) => {
      console.log('Client bağlandı');
    });

    res.socket.server.io = io;
  }
  res.end();
}
```

**Next.js'te Socket.IO'yu API route üzerinden başlat.** `res.socket.server.io` ile singleton tut.

### 2.3. Nuxt 3 + Socket.IO

```ts
// server/plugins/socket.io.ts
import { Server } from 'socket.io';

export default defineNitroPlugin((nitroApp) => {
  const io = new Server(nitroApp.httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    // ...
  });
});
```

## 3. CLIENT KONFİGÜRASYONU

### 3.1. React / Next.js

```tsx
'use client'; // Next.js App Router'da ZORUNLU

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(url: string = process.env.NEXT_PUBLIC_SOCKET_URL!) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(url, {
      transports: ['websocket', 'polling'], // Önce WebSocket, fallback polling
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,     // Max 10 deneme
      reconnectionDelay: 1000,      // 1s bekle
      reconnectionDelayMax: 10000,  // Max 10s bekle
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect(); // ZORUNLU: cleanup
    };
  }, [url]);

  return socketRef;
}
```

### 3.2. Vue 3

```ts
// composables/useSocket.ts
import { io, Socket } from 'socket.io-client';
import { onBeforeUnmount, ref } from 'vue';

export function useSocket(url: string) {
  const socket = ref<Socket | null>(null);
  const isConnected = ref(false);

  socket.value = io(url);

  socket.value.on('connect', () => {
    isConnected.value = true;
  });

  socket.value.on('disconnect', () => {
    isConnected.value = false;
  });

  onBeforeUnmount(() => {
    socket.value?.disconnect();
  });

  return { socket, isConnected };
}
```

## 4. ROOM VE NAMESPACE

```ts
// Namespace (domain'e göre ayırma)
const chatNamespace = io.of('/chat');
const adminNamespace = io.of('/admin');

chatNamespace.on('connection', (socket) => {
  // Oda bazlı mesajlaşma
  socket.on('join:room', (roomId: string) => {
    socket.join(roomId);
    // Odaya mesaj gönder
    chatNamespace.to(roomId).emit('user:joined', { userId: socket.id });
  });

  socket.on('leave:room', (roomId: string) => {
    socket.leave(roomId);
  });

  socket.on('message:send', ({ roomId, text }) => {
    chatNamespace.to(roomId).emit('message:new', {
      userId: socket.id,
      text,
      timestamp: Date.now(),
    });
  });
});
```

## 5. AUTH MIDDLEWARE

```ts
import jwt from 'jsonwebtoken';

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication token gerekli'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    socket.data.user = decoded; // Socket'e kullanıcı bilgisini ekle
    next();
  } catch (err) {
    next(new Error('Geçersiz token'));
  }
});

// Client'ta token ile bağlan:
const socket = io('http://localhost:3001', {
  auth: { token: 'jwt-token-here' },
});
```

## 6. SCALING (REDIS ADAPTER)

```bash
npm install @socket.io/redis-adapter
```

```ts
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

const pubClient = new Redis();
const subClient = pubClient.duplicate(); // Pub/Sub için ayrı bağlantı

io.adapter(createAdapter(pubClient, subClient));
```

Birden fazla server instance'ı varsa Redis adapter ZORUNLUDUR.

## 7. YAPILMAMASI GEREKENLER

- **Scaling yaparken Redis adapter kullanmama** — Mesajlar sadece bağlı olduğu server'a gider
- **HTTP endpoint ile socket'i karıştırma** — Socket.IO event-driven, REST request-response
- **Client'ta `disconnect()` çağırmayı unutma** — Memory leak ve connection şişmesi
- **`maxHttpBufferSize` limitsiz** — Büyük mesajlar DoS riski
- **CORS'u `origin: '*'` production'da** — Güvenlik açığı
- **Her event için aynı socket odası** — Room/namespace ile domain ayırımı yap
