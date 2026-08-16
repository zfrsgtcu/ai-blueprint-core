<!--
  BU DOSYANIN AMACI:
  AI ajanlarına Nginx, Traefik ve Caddy reverse proxy konfigürasyon şablonları sunar.
  AI, projenin reverse proxy seçimine göre uygun şablonu kullanır.
  Tüm {PLACEHOLDER} değerleri AI tarafından gerçek proje değerleriyle değiştirilir.
-->

# NETWORKING TEMPLATES

## Template 1: Nginx Reverse Proxy (Önerilen — Default)

Dosya yolu: `nginx/nginx.conf`

```nginx
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # =========================================================================
    # TEMEL AYARLAR
    # =========================================================================
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    client_max_body_size 10m;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # =========================================================================
    # LOG FORMATI (JSON — Loki/Promtail için)
    # =========================================================================
    log_format json_logs escape=json '{'
        '"timestamp": "$time_iso8601", '
        '"remote_addr": "$remote_addr", '
        '"request": "$request", '
        '"status": $status, '
        '"body_bytes_sent": $body_bytes_sent, '
        '"request_time": $request_time, '
        '"http_referer": "$http_referer", '
        '"http_user_agent": "$http_user_agent", '
        '"http_x_forwarded_for": "$http_x_forwarded_for", '
        '"upstream_addr": "$upstream_addr", '
        '"upstream_response_time": "$upstream_response_time"'
    '}';

    access_log /var/log/nginx/access.log json_logs;
    error_log /var/log/nginx/error.log warn;

    # =========================================================================
    # GZIP SIKIŞTIRMA
    # =========================================================================
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 5;
    gzip_min_length 1000;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        application/xml+rss
        image/svg+xml
        font/ttf
        font/woff
        font/woff2;

    # =========================================================================
    # RATE LIMITING ZONES
    # =========================================================================
    limit_req_zone $binary_remote_addr zone=ratelimit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;
    limit_req_zone $binary_remote_addr zone=static_limit:10m rate=100r/s;

    # =========================================================================
    # UPSTREAM TANIMLARI
    # =========================================================================
    upstream frontend_upstream {
        server frontend:{FRONTEND_PORT};
        keepalive 32;
    }

    upstream backend_upstream {
        server backend:{BACKEND_PORT};
        keepalive 32;
    }

    # =========================================================================
    # HTTP → HTTPS YÖNLENDİRME
    # =========================================================================
    server {
        listen 80;
        server_name {DOMAIN} www.{DOMAIN} api.{DOMAIN} monitoring.{DOMAIN};

        # Let's Encrypt ACME challenge
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # =========================================================================
    # HTTPS — ANA DOMAIN (FRONTEND)
    # =========================================================================
    server {
        listen 443 ssl http2;
        server_name {DOMAIN} www.{DOMAIN};

        # SSL
        ssl_certificate /etc/letsencrypt/live/{DOMAIN}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/{DOMAIN}/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
        # add_header Content-Security-Policy "default-src 'self'; ..." always;  # Projeye özel

        # www → non-www yönlendirmesi
        if ($host = 'www.{DOMAIN}') {
            return 301 https://{DOMAIN}$request_uri;
        }

        # Rate limiting
        limit_req zone=ratelimit burst=20 nodelay;

        # Proxy buffer ayarları
        proxy_buffer_size 4k;
        proxy_buffers 8 16k;
        proxy_busy_buffers_size 32k;
        proxy_read_timeout 60s;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;

        location / {
            proxy_pass http://frontend_upstream;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";
        }

        # Statik dosyalar için cache
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend_upstream;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";

            expires 30d;
            add_header Cache-Control "public, immutable";
            limit_req zone=static_limit burst=200 nodelay;
        }
    }

    # =========================================================================
    # HTTPS — API (BACKEND)
    # =========================================================================
    server {
        listen 443 ssl http2;
        server_name api.{DOMAIN};

        # SSL (ana domain ile aynı wildcard veya ayrı sertifika)
        ssl_certificate /etc/letsencrypt/live/api.{DOMAIN}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.{DOMAIN}/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;

        # Rate limiting
        limit_req zone=api_limit burst=50 nodelay;

        # Proxy buffer ayarları
        proxy_buffer_size 4k;
        proxy_buffers 8 16k;
        proxy_busy_buffers_size 32k;
        proxy_read_timeout 60s;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;

        # CORS — Preflight
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://{DOMAIN}';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With';
            add_header 'Access-Control-Max-Age' 86400;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        location / {
            proxy_pass http://backend_upstream;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";

            # CORS — Normal istekler
            add_header 'Access-Control-Allow-Origin' 'https://{DOMAIN}' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With' always;
        }

        # Auth endpoint'leri için ekstra rate limiting
        location ~ ^/(api/)?(auth|login|register|forgot-password) {
            limit_req zone=auth_limit burst=10 nodelay;
            proxy_pass http://backend_upstream;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";
        }
    }

    # =========================================================================
    # HTTPS — MONITORING (IP Whitelist + Basic Auth)
    # =========================================================================
    server {
        listen 443 ssl http2;
        server_name monitoring.{DOMAIN};

        ssl_certificate /etc/letsencrypt/live/monitoring.{DOMAIN}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/monitoring.{DOMAIN}/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';

        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;

        # Basic Auth
        auth_basic "Monitoring Dashboard";
        auth_basic_user_file /etc/nginx/.htpasswd;

        # IP Whitelist (opsiyonel — ofis/VPN IP'leri)
        # allow {OFFICE_IP};
        # deny all;

        location / {
            proxy_pass http://grafana:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

---

## Template 2: Nginx Docker Compose Eklentisi

Dosya yolu: Ana `docker-compose.yaml` içine eklenecek servis tanımı.

```yaml
  nginx:
    image: nginx:1.27-alpine
    container_name: {PROJECT_NAME}-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/.htpasswd:/etc/nginx/.htpasswd:ro
      - certbot_data:/var/www/certbot
      - letsencrypt_data:/etc/letsencrypt
    networks:
      - app_network
    depends_on:
      frontend:
        condition: service_healthy
      backend:
        condition: service_healthy
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  certbot:
    image: certbot/certbot:v2.10.0
    container_name: {PROJECT_NAME}-certbot
    restart: unless-stopped
    volumes:
      - certbot_data:/var/www/certbot
      - letsencrypt_data:/etc/letsencrypt
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - app_network

