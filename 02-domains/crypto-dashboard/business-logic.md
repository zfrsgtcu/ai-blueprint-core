<!--
  [TR] BU DOSYANIN AMACI:
  Kripto Portföy Takip Dashboard'unun iş mantığı kurallarını AI'a eksiksiz öğretir.
  Decimal hassasiyeti, WebSocket gerçek zamanlı veri akışı, portföy anlık görüntüleri (snapshot)
  ile P&L hesaplama, alert tetikleme motoru, borsa API entegrasyonu, vergi raporlaması
  ve çoklu borsa senkronizasyonu kurallarını kapsar.
-->

# CRYPTO DASHBOARD BUSINESS LOGIC & REQUIREMENTS

## 1. CORE DOMAIN FOCUS
Bu proje, kurumsal seviye bir kripto portföy takip ve analiz platformudur. Temel öncelikler: yüksek hassasiyetli finansal hesaplamalar (Decimal), gerçek zamanlı WebSocket veri akışı, güvenilir portföy geçmişi (snapshot tabanlı), proaktif alert motoru ve çoklu borsa senkronizasyonudur.

## 2. NUMERIC PRECISION & FINANCIAL CALCULATIONS
- **Float YASAK:** Tüm finansal tutarlar, fiyatlar ve hesaplamalar `Decimal` tipinde olmalıdır. JavaScript/TypeScript'te `number` tipi asla kullanılmamalıdır.
- **Kripto Hassasiyeti:** `Decimal(20, 8)` — 8 ondalık basamak Bitcoin ve çoğu altcoin için yeterlidir. Yüksek arzlı token'lar için `Decimal(30, 18)`.
- **Fiat Hassasiyeti:** `Decimal(20, 2)` — USD/EUR/TRY gibi itibari para birimleri için.
- **Toplam Portföy Değeri:** `SUM(tüm_varlıkların_fiat_değeri) + fiat_bakiyeler`. Her varlık için: `miktar * güncel_fiyat * (varsa USD çevrim kuru)`.
- **P&L Hesaplama:** Günlük, haftalık, aylık, yıllık ve tüm zamanlar olmak üzere 5 periyotta hesaplanır. Baz değer `PortfolioSnapshot` tablosundan alınır. Formül: `(currentValue - baseValue) / baseValue * 100`.

## 3. PORTFOLIO MANAGEMENT
- **Varlıklar (Holdings):** Her kullanıcının portföyü, borsa hesaplarından senkronize edilen veya manuel girilen varlıklardan oluşur. Bir varlık birden fazla borsada tutulabilir, toplam bakiye konsolide gösterilir.
- **PortfolioSnapshot:** Her gün saat 00:00 UTC'de cron job ile her kullanıcı için otomatik snapshot alınır. `breakdown` JSONB: `[{ symbol, amount, priceInFiat, totalValue }]`. Snapshot'lar 2 yıl saklanır, 2 yıldan eski olanlar aylık olarak sıkıştırılır.
- **Fiat Bakiyeler:** Kullanıcı manuel olarak USD/EUR/TRY bakiyesi girebilir veya borsa API'si üzerinden otomatik senkronize edilebilir. Toplam portföy değerine dahil edilir.
- **Kar/Zarar (Unrealized P&L):** Her varlık için: `(currentPrice - averageBuyPrice) * totalAmount`. `averageBuyPrice` tüm alım işlemlerinin ağırlıklı ortalamasıdır.

## 4. REAL-TIME DATA & WEBSOCKET STREAMING
- **WebSocket Gateway:** Binance, Coinbase, Kraken, Bybit gibi büyük borsalardan ticker verileri WebSocket ile canlı alınır. Bağlantı kopması durumunda otomatik reconnect (exponential backoff: 1s, 2s, 4s, maksimum 30s).
- **Watchlist Önceliği:** Kullanıcının watchlist'indeki semboller için WebSocket verisi öncelikli olarak işlenir. Watchlist'te olmayan semboller sadece polling ile güncellenir (10 saniyede bir).
- **Fiyat Önbelleği (PriceCache):** Son bilinen fiyatlar `PriceCache` tablosunda tutulur. WebSocket kesildiğinde son önbelleklenmiş fiyat gösterilir ve "Gecikmeli Veri" uyarısı çıkar.
- **Circuit Breaker:** Bir borsa API'sinden art arda 5 hata alınırsa, o borsa için 5 dakikalık devre kesici devreye girer. Kullanıcıya "Degraded Data" göstergesi ile bilgi verilir.

