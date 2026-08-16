<!--
  Rezervasyon Sistemi — İş Mantığı Kuralları
  Bu doküman, Rezervasyon ve Randevu platformunun tüm iş mantığı kurallarını, süreç akışlarını,
  validasyon kurallarını ve domain kısıtlamalarını tanımlar.
  Kapsam: Zaman dilimi yönetimi (UTC), çifte rezervasyon önleme (pessimistic locking),
  müsaitlik hesaplama (dinamik slot), rezervasyon yaşam döngüsü (state machine),
  bekleme listesi (waitlist FIFO), tekrarlayan rezervasyonlar (RRULE),
  iade/iptal politikası, özel alanlar (custom fields) ve bildirim yönetimi.
  Tüm içerik Türkçedir.
-->
# Rezervasyon Sistemi — İş Mantığı Kuralları

## 1. Domain Odağı ve Temel Kavramlar

Rezervasyon Sistemi, zamanlama ve randevu tabanlı bir platformdur. Kaynakların (oda, personel, ekipman) belirli zaman dilimlerinde rezerve edilmesini, çakışmaların önlenmesini ve rezervasyon yaşam döngüsünün yönetilmesini sağlar.

**Temel varlıklar:**
- **Resource**: Rezerve edilebilir kaynak. Oda, personel (kuaför, doktor) veya ekipman olabilir. Kapasite ve aktiflik durumu içerir.
- **Service**: Sunulan hizmet. Süre, tampon süre (buffer) ve fiyat bilgisi içerir.
- **AvailabilitySchedule**: Bir kaynağın haftalık çalışma saatleri. Her gün için başlangıç ve bitiş saati.
- **Booking**: Rezervasyon. UTC zaman damgaları, durum makinesi, özel alanlar ve iade bilgisi içerir.
- **Waitlist**: Bekleme listesi. Dolu slot için FIFO sıralı bekleme. 72 saat sonra otomatik temizlenir.

## 2. Zaman Dilimi ve Tarih Yönetimi (KRİTİK)

### 2.1 Veritabanı Saklama
- TÜM tarih ve saatler UTC olarak `ISO 8601` formatında saklanır: `2026-07-19T16:00:00Z`.
- Yerel saatlerin veritabanında saklanması KESİNLİKLE YASAKTIR.
- `Time` tipindeki alanlar (örn: çalışma saatleri) sadece saat bilgisi tutar, timezone içermez. UTC'den bağımsız, günün saati olarak yorumlanır.

### 2.2 Zaman Dönüşümü
- Frontend, UTC zamanları kullanıcının tarayıcı timezone'una çevirir.
- API isteklerinde zaman parametreleri UTC olarak gönderilmelidir.
- `X-User-Timezone` header'ı ile client timezone'u backend'e bildirilebilir (bildirimler ve hatırlatmalar için).

### 2.3 Slot Gösterimi
- Müsait slot'lar her zaman `startTime` ve `endTime` çifti olarak temsil edilir.
- Slot süresi: service.durationMinutes + service.bufferMinutes.
- Slot'lar 5, 10, 15, 30 veya 60 dakikalık dilimler halinde gösterilebilir (hizmet bazında yapılandırılır).

## 3. Çifte Rezervasyon Önleme (CRITICAL)

### 3.1 Veritabanı Kilitleme
- Rezervasyon oluşturulurken `SELECT ... FOR UPDATE` ile pessimistic locking kullanılır.
- Veya `SERIALIZABLE` transaction isolation seviyesi ile eşzamanlı çakışmalar önlenir.
- Overlap kontrolü: `WHERE resourceId = ? AND status IN ('pending','confirmed') AND startTimeUTC < ? AND endTimeUTC > ?`.
- Çakışma durumunda `409 Conflict` + `{ message: "Seçilen zaman dilimi dolu", nextAvailableSlots: [...] }`.

### 3.2 Geçici Tutma (Soft Lock)
- Ödeme gerektiren akışlarda "Soft Lock" mekanizması: `pending` durumunda `expiresAt` süresi dolana kadar kaynak tutulur.
- Varsayılan soft lock süresi: 15 dakika.
- Süre dolduğunda cron job veya Redis TTL expiry ile `pending` rezervasyon `cancelled` durumuna geçer.
- Kullanıcıya kalan süre gösterilir: "Rezervasyonunuz 12:34 dakika içinde onaylanmazsa iptal edilecek."

### 3.3 Idempotency (Tekilleştirme)
- Ödeme ve rezervasyon oluşturma endpoint'leri idempotent olmalıdır.
- `Idempotency-Key` header'ı zorunlu. Aynı key ile tekrarlanan istekler aynı sonucu döndürür (başarılıysa 200, başarısızsa 422).
- Idempotency key'ler 24 saat saklanır.

