<!--
  BU DOSYANIN AMACI:
  Docker imajı ve container çalıştırma için Production kısıtlamalarını AI'a öğretir.
  AI ajanları Dockerfile ve docker-compose.yaml üretirken bu kurallara %100 uymak zorundadır.
  "Production-Ready" olmayan hiçbir konfigürasyon kabul edilmez.
-->

# DOCKER PRODUCTION CONSTRAINTS

## 1. MULTI-STAGE BUILD (ZORUNLU)

Tüm Dockerfile'lar **multi-stage build** kullanmak zorundadır. Tek aşamalı Dockerfile KESİNLİKLE YASAKTIR.

**Aşamalar:**
- **Stage 1 (build):** SDK/base image ile bağımlılıkları yükle, projeyi derle
- **Stage 2 (runtime):** Minimal runtime image, sadece build artifact'lerini kopyala

**Avantaj:** Production imajı sadece runtime içermeli, SDK/build tool'ları içermemeli. İmaj boyutu minimize edilir.

## 2. NON-ROOT USER (ZORUNLU)

Production container'ları **kesinlikle root kullanıcısı ile çalıştırılamaz.**

- Node.js projeleri: official image'ın built-in `node` kullanıcısı
- .NET projeleri: `app` kullanıcısı oluştur (`RUN adduser --disabled-password app && chown -R app:app /app`)
- Nginx: built-in `nginx` kullanıcısı

## 3. HEALTHCHECK (ZORUNLU)

Her servis container'ı mutlaka HEALTHCHECK instruction'ı içermelidir:
- Frontend: `curl -f http://localhost:3000/ || exit 1`
- Backend (.NET): `curl -f http://localhost:8080/health || exit 1`
- Backend (Node.js): `curl -f http://localhost:3001/health || exit 1`
- Veritabanı: İlgili DB'ye özel ping komutu
- Redis: `redis-cli ping`

## 4. LAYER CACHING OPTIMIZASYONU

Docker layer cache'ini maksimize etmek için kopyalama sırası:
1. Önce package.json / .csproj / pom.xml gibi bağımlılık dosyaları kopyalanır
2. Bağımlılıklar restore edilir (npm ci, dotnet restore, vb.)
3. Sonra kaynak kod kopyalanır
4. Build alınır

Bu sıralama sayesinde kaynak kod değiştiğinde bağımlılık katmanı cache'den kullanılır.

## 5. ENVIRONMENT VARIABLES

- **ASLA** Dockerfile içinde `ENV` ile secret tanımlama (API key, DB şifresi, JWT secret)
- Hassas olmayan konfigürasyon değerleri için `ENV` kullanılabilir (NODE_ENV, ASPNETCORE_ENVIRONMENT)
- Secret'lar docker-compose.yaml'da `env_file` veya Docker Swarm/K8s secrets ile enjekte edilir
- `ARG` sadece build-time değişkenleri için kullanılır, runtime'da kullanılamaz

## 6. IMAGE SIZE LIMITS

- **Frontend (static):** Max 50MB (nginx:alpine + static files)
- **Frontend (SSR):** Max 150MB
- **Backend (.NET):** Max 250MB (trimmed + self-contained publish ile)
- **Backend (Node.js):** Max 150MB
- **Veritabanı:** Official image boyutu referans alınır

## 7. DOCKER-COMPOSE STANDARTLARI

- `container_name` prefix: proje-adı-servis (örn: `ecommerce-db`, `ecommerce-api`)
- `restart: unless-stopped` tüm servislerde zorunlu
- `depends_on` ile başlatma sırası belirtilmeli, ANCAK `condition: service_healthy` ile healthcheck beklenmeli
- Volume'ler NAMED volume olmalı, bind mount sadece development'ta kullanılır
- Network izolasyonu: frontend dış dünyaya açık, backend sadece frontend ile, DB sadece backend ile iletişim kurabilmeli

## 8. LOGGING

- Container'lar stdout/stderr'e log yazmalı, dosyaya değil
- `docker-compose.yaml` logging driver: `json-file` (default) veya `lokidriver` (Loki entegrasyonu varsa)
- Log rotation zorunlu:
  ```yaml
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
  ```

## 9. RESOURCE LIMITS (Production)

Production ortamında her servis için resource limit tanımlanmalıdır:
```yaml
deploy:
  resources:
    limits:
      cpus: '0.50'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

## 10. .dockerignore (ZORUNLU)

Her proje kökünde `.dockerignore` dosyası bulunmalıdır. Minimum içerik:
```
node_modules
.git
.gitignore
.env*
dist
.output
bin
obj
*.md
!README.md
Dockerfile
docker-compose*.yml
.vscode
.idea
```

## 11. SECURITY SCANNING

Production imajları için:
- `docker scan` veya Trivy ile vulnerability taraması yapılmalı
- Base image olarak `:latest` tag'i YASAK, her zaman belirli bir versiyon kullan (`node:20.11-alpine`)
- `.dockerignore` ile hassas dosyaların imaja kopyalanması engellenmeli
