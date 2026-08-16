<!--
  Analitik Araçları — İş Mantığı Kuralları
  Bu doküman, Analitik Araçları platformunun tüm iş mantığı kurallarını, süreç akışlarını,
  validasyon kurallarını ve domain kısıtlamalarını tanımlar.
  Kapsam: Yüksek hacimli veri toplama (ingestion), zaman serisi optimizasyonu,
  dashboard widget yönetimi, olay (event) takibi, funnel analizi, veri saklama ve örnekleme.
  Tüm içerik Türkçedir.
-->
# Analitik Araçları — İş Mantığı Kuralları

## 1. Domain Odağı ve Temel Kavramlar

Analitik Araçları, web siteleri ve uygulamalar için yüksek performanslı bir telemetri, olay takibi ve veri görselleştirme platformudur. Sistem yüksek hacimli olay verilerini gerçek zamanlı olarak toplar, toplar (aggregate) ve etkileşimli dashboard'lar üzerinde görselleştirir.

**Temel varlıklar:**
- **Project**: Bir web sitesi veya uygulama için analytics projesi. Her projenin kendine ait tracking ID'si, CORS domain'leri ve örnekleme ayarları vardır.
- **Event**: Kullanıcı etkileşimini temsil eden olay (sayfa görüntüleme, tıklama, form gönderimi, özel olay). Her olay bir session'a bağlıdır.
- **Session**: Bir kullanıcının belirli bir zaman aralığındaki etkileşimlerinin gruplandığı oturum. Tarayıcı, cihaz, ülke ve referans bilgisi içerir.
- **DashboardWidget**: Dashboard üzerinde gösterilecek grafik ve metrik kartlarının yapılandırması.
- **Metric**: Zaman serisi tabanlı metrik verisi (sayfa görüntüleme, benzersiz ziyaretçi, dönüşüm oranı).

## 2. Veri Toplama (Ingestion)

### 2.1 Toplama Endpoint'i (CRITICAL)
- `POST /api/collect` endpoint'i son derece hafif olmalıdır. İstekleri hemen `202 Accepted` veya `204 No Content` ile yanıtlamalı, asla senkron veritabanı yazımı yapmamalıdır.
- Gelen olaylar bellekte biriktirilir veya bir kuyruğa (Redis, RabbitMQ) yazılır. Arka plan worker'ları toplu (batch) olarak veritabanına yazar.
- Toplu yazım boyutu: 500 olay/batch veya 5 saniyede bir, hangisi önce dolarsa.
- Event boyutu maksimum 50 KB. Daha büyük payload'lar `413 Payload Too Large` ile reddedilir.

### 2.2 Tracking Script
- Tracking script (`analytics.js`) asenkron yüklenmelidir: `<script async defer>`.
- Script, `navigator.sendBeacon()` API'sini kullanarak sayfa kapanışında dahi olay gönderebilmelidir.
- `X-Tracking-Key` header'ı ile proje tanımlaması yapılır. Geçersiz key'ler sessizce reddedilir (204 döner, hata fırlatmaz).

### 2.3 CORS ve Domain Yönetimi
- Toplama endpoint'i sadece projede tanımlı domain'lerden gelen CORS isteklerini kabul eder.
- Wildcard domain desteği: `*.example.com` pattern'i kullanılabilir.
- Origin kontrolü: `Origin` header'ı proje ayarlarındaki `allowedDomains` ile eşleştirilir.

### 2.4 Olay Doğrulama
- Gelen olaylar JSON Schema doğrulamasından geçer.
- Geçersiz olaylar dead-letter queue'ya (DLQ) gönderilir, admin panelinde incelenebilir.
- Zorunlu alanlar: `eventName` (max 128 karakter), `timestamp`.
- İsteğe bağlı alanlar: `properties` (JSONB, max 5 KB), `sessionId`, `userId`, `url`.

## 3. Veri Saklama ve Örnekleme

### 3.1 Saklama Politikası (Retention)
- Ham olay verileri: 90 gün (proje bazında yapılandırılabilir, 30-365 gün arası).
- Günlük toplulaştırılmış veriler: 2 yıl.
- Aylık toplulaştırılmış veriler: süresiz.
- Saklama süresi dolan veriler cron job ile otomatik silinir.
- `GET /api/admin/stats` ile veri saklama durumu izlenebilir.