volumes:
  certbot_data:
    name: {PROJECT_NAME}_certbot_data
  letsencrypt_data:
    name: {PROJECT_NAME}_letsencrypt_data
```

---

## Template 3: Traefik (Container-Native Alternatif)

Dosya yolu: `traefik/traefik.yml`

```yaml
# Traefik statik konfigürasyon
global:
  sendAnonymousUsage: false

api:
  dashboard: true
  insecure: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
          permanent: true

  websecure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: app_network

certificatesResolvers:
  letsencrypt:
    acme:
      email: {ADMIN_EMAIL}
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web

log:
  level: INFO
  format: json

accessLog:
  format: json
```

**Traefik Docker Compose Eklentisi:**
```yaml
  traefik:
    image: traefik:v3.1
    container_name: {PROJECT_NAME}-traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/traefik.yml:/etc/traefik/traefik.yml:ro
      - traefik_data:/letsencrypt
    networks:
      - app_network
```

---

## Template 4: Caddy (Basit Alternatif)

Dosya yolu: `caddy/Caddyfile`

```caddyfile
{
    email {ADMIN_EMAIL}
    admin off
}

{DOMAIN}, www.{DOMAIN} {
    encode gzip zstd
    reverse_proxy frontend:{FRONTEND_PORT}

    header {
        X-Frame-Options "DENY"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        Strict-Transport-Security "max-age=63072000; includeSubDomains"
    }
}

api.{DOMAIN} {
    encode gzip zstd
    reverse_proxy backend:{BACKEND_PORT}

    header {
        Access-Control-Allow-Origin "https://{DOMAIN}"
        X-Frame-Options "DENY"
        X-Content-Type-Options "nosniff"
        Strict-Transport-Security "max-age=63072000; includeSubDomains"
    }

    @auth {
        path /auth/* /login /register /forgot-password
    }
    rate_limit @auth 5r/s
}

monitoring.{DOMAIN} {
    basicauth {
        admin $2a$14$hashed_password
    }
    reverse_proxy grafana:3000
}
```

---

## AI KULLANIM KURALLARI

1. Default olarak **Nginx** kullan. Sadece projede Docker container etiketleriyle otomatik keşif isteniyorsa Traefik, basitlik ön plandaysa Caddy seç.

2. `nginx.conf` template'indeki tüm `{PLACEHOLDER}` değerlerini değiştir:
   - `{PROJECT_NAME}` → proje adı (kebab-case)
   - `{DOMAIN}` → ana domain (örn: `myapp.com`)
   - `{FRONTEND_PORT}` → frontend'in çalıştığı port (örn: `3000`)
   - `{BACKEND_PORT}` → backend'in çalıştığı port (örn: `5000`)
   - `{ADMIN_EMAIL}` → SSL sertifika bildirimleri için email

3. CSP header'ını projeye özel olarak yapılandır. Statik kaynakların nereden yüklendiğine göre CSP politikasını belirle.

4. Monitoring için `.htpasswd` oluştur ve dokümantasyona ekle:
   ```bash
   htpasswd -c nginx/.htpasswd admin
   ```

5. `.env` dosyasına domain ve email bilgilerini ekle:
   ```
   DOMAIN=myapp.com
   ADMIN_EMAIL=admin@myapp.com
   ```

6. Networking dizin yapısını oluştur:
   ```
   networking/
   └── nginx/
       ├── nginx.conf
       └── .htpasswd
   ```