## 4. Müsaitlik Hesaplama

### 4.1 Dinamik Slot Üretimi
- Slot'lar sabit olarak veritabanında saklanmaz, dinamik hesaplanır.
- Formül: Resource'un `AvailabilitySchedule` kayıtları → tarih aralığındaki tüm potansiyel slot'lar → mevcut onaylı/bekleyen rezervasyonlar çıkarılır → `BlockedTime`'lar çıkarılır.
- Sonuç: müsait slot listesi.

### 4.2 Tampon Süreler (Buffer)
- Hizmet bazında `bufferMinutes` tanımlanır. Örn: 60 dakikalık masaj + 15 dakika temizlik = 75 dakikalık blok.
- Gerçek bloke süre: `durationMinutes + bufferMinutes`.
- Buffer süresi rezervasyonun sonuna eklenir, başlangıca değil.

### 4.3 Kapasite Yönetimi
- `Resource.capacity > 1` olan kaynaklar için aynı zaman diliminde capacity kadar rezervasyon kabul edilir.
- Örn: 10 kişilik toplantı odası → aynı anda 10 farklı rezervasyon alabilir (farklı kullanıcılar).
- Kapasite kontrolü: `SELECT COUNT(*) FROM Booking WHERE resourceId = ? AND startTimeUTC < ? AND endTimeUTC > ? AND status IN ('pending','confirmed') < capacity`.

## 5. Rezervasyon Yaşam Döngüsü (State Machine)

### 5.1 Durum Makinesi
- `pending` → `confirmed` → `completed` (tamamlanmış) VEYA
- `pending` → `cancelled` (iptal) VEYA
- `pending` → `expired` (süre doldu) VEYA
- `confirmed` → `cancelled` (iptal) VEYA
- `confirmed` → `no_show` (gelmedi) VEYA
- `confirmed` → `completed` (tamamlandı)

### 5.2 Durum Geçiş Kuralları
- `pending` → `confirmed`: Ödeme başarılı olduğunda. `expiresAt` null yapılır.
- `pending` → `expired`: `expiresAt` süresi dolduğunda, cron job ile otomatik.
- `confirmed` → `cancelled`: Kullanıcı veya admin iptal ettiğinde. İade politikası uygulanır.
- `confirmed` → `no_show`: Rezervasyon başlangıcından 30 dakika sonra kullanıcı check-in yapmadıysa.
- `confirmed` → `completed`: Hizmet sağlandıktan sonra.
- `completed` ve `cancelled` terminal durumlardır, değiştirilemez.

### 5.3 Check-in İşlemi
- Kullanıcı rezervasyon başlangıcından 30 dakika öncesinden itibaren check-in yapabilir.
- Check-in `POST /api/bookings/{id}/checkin` ile yapılır. Body: `{ checkinCode }` (opsiyonel, QR kod).
- Check-in yapılan rezervasyon `no_show` durumuna geçmez.

## 6. İptal ve İade Politikası

### 6.1 İade Kuralları
- Rezervasyon başlangıcına >24 saat kala iptal: %100 iade.
- Rezervasyon başlangıcına 12-24 saat kala iptal: %50 iade.
- Rezervasyon başlangıcına <12 saat kala iptal: iade yok.
- `refundAmount` hesaplanıp Booking kaydına yazılır.
- Payment kaydı `refunded` durumuna geçer, `refundedAt` timestamp'i eklenir.

### 6.2 İade İş Akışı
- `POST /api/bookings/{id}/cancel` → body: `{ reason? }`.
- İade hesaplanır: `refundAmount = totalPrice * refundRate`.
- Payment gateway'e iade talebi gönderilir (Stripe refund API).
- Başarılı iade → Booking: `status=cancelled`, `refundAmount`, `cancelledAt`. Payment: `status=refunded`, `refundedAt`.
- Başarısız iade → manuel inceleme için admin bildirimi.