### 3.2 Örnekleme (Sampling)
- Yüksek trafikli projelerde (>10.000 olay/dk) istemci tarafı örnekleme etkinleştirilebilir.
- Örnekleme oranı proje bazında `settings.samplingRate` ile yapılandırılır (örn: 0.1 = %10).
- Örnekleme, istatistiksel anlamlılığı korumak için rastgele (random) yapılır, ilk N kayıt değil.
- Örneklenen veriler dashboard'da `(örneklenmiş)` etiketi ile gösterilir.
- Örnekleme oranı değişikliği AuditLog'a kaydedilir.

### 3.3 Tekilleştirme (Deduplication)
- Aynı `(trackingId, eventName, sessionId, timestamp)` kombinasyonuna sahip olaylar 5 dakikalık bir Redis cache penceresinde tekilleştirilir.
- Ağ hatası nedeniyle yeniden gönderilen olaylar duplicate sayılmaz.
- Tekilleştirme penceresi: 5 dakika, TTL ile otomatik temizlenir.

## 4. Zaman Serisi ve Toplulaştırma

### 4.1 Zaman Serisi Optimizasyonu
- Tüm olay sorguları `(projectId, timestamp)` bileşik indeksini kullanır.
- PostgreSQL kullanılıyorsa BRIN indeks (timestamp üzerinde) yerine B-tree tercih edilmez, BRIN zaman serisi için daha verimlidir.
- Büyük ölçekli kurulumlarda TimescaleDB hypertable veya ClickHouse kullanımı önerilir.
- Partitioning: olaylar tablosu günlük veya aylık partition'lanır.

### 4.2 Toplulaştırma (Aggregation)
- Ham olaylar düzenli aralıklarla (her saat başı) toplulaştırılarak `MetricSnapshot` tablosuna yazılır.
- Toplulaştırma seviyeleri: saatlik, günlük, aylık.
- Metrik tipleri: `pageview`, `unique_visitor`, `session_count`, `bounce_rate`, `avg_duration`, `custom_event_count`.
- Uzun tarih aralıklı sorgularda (>30 gün) otomatik olarak daha kaba toplulaştırma seviyesine geçilir (data decimation).

### 4.3 Önbellekleme (Caching)
- Pahalı toplulaştırma sorguları Redis'te önbelleklenir.
- TTL: dashboard sorguları için 5 dakika, raporlama sorguları için 1 saat.
- Yeni olay geldiğinde ilgili projenin önbelleği invalidate edilir.

## 5. Dashboard ve Görselleştirme

### 5.1 Widget Sistemi
- Dashboard widget'ları sürükle-bırak ile yerleştirilebilir, `layoutConfig` JSONB alanında grid pozisyonları saklanır.
- Widget tipleri: `line_chart` (çizgi grafik), `bar_chart` (sütun grafik), `pie_chart` (pasta grafik), `metric_card` (tek metrik kartı), `funnel` (dönüşüm hunisi), `heatmap`, `table`.
- Her widget bir veya birden fazla metrik ile ilişkilendirilebilir.
- Widget başına maksimum 5 metrik (karmaşıklığı sınırlamak için).

### 5.2 Gerçek Zamanlı Görünüm
- Aktif kullanıcı sayısı WebSocket veya SSE üzerinden gerçek zamanlı gösterilir.
- "Şu anda çevrimiçi" sayısı: son 5 dakika içinde event gönderen benzersiz session sayısı.
- Sayfa görüntüleme hızı: dakika başına olay sayısı, hareketli ortalama ile hesaplanır.

### 5.3 Filtreleme ve Segmentasyon
- Global tarih aralığı seçici tüm widget'ları etkiler.
- Özellik filtreleri: ülke, cihaz, tarayıcı, URL pattern'i, özel özellikler.
- Segment kaydetme: sık kullanılan filtre kombinasyonları kaydedilebilir.

## 6. Funnel (Dönüşüm Hunisi) Analizi

### 6.1 Funnel Tanımı
- Funnel, sıralı adımlardan oluşur. Her adım bir event name ile tanımlanır.
- Adım sırası önemlidir: kullanıcı adım 2'ye geçmeden adım 1'i tamamlamış olmalıdır.
- Maksimum funnel adımı: 10.
- Funnel penceresi: kullanıcının tüm adımları tamamlaması gereken süre (default: 30 gün).

### 6.2 Funnel Metrikleri
- Her adım için: giren kullanıcı sayısı, çıkan kullanıcı sayısı, dönüşüm oranı (%).
- Drop-off analizi: hangi adımda kullanıcıların terk ettiği.
- Ortalama tamamlama süresi: adımlar arası geçen ortalama süre.

## 7. GDPR ve Gizlilik