## 5. ALERT ENGINE
- **Alert Kuralı Tipleri:**
  - `price_above`: Fiyat X değerinin üstüne çıkarsa.
  - `price_below`: Fiyat X değerinin altına düşerse.
  - `change_24h_above`: 24 saatlik değişim %X'in üstüne çıkarsa.
  - `change_24h_below`: 24 saatlik değişim %X'in altına düşerse.
  - `volume_above`: 24 saatlik hacim X değerinin üstüne çıkarsa.
- **Alert Tetikleme:** Her fiyat güncellemesinde (WebSocket veya polling), aktif alert kuralları kontrol edilir. Tetiklenen alert için `AlertRule.triggeredAt = now()`, `isActive = false` (tek seferlik tetikleme) veya `isActive = true` kalır (sürekli — her tetiklemede bildirim gider, minimum 15 dakika arayla).
- **Bildirim Kanalları:** In-app notification (varsayılan), push notification (mobil), e-posta (opsiyonel). Kullanıcı `User.notificationPreferences` JSONB üzerinden kanal tercihlerini yönetir.
- **Alert Geçmişi:** `AlertNotification` tablosunda tüm tetiklenen alert'ler loglanır. Kullanıcı geçmiş alert'leri görüntüleyebilir.

## 6. EXCHANGE INTEGRATION
- **API Anahtarı Yönetimi:** Kullanıcı borsa API anahtarlarını (read-only önerilir) ekleyebilir. Anahtarlar AES-256-GCM ile şifrelenerek saklanır. `ExchangeAccount.permissions` JSONB ile anahtarın izin kapsamı tutulur.
- **Bağlantı Testi:** `POST /api/v1/exchanges/validate` — verilen API anahtarı ve secret ile borsaya test isteği gönderilir. Başarılı ise `status = 'active'`, başarısız ise `status = 'invalid'`.
- **Senkronizasyon:** Kullanıcı manuel olarak "Senkronize Et" butonuna basar veya saatlik otomatik senkronizasyon çalışır. Borsa API'sinden: bakiye (balance), açık emirler, son işlemler çekilir.
- **Rate Limit Yönetimi:** Her borsanın API rate limit'ine saygı gösterilir. Rate limit aşımında exponential backoff ile yeniden denenir. `ExchangeHealth` tablosunda borsa durumu takip edilir.
- **Desteklenen Borsalar:** Binance, Coinbase, Kraken, Bybit, KuCoin, Bitfinex, OKX, Gate.io. Yeni borsa entegrasyonu adaptör pattern'i ile eklenir.

## 7. TRADE & TRANSACTION MANAGEMENT
- **Manuel İşlem Girişi:** Kullanıcı alım/satım işlemlerini manuel girebilir: sembol, tip (buy/sell), miktar, fiyat, fee, timestamp, notlar.
- **Borsa Senkronizasyonu:** Borsa API'sinden çekilen işlemler `source = 'binance' | 'coinbase' | ...` ve `externalId` (borsadaki işlem ID'si) ile kaydedilir. Aynı `externalId` tekrar kaydedilmez (idempotent).
- **CSV İçe Aktarma:** Kullanıcı CSV formatında işlem geçmişi yükleyebilir. Format: `date, symbol, type, amount, price, fee`. CSV validasyonu yapılır, hatalı satırlar raporlanır.
- **İşlem Silme:** Manuel işlemler silinebilir. Senkronize edilmiş işlemler silinemez (sadece gizlenebilir).
- **Ortalama Maliyet:** `averageBuyPrice = SUM(buy_amount * buy_price) / SUM(buy_amount)`. FIFO veya LIFO seçilebilir (varsayılan: FIFO).

