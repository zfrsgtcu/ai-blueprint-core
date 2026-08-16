<!--
  BU DOSYANIN AMACI:
  AI ajanlarına networking katmanının üretim ortamı kurallarını öğretir.
  Reverse proxy, SSL/TLS, güvenlik başlıkları, rate limiting ve CORS konfigürasyonlarını kapsar.
-->

# NETWORKING RULES

## 1. GENEL PRENSİPLER

Reverse proxy, dış dünya ile uygulama arasındaki kapıdır. Tüm trafik bu katmandan geçer.

**Altın Kurallar:**
- Uygulama portları (3000, 5000, 8080 vb.) ASLA doğrudan internete açılmaz — her zaman reverse proxy arkasında çalışır
- Production'da HTTP → HTTPS yönlendirmesi zorunludur
- www → non-www veya tam tersi yönlendirme tutarlı olmalıdır (birini seç, ona yönlendir)
- Tüm production domain'lerinde geçerli SSL sertifikası bulunmalıdır

## 2. REVERSE PROXY SEÇİM KURALLARI

AI, projenin ihtiyacına göre reverse proxy seçer:

| Durum | Seçim | Sebep |
|-------|-------|-------|
| Genel kullanım, yüksek performans | **Nginx** | En yaygın, en çok kaynak, en iyi performans |
| Docker container'lar ile çalışıyorsa | **Traefik** | Otomatik servis keşfi, Docker label'ları |
| Küçük proje, basitlik önemli | **Caddy** | Otomatik HTTPS, minimal konfigürasyon |

**Default:** Nginx. Aksini belirten bir gereksinim yoksa her zaman Nginx kullan.

## 3. NGINX KONFİGÜRASYON KURALLARI

### 3.1. Reverse Proxy Yapılandırması (ZORUNLU)

```nginx
upstream backend {
    server backend:{BACKEND_PORT};
    keepalive 32;
}

upstream frontend {
    server frontend:{FRONTEND_PORT};
    keepalive 32;
}
```

**Kurallar:**
- `keepalive` bağlantıları upstream'e açar → performans için ZORUNLU
- `proxy_set_header Host $host` → backend doğru host header'ı almalı
- `proxy_set_header X-Real-IP $remote_addr` → gerçek client IP'si
- `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for` → proxy zinciri
- `proxy_set_header X-Forwarded-Proto $scheme` → orijinal protokol (http/https)

### 3.2. API Routing Kuralları

```nginx
location /api/ {
    proxy_pass http://backend/api/;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    
    # Rate limiting
    limit_req zone=api_limit burst=50 nodelay;
    
    # CORS preflight
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://{DOMAIN}';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With';
        add_header 'Access-Control-Max-Age' 86400;
        return 204;
    }
}
```

### 3.3. Gzip Sıkıştırma (ZORUNLU)

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 5;
gzip_min_length 1000;
gzip_types text/plain text/css text/javascript application/javascript application/json application/xml image/svg+xml font/ttf font/woff font/woff2;
```

### 3.4. Security Headers (ZORUNLU)

Her location bloğuna veya server bloğuna aşağıdaki header'lar eklenmelidir:

```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

**CSP (Content-Security-Policy):** Projeye özel olmalı, AI projedeki statik kaynaklara göre CSP politikasını belirlemelidir.

## 4. SSL/TLS KURALLARI

### 4.1. Sertifika Yönetimi (ZORUNLU KURALLAR)
1. Production'da **asla** self-signed sertifika kullanılmaz
2. Let's Encrypt önerilir (ücretsiz, otomatik yenileme)
3. Minimum TLS 1.2, önerilen TLS 1.3
4. HSTS header'ı production'da zorunludur: `Strict-Transport-Security: max-age=63072000; includeSubDomains`
5. Sertifika yenileme kontrolü haftada bir otomatik yapılmalı
6. SSL cipher'lar modern ve güvenli olmalı (PCI DSS uyumlu)

### 4.2. Let's Encrypt ile Nginx + Certbot

AI, SSL konfigürasyonu için certbot entegrasyonu sağlamalıdır:

```nginx
# HTTP → HTTPS yönlendirme (certbot challenge için /.well-known/ hariç)
server {
    listen 80;
    server_name {DOMAIN} www.{DOMAIN};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}
```

## 5. RATE LIMITING KURALLARI

Rate limiting, DDoS ve brute-force saldırılarına karşı ilk savunma hattıdır.

**Zorunlu Limit Tanımları:**
- **Genel trafik:** 10 request/saniye, burst 20
- **API endpoint'leri:** 30 request/saniye, burst 50
- **Statik dosyalar:** 100 request/saniye, burst 200
- **Auth endpoint'leri (/login, /register):** 5 request/saniye, burst 10

## 6. CORS KURALLARI

### Production CORS Politikası (ZORUNLU)
- `Access-Control-Allow-Origin`: SADECE bilinen domain'ler, ASLA `*`
- `Access-Control-Allow-Methods`: Sadece kullanılan HTTP metodları
- `Access-Control-Allow-Headers`: Sadece gerekli header'lar
- `Access-Control-Max-Age`: 86400 (24 saat) preflight cache

### Development CORS
- Development ortamında `localhost` origin'lerine izin verilebilir
- Production'da localhost ASLA Allow-Origin listesinde olmamalı

## 7. NETWORK İZOLASYONU (Docker Ağ Yapısı)

Daha önce docker/manifest.json'da tanımlanan ağ yapısına uygun olarak:

```
Internet → Reverse Proxy (app_network) → Frontend (app_network)
                                       → Backend (app_network + db_network)
                                                         → Database (db_network, internal: true)
```

**Kurallar:**
- Database ASLA app_network'te olmaz, sadece db_network'te (internal)
- Reverse proxy sadece app_network'te
- Backend her iki ağda da olabilir (app_network + db_network)
- Container'lar arası iletişim container isimleriyle yapılır

## 8. YAYGIN HATALAR (AI'NIN KAÇINMASI GEREKENLER)

1. ❌ Uygulama portunu doğrudan internete açmak → Her zaman reverse proxy arkasına al
2. ❌ `Access-Control-Allow-Origin: *` kullanmak → Spesifik origin tanımla
3. ❌ HTTP'yi production'da açık bırakmak → HTTP → HTTPS redirect zorunlu
4. ❌ Self-signed sertifika ile production'a çıkmak → Let's Encrypt veya trusted CA kullan
5. ❌ Rate limiting olmadan API endpoint'lerini sunmak → Brute-force ve DDoS'a açık
6. ❌ Security header'ları unutmak → X-Frame-Options, X-Content-Type-Options vb. ekle
7. ❌ Proxy buffer'ları yapılandırmamak → Büyük request/response'larda hata alınır
8. ❌ Keepalive bağlantılarını kapatmak → Her istekte yeni TCP bağlantısı, performans kaybı
9. ❌ Monitoring dashboard'unu public bırakmak → IP whitelist veya basic auth zorunlu
