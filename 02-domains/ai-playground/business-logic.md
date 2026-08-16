<!--
  AI Playground — İş Mantığı Kuralları
  Bu doküman, AI Playground platformunun tüm iş mantığı kurallarını, süreç akışlarını,
  validasyon kurallarını ve domain kısıtlamalarını tanımlar.
  Kapsam: LLM etkileşimleri, chat session yönetimi, workflow otomasyonu,
  MCP bağlantıları, model yönetimi, SSE streaming, token kotaları ve güvenlik.
  Tüm içerik Türkçedir.
-->
# AI Playground — İş Mantığı Kuralları

## 1. Domain Odağı ve Temel Kavramlar

AI Playground, geliştiricilerin ve son kullanıcıların büyük dil modelleri (LLM) ile etkileşime geçebileceği, sohbet oturumları oluşturabileceği, workflow'lar tasarlayıp çalıştırabileceği ve MCP (Model Context Protocol) bağlantıları kurabileceği çok amaçlı bir AI etkileşim platformudur.

**Temel varlıklar:**
- **Chat Session**: Bir kullanıcının belirli bir model ile yaptığı sohbet oturumu. Sistem prompt'u, model seçimi ve bağlam penceresi ayarlarını içerir.
- **Message**: Oturum içindeki her bir kullanıcı veya asistan mesajı. Token sayısı, rol (user/assistant/system/tool) ve isteğe bağlı ek verilerle saklanır.
- **Workflow**: Kullanıcının tanımladığı çok adımlı AI iş akışı. Adımlar sıralı veya paralel çalıştırılabilir, her adım farklı bir model veya prompt kullanabilir.
- **MCP Connection**: Harici MCP sunucularına bağlantı. Araç (tool) keşfi, çağrı ve yanıt yönetimi yapılır.
- **Model Config**: Sistemde kullanılabilir modellerin yapılandırması. Her modelin bağlam penceresi, maliyet katsayısı, yetenekleri ve rate limit'leri tanımlanır.

## 2. Chat Session Yaşam Döngüsü

### 2.1 Oturum Oluşturma
- Her kullanıcı aynı anda en fazla 50 aktif oturuma sahip olabilir.
- Oturum oluşturulurken bir model seçilmesi zorunludur. Model sonradan değiştirilemez (fork mekanizması hariç).
- `systemPrompt` alanı oturum başında bir kez belirlenir, oturum süresince değiştirilemez.
- `contextWindow` (maksimum token sayısı) modelin desteklediği üst sınıra göre otomatik atanır, kullanıcı daha düşük bir değer seçebilir.

### 2.2 Mesaj Gönderimi
- Her mesaj gönderiminde bağlam penceresi kontrolü yapılır. Pencere dolduğunda en eski mesajlar `contextDiscarded` olarak işaretlenir.
- Kullanıcı mesajı + LLM yanıtı tek bir atomik işlem olarak kaydedilir.
- `parentMessageId` ile dallanma (branching) desteklenir: kullanıcı bir mesajı düzenleyip yeniden gönderdiğinde yeni bir dal oluşur.
- `temperature`, `topP`, `maxTokens` gibi parametreler mesaj bazında override edilebilir.

### 2.3 Streaming (SSE)
- Tüm chat yanıtları varsayılan olarak Server-Sent Events (SSE) ile akış halinde döndürülür.
- SSE bağlantısı 5 dakika idle kalırsa otomatik kapatılır.
- Bağlantı koptuğunda exponential backoff ile yeniden bağlanma (1s, 2s, 4s, 8s, max 30s).
- `X-Request-ID` header'ı ile request tracing yapılır.
- Client `stop` event'i göndererek stream'i erken sonlandırabilir.

### 2.4 Oturum Arşivleme ve Silme
- Oturumlar soft-delete ile arşivlenir, 30 gün sonra kalıcı olarak silinir.
- Arşivlenmiş oturumlar 30 gün içinde geri yüklenebilir.
- Fork işlemi: bir oturumun belirli bir noktasından kopya oluşturup farklı bir modelle devam etme.

