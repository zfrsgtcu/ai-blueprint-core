<!--
  BU DOSYANIN AMACI:
  AI ajanlarına monitoring ve gözlemlenebilirlik sistemlerinin kurulum ve konfigürasyon kurallarını öğretir.
  Prometheus, Grafana, Loki ve ELK Stack konfigürasyonlarının production-ready olması için zorunlu kuralları içerir.
-->

# MONITORING & OBSERVABILITY RULES

## 1. TEMEL PRENSİPLER

Monitoring sistemi üç temel sinyal tipini kapsamalıdır:

- **Metrics (Metrik):** Sayısal ölçümler (CPU, RAM, istek sayısı, yanıt süresi) → Prometheus
- **Logs (Günlük):** Uygulama ve sistem log'ları → Loki / Elasticsearch
- **Traces (İzleme):** Distributed tracing (mikroservisler arası istek takibi) → Tempo / Jaeger (opsiyonel)

**Altın Kural:** Monitoring olmadan production'a çıkılmaz. Her production ortamında en az Prometheus + Grafana çalışıyor olmalıdır.

## 2. APPLICATION METRICS — AI'NIN EKLEMESİ GEREKENLER

AI, uygulama kodunda aşağıdaki metrik endpoint'lerini oluşturmalıdır:

### .NET Web API
- `prometheus-net` NuGet paketi eklenmeli
- `Program.cs` içinde: `app.UseHttpMetrics()` + `app.MapMetrics()`
- Endpoint: `GET /metrics` (Prometheus formatında)

### Node.js (Nuxt.js / Next.js / Express)
- `prom-client` npm paketi eklenmeli
- Express middleware: `app.use(prometheusMetrics())`
- Endpoint: `GET /metrics`

### Özel Business Metrikleri (ZORUNLU)
AI, aşağıdaki özel metrikleri uygulamaya eklemelidir:
- `http_requests_total` — Toplam HTTP isteği sayısı (status code bazında)
- `http_request_duration_seconds` — İstek yanıt süresi histogramı
- `active_users_total` — Aktif kullanıcı sayısı (gauge)
- `db_query_duration_seconds` — Veritabanı sorgu süresi histogramı
- `errors_total` — Toplam hata sayısı (tip bazında)

## 3. PROMETHEUS KONFİGÜRASYON KURALLARI

```yaml
global:
  scrape_interval: 15s          # 15 saniyede bir metrik topla
  evaluation_interval: 15s      # 15 saniyede bir alert kurallarını değerlendir

scrape_configs:
  - job_name: 'app'             # Uygulama metrikleri
    scrape_interval: 15s
    static_configs:
      - targets: ['app:port']

  - job_name: 'node'            # Host sistemi metrikleri
    scrape_interval: 30s
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'docker'          # Container metrikleri
    scrape_interval: 30s
    static_configs:
      - targets: ['cadvisor:8080']
```

**Kurallar:**
- `scrape_interval` 15 saniyeden kısa olamaz (Prometheus'u yorma)
- Retention süresi minimum 15 gün olmalı
- Production'da `--storage.tsdb.retention.time=15d` parametresi ile başlatılmalı
- Alert kuralları ayrı dosyada: `alert.rules.yml`

## 4. GRAFANA KONFİGÜRASYON KURALLARI

### Otomatik Provisioning (ZORUNLU)
Grafana konteyneri başlatılırken aşağıdakiler otomatik yapılandırılmalıdır:
- Datasource: Prometheus ve Loki otomatik bağlanmalı
- Dashboard: En az 3 temel dashboard otomatik import edilmeli:

| Dashboard | ID | Amaç |
|-----------|----|----|
| Node Exporter Full | 1860 | Sunucu metrikleri |
| Docker Monitoring | 193 | Container metrikleri |
| App-specific | Custom | Uygulama metrikleri (AI tarafından JSON modeli oluşturulur) |

### Dashboard Tasarım Prensipleri
AI, Grafana dashboard JSON modeli oluştururken:
- Üst sıra: KPI kartları (toplam istek, hata oranı, aktif kullanıcı, ortalama yanıt süresi)
- Orta sıra: Zaman serisi grafikleri (istek hacmi, yanıt süresi dağılımı)
- Alt sıra: Tablolar (en yavaş endpoint'ler, en çok hata veren endpoint'ler)

## 5. LOG AGGREGATION KURALLARI

### Application Logging Standardı
AI, uygulama kodunda aşağıdaki log formatını kullanmalıdır:

```json
{
  "timestamp": "2026-07-20T10:30:00Z",
  "level": "info|warn|error|debug",
  "service": "frontend|backend|api",
  "message": "Kullanıcı giriş yaptı",
  "userId": "uuid",
  "traceId": "uuid",
  "duration_ms": 150,
  "metadata": {}
}
```

**Kesin Kurallar:**
- Production'da log seviyesi minimum `info` olmalı, `debug` kapalı olmalı
- Log'lar **her zaman JSON formatında** olmalı (yapılandırılmış loglama)
- `traceId` her istek için unique olmalı (distributed tracing)
- Hassas veriler (şifre, kredi kartı, token) ASLA loglanmamalı

### Serilog (.NET) Konfigürasyonu
```csharp
Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("service", "backend")
    .WriteTo.Console(new CompactJsonFormatter())
    .CreateLogger();
```

### Pino (Node.js) Konfigürasyonu
```javascript
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: { level: (label) => ({ level: label }) },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: { service: 'frontend' }
});
```

## 6. ALERTING KURALLARI

### Kritik Alert'ler (Her Sistemde Zorunlu)
1. **Service Down:** Herhangi bir servis 1 dakikadan uzun süre down ise → kritik alert
2. **High Error Rate:** 5xx hata oranı 5 dakika boyunca %5'in üzerindeyse → kritik alert
3. **High Response Time:** p95 yanıt süresi 5 dakika boyunca 1 saniyenin üzerindeyse → uyarı
4. **High CPU/RAM:** CPU %80, RAM %85 üzerinde 10 dakika kalırsa → uyarı
5. **Disk Almost Full:** Disk %85 dolu ise → uyarı
6. **Certificate Expiry:** SSL sertifikası 30 gün içinde bitecekse → uyarı

### Bildirim Kanalları (En az biri aktif olmalı)
- **Email:** SMTP konfigürasyonu
- **Slack/Discord:** Webhook URL üzerinden
- **Microsoft Teams:** Incoming Webhook connector

## 7. YAYGIN HATALAR (AI'NIN KAÇINMASI GEREKENLER)

1. ❌ `/metrics` endpoint'ini authentication olmadan internete açmak → Rate limit + basic auth ekle
2. ❌ Log'ları sadece dosyaya yazmak → stdout/stderr'e yaz, Loki/Promtail toplasın
3. ❌ Hassas verileri loglamak → Log sanitization zorunlu
4. ❌ Alert olmadan monitoring kurmak → Alert rules olmadan monitoring eksiktir
5. ❌ Retention süresini sınırsız yapmak → Disk doluluk sorunu yaşanır
6. ❌ Production'da debug seviyesinde loglama → Performans sorunu ve disk doluluk