### 7.1 Veri Anonimleştirme
- IP adresleri anonimleştirilerek saklanır (son oktet sıfırlanır: 192.168.1.0).
- Çerezsiz (cookieless) takip seçeneği: browser fingerprint veya session hash ile.
- Kullanıcı tanımlanabilir bilgi (PII) olay properties'inde tespit edilirse otomatik maskelenir.
- `X-GDPR-Consent` header'ı ile kullanıcı onay durumu iletilir, onaysız kullanıcılar sadece anonim sayım için kullanılır.

### 7.2 Veri Silme Talepleri
- Kullanıcı veri silme talebinde (`DELETE /api/admin/users/{id}/data`) tüm ham olaylar ve session'lar 30 gün içinde silinir.
- Toplulaştırılmış veriler silinmez (anonim ve geri döndürülemez).
- Silme işlemi AuditLog'a kaydedilir.

## 8. Anomali Tespiti ve Uyarılar

### 8.1 Anomali Tespiti
- Ani trafik düşüşü: saatlik olay sayısı önceki 24 saatin ortalamasının %50 altına düşerse.
- Ani trafik artışı: saatlik olay sayısı önceki 24 saatin ortalamasının %200 üstüne çıkarsa.
- Tespit algoritması: Z-score tabanlı, 3 standart sapma eşiği.
- Anomali tespiti saatlik cron job ile çalışır.

### 8.2 Uyarı (Alert) Sistemi
- Kullanıcı eşik tabanlı uyarılar oluşturabilir: `{ metric, condition: 'gt'|'lt'|'pct_change', threshold, period }`.
- Uyarı kanalları: e-posta, in-app bildirim, webhook.
- Uyarı tetiklendiğinde AlertLog kaydı oluşturulur, aynı uyarı 1 saat içinde tekrar tetiklenmez (cooldown).

## 9. Çoklu Kiracı (Multi-Tenant) Yönetimi

### 9.1 Proje İzolasyonu
- Her kullanıcı birden fazla proje oluşturabilir.
- Proje başına maksimum 50 dashboard widget'ı.
- Proje üyeliği: owner (tam yetki), editor (dashboard düzenleme), viewer (salt okuma).
- Proje silindiğinde tüm olaylar, session'lar ve widget'lar cascade silinir.

### 9.2 Kota Yönetimi
- Free: 10.000 olay/ay, 3 dashboard, 90 gün veri saklama.
- Pro: 1.000.000 olay/ay, sınırsız dashboard, 1 yıl veri saklama.
- Enterprise: özel kota, 2 yıl veri saklama, özel domain, SLA.
- Kota aşımında olay toplama durmaz, ancak dashboard'da kota uyarısı gösterilir. 7 gün grace period sonrası ek ücret.

## 10. İhracat ve Entegrasyon

### 10.1 Veri İhracatı
- Ham olay verileri CSV veya JSON olarak dışa aktarılabilir.
- Dashboard grafikleri PNG/SVG olarak dışa aktarılabilir.
- Planlanmış ihracat: haftalık/aylık otomatik e-posta ile rapor gönderimi.
- İhracatlar async işlenir, tamamlandığında kullanıcıya bildirim gönderilir.

### 10.2 Harici Entegrasyon
- Webhook: belirli olaylar için harici URL'lere POST (örn: dönüşüm olayı).
- API erişimi: API Key ile programatik metrik sorgulama.
- Google Analytics migrasyon aracı: GA verilerini içe aktarma.

## 11. Güvenlik ve Performans

### 11.1 Rate Limiting
- `POST /api/collect`: 1000/dk/domain (proje bazında).
- Dashboard API: 100/dk/kullanıcı.
- Admin API: 50/dk/kullanıcı.
- Rate limit aşımında `429 Too Many Requests`.

### 11.2 Performans Stratejileri
- Veritabanı bağlantı havuzu (connection pool): min 10, max 100.
- Read-replica: dashboard ve raporlama sorguları read-replica'ya yönlendirilir.
- Materialized view: sık kullanılan toplulaştırma sorguları için.
- CDN: tracking script ve statik dashboard asset'leri CDN üzerinden sunulur.

## 12. Denetim ve İzleme

### 12.1 Sistem İzleme
- Ingestion gecikmesi (lag): olayın gelişi ile veritabanına yazılması arasındaki süre (hedef: <5 saniye).
- Queue boyutu: işlenmeyi bekleyen olay sayısı (uyarı eşiği: 100.000).
- Worker sağlığı: worker sayısı ve işlem hızı.
- Dead-letter queue boyutu: geçersiz olay sayısı.

### 12.2 Audit Log
- Proje oluşturma/silme.
- Örnekleme oranı değişikliği.
- Kullanıcı yetki değişikliği.
- Veri silme talepleri.
- İhracat işlemleri.