## 3. Workflow Motoru

### 3.1 Workflow Tanımı
- Workflow JSON tabanlı bir DSL ile tanımlanır. Adımlar `steps[]` dizisinde sıralanır.
- Her adım şunları içerir: `id`, `type` (chat|condition|loop|code|mcp_call|http), `config`, `nextStep` veya `nextSteps[]`.
- Paralel adımlar `parallel: true` ile işaretlenir, tüm paralel adımlar tamamlandıktan sonra `joinStep`'e geçilir.
- Döngü adımları `maxIterations` (max 100) ve `condition` ile kontrol edilir.

### 3.2 Workflow Çalıştırma
- Workflow `POST /api/workflows/{id}/execute` ile başlatılır.
- Her çalıştırma bir `WorkflowRun` kaydı oluşturur.
- Çalıştırma durumları: `pending` → `running` → `completed` | `failed` | `cancelled`.
- Adım bazında ilerleme `stepStatus` JSONB alanında takip edilir.
- Timeout: workflow başına 30 dakika. Aşımda `failed` durumuna geçer.
- Hata durumunda `onError` politikası: `stop` (varsayılan), `skip`, `retry` (max 3 kez).
- Retry politikası: her retry'de exponential backoff (2^n saniye).

### 3.3 Workflow Değişkenleri
- `{{input.*}}` — workflow başlangıcında verilen input değişkenleri.
- `{{steps.<stepId>.output}}` — önceki adımın çıktısı.
- `{{env.*}}` — ortam değişkenleri (API key'ler vb., maskelenmiş).
- Değişkenler string interpolation ile çözümlenir, maksimum 10 KB toplam değişken boyutu.

## 4. MCP (Model Context Protocol) Entegrasyonu

### 4.1 Bağlantı Yönetimi
- MCP bağlantıları `stdio` (yerel süreç) veya `sse` (uzak sunucu) transport tipleriyle kurulur.
- `stdio` bağlantıları için komut yolu ve argümanlar sunucu tarafında whitelist ile kontrol edilir.
- `sse` bağlantıları için URL doğrulaması: sadece HTTPS kabul edilir, internal IP'lere bağlantı engellenir (SSRF koruması).
- Bağlantı başına maksimum 100 araç (tool) keşfedilebilir.
- Bağlantı koparsa otomatik reconnect (max 3 deneme, 5'er saniye aralıklarla).

### 4.2 Araç Keşfi ve Çağrısı
- `GET /api/mcp/connections/{id}/tools` ile bağlantıdaki araçlar listelenir ve local cache'e alınır (TTL: 5 dakika).
- Araç çağrısı `POST /api/mcp/connections/{id}/tools/{toolName}/call` ile yapılır.
- Araç çağrıları 30 saniye timeout ile sınırlıdır.
- Araç çağrı sonuçları `tool_call` rolü ile mesaj olarak chat session'a eklenir.

### 4.3 Güvenlik
- Tüm MCP bağlantıları sandbox edilmiştir.
- Dosya sistemi erişimi sadece izin verilen dizinlerle sınırlıdır.
- Ağ erişimi whitelist tabanlıdır.
- Hassas çıktılar (API key, token, şifre) otomatik maskelenir (regex tabanlı tespit).

## 5. Model Yönetimi ve Seçimi

### 5.1 Model Kataloğu
- Sistemde birden fazla model sağlayıcı (Anthropic, OpenAI, Google, yerel modeller) tanımlanabilir.
- Her model için: `contextWindow` (token), `maxOutputTokens`, `costPer1kInput`, `costPer1kOutput`, `capabilities[]` (chat, code, vision, function_calling, streaming).
- Modeller `isActive` flag'i ile açılıp kapatılabilir.
- Model değişiklikleri mevcut oturumları etkilemez, sadece yeni oturumlar için geçerlidir.

### 5.2 Model Yönlendirme (Fallback)
- Birincil model hata döndüğünde (rate limit, kapasite dolu, timeout) otomatik fallback model'e geçilir.
- Fallback zinciri: primary → secondary → tertiary → error.
- Her model için `fallbackModelId` tanımlanabilir.
- Fallback durumunda kullanıcıya bilgi mesajı gönderilir: "Model X şu anda yoğun, Model Y ile devam ediliyor."

## 6. Prompt Yönetimi

### 6.1 Sistem Prompt'ları
- Kullanıcılar kendi sistem prompt'larını oluşturabilir ve kaydedebilir (`PromptTemplate`).
- Prompt template'ler değişken içerebilir: `{{user_name}}`, `{{date}}`, `{{language}}`.
- Admin tarafından global sistem prompt'ları tanımlanabilir (tüm kullanıcılara açık).
- Prompt uzunluğu maksimum 8000 karakter.

### 6.2 Prompt Enjeksiyon Koruması
- Kullanıcı mesajlarında sistem prompt override girişimleri tespit edilir ve engellenir.
- Hassas pattern'ler: "ignore previous instructions", "system:", "you are now DAN", vb.
- Tespit edilen injection girişimleri AuditLog'a kaydedilir.

## 7. Token ve Kota Yönetimi

### 7.1 Token Hesaplama
- Girdi token'ları: sistem prompt'u + mesaj geçmişi + kullanıcı mesajı.
- Çıktı token'ları: LLM yanıtı.
- Token sayımı modelin kendi tokenizer'ı ile yapılır (tiktoken, claude tokenizer vb.).
- Her mesaj kaydında `inputTokens` ve `outputTokens` saklanır.

### 7.2 Kota Sistemi
- Kullanıcı bazında aylık token kotası (`BillingQuota`).
- Kota aşımında `429 Quota Exceeded` hatası, reset tarihi header'da (`X-Quota-Reset`).
- Gerçek zamanlı kota kullanımı `X-Quota-Used` ve `X-Quota-Remaining` header'ları ile bildirilir.
- Admin kullanıcılara ek kota tanımlayabilir.

### 7.3 Kullanım İstatistikleri
- Günlük ve aylık token kullanımı `UsageLog` tablosunda toplanır.
- Model bazında, oturum bazında ve kullanıcı bazında raporlama yapılabilir.
- `GET /api/my/usage` ile kendi kullanımını, `GET /api/admin/usage` ile tüm kullanıcıların kullanımını görme.

## 8. Dosya Yükleme ve İşleme

### 8.1 Dosya Yükleme Kuralları
- Desteklenen formatlar: PDF, TXT, CSV, JSON, XML, PNG, JPG, GIF, WEBP.
- Maksimum dosya boyutu: 10 MB (tek dosya), oturum başına max 5 dosya.
- Görseller vision-capable modellerde otomatik base64 encode edilip prompt'a eklenir.
- PDF ve metin dosyaları içerik çıkarma (extraction) sonrası prompt'a eklenir.
- CSV/JSON dosyaları yapısal analiz için tablo formatında prompt'a eklenir.

### 8.2 Dosya Saklama
- Yüklenen dosyalar 24 saat sonra otomatik silinir.
- Oturum arşivlendiğinde dosyalar da silinir.
- Dosyalar S3-compatible storage'da saklanır, erişim pre-signed URL'ler ile yapılır.

## 9. Güvenlik ve Erişim Kontrolü

### 9.1 Kimlik Doğrulama
- JWT tabanlı kimlik doğrulama (access + refresh token).
- Access token: 1 saat, Refresh token: 7 gün.
- API Key alternatifi: `X-API-Key` header'ı ile programatik erişim.
- API Key'ler kullanıcı başına max 5 adet, scope bazında (`chat`, `workflow`, `mcp`, `admin`) yetkilendirme.

### 9.2 Rate Limiting
- Public endpoint'ler: 300/dk.
- Kimlik doğrulamalı endpoint'ler: 100/dk.
- Chat/Stream endpoint'leri: 30/dk/kullanıcı.
- Workflow execute: 10/dk/kullanıcı.
- MCP tool call: 20/dk/kullanıcı.
- Rate limit aşımında `429 Too Many Requests` + `Retry-After` header'ı.

### 9.3 İçerik Güvenliği
- Prompt ve yanıtlar isteğe bağlı içerik filtresinden geçirilebilir (admin ayarı).
- Zararlı kod üretimi tespiti: eval, exec, subprocess, os.system pattern'leri taranır.
- PII (kişisel bilgi) sızıntı koruması: kredi kartı, TC kimlik no, telefon numarası regex tespiti.

## 10. Bildirimler ve Uyarılar

### 10.1 Bildirim Tetikleyicileri
- Kota %80 doluluk → e-posta + in-app bildirim.
- Kota %100 doluluk → e-posta + in-app bildirim.
- Workflow tamamlandı/başarısız → in-app bildirim.
- MCP bağlantısı koptu → in-app bildirim.
- Model kullanım dışı kaldı → e-posta bildirimi.

### 10.2 Bildirim Kanalları
- In-app: bildirim merkezi (gerçek zamanlı WebSocket).
- E-posta: günlük özet veya anlık kritik bildirimler.
- Webhook: kullanıcı tanımlı webhook URL'lerine POST (opsiyonel).

## 11. İşbirliği ve Paylaşım

### 11.1 Oturum Paylaşımı
- Kullanıcı oturumlarını görüntüleme (`view`) veya düzenleme (`edit`) izniyle paylaşabilir.
- Paylaşım token tabanlıdır: `POST /api/sessions/{id}/share` → `{ shareToken, url }`.
- `view` paylaşımında sadece mesaj geçmişi görülür, yeni mesaj gönderilemez.
- `edit` paylaşımında ortak çalışma yapılabilir, değişiklikler gerçek zamanlı sync edilir.

### 11.2 Workflow Paylaşımı
- Workflow'lar `published` yapılarak toplulukla paylaşılabilir.
- Paylaşılan workflow'lar `GET /api/workflows/community` endpoint'inde listelenir.
- Fork mekanizması: paylaşılan workflow kopyalanıp özelleştirilebilir.

## 12. Denetim ve Loglama

### 12.1 Audit Log Kapsamı
- Oturum oluşturma/silme.
- Mesaj gönderimi (sadece metadata: token sayısı, model, timestamp).
- Workflow oluşturma/güncelleme/silme/çalıştırma.
- MCP bağlantısı kurma/koparma/araç çağrısı.
- API Key oluşturma/iptal.
- Kullanıcı rol değişikliği (admin).

### 12.2 Log Saklama
- Audit log'lar 90 gün saklanır.
- `GET /api/admin/audit-logs` ile filtrelenebilir (kullanıcı, işlem tipi, tarih aralığı).
- Hassas veri içermez: mesaj içerikleri loglanmaz, sadece metadata.

## 13. Ödeme ve Faturalandırma

### 13.1 Plan Seviyeleri
- **Free**: 10.000 token/gün, 3 oturum, 1 workflow, temel modeller.
- **Pro**: 1.000.000 token/ay, sınırsız oturum, 20 workflow, tüm modeller, MCP desteği.
- **Enterprise**: özel kota, özel modeller, SLA, dedicated endpoint.

### 13.2 Ödeme Akışı
- Abonelik tabanlı (aylık/yıllık) + kullanım bazlı ek ödeme (overage).
- Stripe entegrasyonu, webhook ile otomatik provizyon.
- Ödeme başarısız → 3 gün grace period → hesap dondurma.

## 14. Entegrasyon ve API Erişimi

### 14.1 Harici API Erişimi
- API Key ile programatik erişim (chat, workflow tetikleme).
- SDK'lar: Python, JavaScript, Go (OpenAPI spec'ten otomatik üretilir).
- Webhook callback: workflow tamamlandığında kullanıcı tanımlı URL'ye POST.

### 14.2 İhracat (Export)
- Oturum geçmişini JSON, Markdown veya PDF olarak dışa aktarma.
- Workflow tanımını JSON olarak dışa aktarma/içe aktarma.
- Kullanım raporunu CSV olarak dışa aktarma.
