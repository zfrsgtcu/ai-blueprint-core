<!--
  BU DOSYANIN AMACI:
  Socket.IO uygulamasının Nginx reverse proxy arkasında doğru yapılandırılmasını, WebSocket upgrade yönetimini ve SSL/TLS entegrasyonunu AI'a öğretir.

  İLGİLİ DOSYALAR:
  - 04-frameworks/socket-io/config-rules.md
  - 04-frameworks/socket-io/best-practices.md
  - 03-infrastructures/networking/
  - 05-integrations/docker/docker-socket-io.md
-->

# NETWORKING + SOCKET.IO ENTEGRASYONU

## 1. NGINX REVERSE PROXY (TEK SUNUCU)

```nginx
upstream socket_backend {
    server app:3001;
}

server {
    listen 80;
    server_name example.com;

    # HTTP trafiği (REST API)
    location /api/ {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket trafiği (Socket.IO)
    location /socket.io/ {
        proxy_pass http://socket_backend;
        proxy_http_version 1.1;

        # WebSocket upgrade başlıkları ZORUNLU:
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeout:
        proxy_read_timeout 86400s;  # 24 saat (uzun süreli bağlantı)
        proxy_send_timeout 86400s;
    }
}
```

## 2. HORIZONTAL SCALING (STICKY SESSION)

```nginx
upstream socket_nodes {
    ip_hash;  # Sticky session ZORUNLU
    server app-1:3001 weight=1;
    server app-2:3001 weight=1;
    server app-3:3001 weight=1;
    keepalive 64;  # Keep-alive bağlantı havuzu
}

server {
    location /socket.io/ {
        proxy_pass http://socket_nodes;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400s;
    }
}
```

## 3. SSL/TLS TERMINATION

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/ssl/certs/example.com.crt;
    ssl_certificate_key /etc/ssl/private/example.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # HTTP API
    location /api/ {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-Proto https;  # SSL bilgisini ilet
    }

    # WSS (Secure WebSocket)
    location /socket.io/ {
        proxy_pass http://socket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 86400s;
    }
}

# HTTP → HTTPS redirect:
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
```

## 4. CLIENT BAĞLANTISI

```ts
// Client WSS bağlantısı (production):
const socket = io('wss://example.com', {
  path: '/socket.io/',
  transports: ['websocket'],  // Önce WebSocket, SSL ile daha verimli
  secure: true,
});
```

## 5. RATE LIMITING (Nginx)

```nginx
# IP bazlı rate limiting:
limit_req_zone $binary_remote_addr zone=socket_req:10m rate=10r/s;

server {
    location /socket.io/ {
        limit_req zone=socket_req burst=20 nodelay;
        # ... proxy ayarları
    }
}
```

## 6. CORS (Socket.IO'da Yapılandır)

```ts
// Nginx'te CORS DEĞİL, Socket.IO sunucusunda yapılandır:
const io = new Server(httpServer, {
  cors: {
    origin: ['https://example.com', 'https://admin.example.com'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
```

## 7. YAPILMAMASI GEREKENLER

- **WebSocket için `proxy_read_timeout` varsayılan (60s)** — 1 dakika sonra bağlantı kopar, 86400s yap
- **Sticky session olmadan horizontal scaling** — Socket handshake'i rastgele sunucuya gider, başarısız olur
- **SSL terminasyonu yapmama** — wss:// bağlantıları için ZORUNLU
- **Nginx CORS + Socket.IO CORS aynı anda** — Sadece Socket.IO seviyesinde yap
- **Client'ta `transports: ['websocket']` yapıp polling fallback'i tamamen kapatma** — `['websocket', 'polling']` güvenli