### 6.3 Admin İptali
- Admin herhangi bir rezervasyonu iptal edebilir.
- Admin iptalinde iade politikası aynen uygulanır.
- İstisnai tam iade admin panelinden manuel yapılabilir (AuditLog'a kaydedilir).

## 7. Bekleme Listesi (Waitlist)

### 7.1 Bekleme Listesine Ekleme
- İstenen slot doluysa kullanıcıya bekleme listesi seçeneği sunulur.
- `POST /api/waitlist` → body: `{ resourceId, serviceId?, requestedStartTimeUTC }`.
- Bekleme listesi FIFO (first-in-first-out) sıralıdır.

### 7.2 Bekleme Listesi İşleme
- Bir rezervasyon iptal edildiğinde, aynı resource ve zaman dilimi için bekleme listesindeki ilk kişiye bildirim gönderilir.
- Bildirim: e-posta + in-app + (opsiyonel) SMS.
- `notifiedAt` timestamp'i kaydedilir.
- Kullanıcıya rezervasyonu tamamlaması için 1 saat süre verilir. Tamamlanmazsa sıradaki kişiye geçilir.
- Bekleme listesi kayıtları 72 saat sonra cron job ile otomatik silinir.

## 8. Tekrarlayan Rezervasyonlar

### 8.1 Tekrarlama Tanımı
- Tekrarlayan rezervasyonlar RRULE formatında veya basit pattern olarak saklanır.
- Pattern: `{ frequency: 'daily'|'weekly'|'monthly', interval: 1, count: N, daysOfWeek?: [], endDate?: ISO }`.
- Maksimum tekrarlama sayısı: 52 (1 yıl).
- Her tekrarlama ayrı bir Booking kaydı olarak oluşturulur, `recurringGroupId` ile gruplanır.

### 8.2 Çakışma Kontrolü
- Tekrarlayan rezervasyon oluşturulurken tüm slot'lar için çakışma kontrolü yapılır.
- Herhangi bir slot'ta çakışma varsa kullanıcıya alternatif önerilir.
- Kısmi oluşturma: çakışan slot'lar atlanır, diğerleri oluşturulur (kullanıcı onayı ile).

### 8.3 Tekrarlayan Rezervasyon Yönetimi
- `DELETE /api/bookings/{id}?scope=this|this_and_future|all`: tek bir rezervasyonu, bundan sonrakileri veya tümünü iptal eder.
- `PUT /api/bookings/{id}?scope=this|this_and_future|all`: rezervasyonu günceller.
- Scope=all: `recurringGroupId`'ye ait tüm rezervasyonları etkiler.

## 9. Özel Alanlar (Custom Fields)

### 9.1 Alan Tanımı
- Service veya Resource bazında özel alanlar tanımlanabilir: `customFieldsSchema: [{ name, label, type: 'text'|'number'|'select'|'checkbox'|'date', required?, options?: [], defaultValue? }]`.
- Örn: Kuaför hizmeti → `[{ name: 'hairLength', label: 'Saç Uzunluğu', type: 'select', options: ['Kısa', 'Orta', 'Uzun'], required: true }]`.
- Özel alanlar rezervasyon sırasında doldurulur, `Booking.customFields` JSONB alanında saklanır.

### 9.2 Validasyon
- `required=true` olan alanlar boş geçilemez.
- `type='select'` ise değer `options` listesinde olmalıdır.
- `type='number'` ise `min`/`max` validasyonu yapılır.
- Maksimum 20 özel alan tanımlanabilir.

## 10. Bildirimler ve Hatırlatmalar

### 10.1 Bildirim Tetikleyicileri
- Rezervasyon onaylandı → onay e-postası.
- Rezervasyon başlangıcına 24 saat kala → hatırlatma.
- Rezervasyon başlangıcına 1 saat kala → hatırlatma.
- Rezervasyon iptal edildi → iptal bildirimi + iade bilgisi.
- Bekleme listesinde slot açıldı → bildirim.

### 10.2 Async İşleme
- Tüm bildirimler asenkron işlenir: kuyruğa eklenir, background worker tarafından gönderilir.
- Rezervasyon API yanıtı bildirim gönderimini BEKLEMEZ.
- Bildirim kanalları: e-posta (SMTP), SMS (Twilio), in-app (WebSocket).

## 11. Güvenlik ve Erişim Kontrolü

### 11.1 Kimlik Doğrulama
- Public: hizmet ve müsaitlik listeleme.
- Auth: rezervasyon oluşturma, kendi rezervasyonlarını görme/iptal.
- Admin: tüm rezervasyonlar, kaynak yönetimi, hizmet yönetimi, raporlar.

### 11.2 Rate Limiting
- Müsaitlik sorgulama: 100/dk (public ve auth).
- Rezervasyon oluşturma: 20/dk/kullanıcı.
- Admin API: 50/dk/kullanıcı.
- Bekleme listesi: 10/dk/kullanıcı.

### 11.3 Veri Erişim Kontrolü
- Kullanıcı sadece kendi rezervasyonlarını görebilir.
- Admin tüm rezervasyonları görebilir.
- Hassas alanlar (telefon, e-posta) sadece resource sahibi ve admin tarafından görülebilir.

## 12. Raporlama ve Denetim

### 12.1 Raporlar
- Günlük/Haftalık/Aylık rezervasyon özeti.
- Resource bazında doluluk oranı.
- İptal ve no-show oranları.
- Gelir raporu (toplam, iade, net).

### 12.2 Audit Log
- Rezervasyon oluşturma/güncelleme/iptal.
- Resource ve Service CRUD işlemleri.
- Manuel iade işlemleri.
- Admin iptalleri.
- Log'lar 90 gün saklanır.