## 8. TAX REPORTING
- **Vergi Raporu:** Kullanıcı seçtiği mali yıl için vergi raporu oluşturabilir. Rapor içeriği: toplam alım, toplam satım, gerçekleşen kar/zarar, fee toplamı, varlık bazında döküm.
- **Hesaplama Metodu:** FIFO (varsayılan), LIFO, HIFO (highest in first out) seçenekleri.
- **Rapor Formatı:** PDF (indirilebilir) ve CSV (dışa aktarılabilir). `TaxReport` modelinde rapor metadata'sı ve sonuç JSON'u saklanır.
- **Vergi Oranı:** Kullanıcı kendi ülkesinin vergi oranını yapılandırabilir. Platform vergi danışmanlığı sağlamaz, sadece hesaplama aracıdır.

## 9. WATCHLIST & FAVORITES
- **Watchlist:** Kullanıcı başına maksimum 50 sembol. Sembol ve eklendiği tarih tutulur.
- **Watchlist Sıralaması:** Varsayılan: eklenme tarihi. Kullanıcı drag-and-drop ile yeniden sıralayabilir (sortOrder alanı).
- **Watchlist Veri Önceliği:** Watchlist'teki semboller için WebSocket canlı verisi aktif olur. Watchlist dışı semboller polling ile güncellenir.
- **Favori Çiftler Oluşturma:** Kullanıcı belirli varlık çiftlerini (örn: BTC/USDT, ETH/BTC) favori olarak işaretleyip hızlı erişim listesi oluşturabilir.

## 10. ANALYTICS & DASHBOARD WIDGETS
- **Portföy Dağılımı:** Pasta grafik: varlık bazında % dağılım. Bar grafik: aylık performans.
- **Performans Metrikleri:** ROI (%), günlük/haftalık/aylık değişim %, en iyi/en kötü performans gösteren varlık, volatilite, Sharpe ratio.
- **Karşılaştırmalı Analiz:** Portföy performansının BTC ve ETH benchmark'larına karşı karşılaştırması.
- **Dashboard Widget'ları:** Kullanıcı dashboard'unu özelleştirebilir: widget ekle/kaldır, yeniden sırala, boyutlandır (1x, 2x, 3x grid). Widget tipleri: portföy_ozeti, fiyat_tablosu, pasta_grafik, performans_grafigi, alert_listesi, islem_gecmisi, haber_akisi.

## 11. SECURITY & ENCRYPTION
- **API Anahtar Şifreleme:** Tüm borsa API anahtarları ve secret'ları AES-256-GCM ile şifrelenir. Şifreleme anahtarı ortam değişkeninden (`ENCRYPTION_KEY`) alınır, asla veritabanında saklanmaz.
- **2FA:** Hassas işlemler (API anahtarı ekleme/silme, şifre değişikliği) için 2FA zorunludur. TOTP tabanlı (Google Authenticator uyumlu).
- **Session Management:** JWT access token (15 dakika) + refresh token (7 gün). Refresh token rotasyonu: her kullanımda yeni refresh token verilir, eski token geçersiz olur.
- **Rate Limiting:** Public: 500/dk/IP. Auth: 100/dk/kullanıcı. Hassas endpoint'ler (API anahtar CRUD): 10/dk/kullanıcı.
- **Veri Saklama:** Portföy verileri ve işlem geçmişi hesap silindikten 30 gün sonra kalıcı olarak silinir.

## 12. ADMIN & SYSTEM
- **Borsa Durumu İzleme:** `ExchangeHealth` tablosu her 30 saniyede bir güncellenir. Her borsa için: `isOnline`, `latencyMs`, `lastCheckedAt`, `errorMessage`. Admin panelinde tüm borsaların durum panosu.
- **Sistem Metrikleri:** Aktif kullanıcı sayısı, toplam portföy değeri, WebSocket bağlantı sayısı, API çağrı hacmi, ortalama yanıt süresi.
- **Fiyat Verisi Sağlayıcı:** Birincil fiyat sağlayıcı (CoinGecko / CoinMarketCap) ve yedek sağlayıcı. Birincil sağlayıcı hata verirse otomatik fallback.
- **Bakım Modu:** Planlı bakım sırasında WebSocket bağlantıları kapatılır, kullanıcılara bilgi mesajı gösterilir.
