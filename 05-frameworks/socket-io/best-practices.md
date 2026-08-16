<!--
  BU DOSYANIN AMACI:
  Socket.IO ile performanslı real-time iletişim pattern'leri, scaling stratejileri ve yaygın hatalardan kaçınma yöntemlerini AI'a öğretir.
-->

# SOCKET.IO BEST PRACTICES

## 1. CONNECTION YÖNETİMİ

### 1.1. Connection Pool (Server)

Her server ~10K concurrent connection destekler. Daha fazlası için scaling gerekir.

```ts
// Connection limit kontrolü:
io.engine.on('connection_error', (err) => {
  console.error('Connection hatası:', err.message);
});

// Sunucu kapasitesini aşmayın:
setInterval(() => {
  const count = io.engine.clientsCount;
  console.log(`Aktif bağlantı: ${count}`);
  if (count > 8000) {
    console.warn('Yüksek bağlantı sayısı!');
  }
}, 30000);
```

### 1.2. Heartbeat (Ping/Pong)

```ts
const io = new Server(httpServer, {
  pingInterval: 25000,  // 25 saniyede bir ping
  pingTimeout: 20000,   // 20 saniye cevap yoksa disconnect
  // Mobil ağlarda daha uzun timeout: 60000
});
```

## 2. EVENT PATTERN'LERİ

### 2.1. Olay Adlandırma Standardı

```
domain:action
domain:entity:action
```

```ts
// DOĞRU isimlendirme:
socket.emit('order:created', orderData);
socket.on('chat:message:received', handler);

// YANLIŞ:
socket.emit('newOrder');
socket.on('getChat', handler);
```

### 2.2. Acknowledgement (Callback)

```ts
// Server:
socket.on('order:create', async (data, callback) => {
  try {
    const order = await createOrder(data);
    callback({ success: true, order }); // Client'a cevap
  } catch (err) {
    callback({ success: false, error: err.message });
  }
});

// Client:
socket.emit('order:create', orderData, (response) => {
  if (response.success) {
    console.log('Sipariş oluşturuldu:', response.order);
  } else {
    console.error('Hata:', response.error);
  }
});
```

### 2.3. Typed Events (TypeScript)

```ts
// types/socket.ts
interface ServerToClientEvents {
  'notification:new': (notification: Notification) => void;
  'chat:message': (message: ChatMessage) => void;
  'order:status:updated': (order: Order) => void;
}

interface ClientToServerEvents {
  'chat:message:send': (data: { roomId: string; text: string }) => void;
  'order:subscribe': (orderId: string) => void;
}

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);
const socket = io<ServerToClientEvents, ClientToServerEvents>(url);
```

## 3. PERFORMANS OPTİMİZASYONU

### 3.1. Event Batching

```ts
// KÖTÜ: Her ürün güncellemesi için ayrı event
products.forEach(p => socket.emit('product:updated', p));

// İYİ: Batch event
socket.emit('products:batch:updated', { products, timestamp: Date.now() });
```

### 3.2. Payload Boyutu

Socket.IO mesajları 1MB ile sınırlandırılmalıdır. Binary veri (dosya) için ayrı endpoint kullan:

```ts
// KÖTÜ: Dosyayı Socket.IO ile gönderme
socket.emit('file:upload', { buffer: fileBuffer }); // 5MB?

// İYİ: Dosya için HTTP upload endpoint
const formData = new FormData();
formData.append('file', file);
await fetch('/api/upload', { method: 'POST', body: formData });
// Socket ile sadece upload tamamlandı bildirimi:
socket.emit('file:uploaded', { fileId, url });
```

## 4. ERROR HANDLING

```ts
// Server-side error handler:
io.on('connection', (socket) => {
  socket.on('error', (err) => {
    console.error(`Socket ${socket.id} hatası:`, err);
  });

  // Event handler'larda try-catch ZORUNLU:
  socket.on('data:process', async (data, callback) => {
    try {
      const result = await processData(data);
      callback?.({ ok: true, result });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });
});

// Client-side reconnect:
const socket = io(url, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
});

socket.on('connect_error', (err) => {
  console.error('Bağlantı hatası:', err.message);
  // Kullanıcıya bildirim göster
});
```

## 5. GÜVENLİK

### 5.1. Rate Limiting

```ts
import { RateLimiter } from 'limiter';

const limiters = new Map<string, RateLimiter>();

io.use((socket, next) => {
  const ip = socket.handshake.address;
  if (!limiters.has(ip)) {
    limiters.set(ip, new RateLimiter({ tokensPerInterval: 30, interval: 'minute' }));
  }
  next();
});

socket.on('chat:message:send', async (data) => {
  const limiter = limiters.get(socket.handshake.address);
  const remaining = await limiter.removeTokens(1);
  if (remaining < 0) {
    socket.emit('error', { message: 'Çok fazla mesaj, yavaşlayın' });
    return;
  }
  // Mesajı işle
});
```

### 5.2. Input Validation

```ts
import { z } from 'zod';

const messageSchema = z.object({
  roomId: z.string().uuid(),
  text: z.string().min(1).max(500),
});

socket.on('chat:message:send', (data, callback) => {
  const parsed = messageSchema.safeParse(data);
  if (!parsed.success) {
    return callback?.({ ok: false, error: 'Geçersiz mesaj formatı' });
  }
  // İşle
});
```

## 6. YAPILMAMASI GEREKENLER

- **Event handler içinde `await` olmadan async işlem** — Hata yutulur
- **Aynı client 5'ten fazla connection açmasına izin ver** — IP başına limit koy
- **Production'da debug log açık** — Tüm event'leri konsola basar
- **Büyük JSON objelerini event olarak gönderme** — Max 10KB hedefle
- **`socket.broadcast.emit` ile tüm client'lara gönderme** — Gereksiz ağ trafiği, room kullan
- **Socket.IO ile state management** — State için Zustand/Redux, socket sadece transport
