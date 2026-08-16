<!--
  [TR] BU DOSYANIN AMACI:
  Kapsamlı etkinlik/konferans yönetim platformunun iş mantığı kurallarını AI'a eksiksiz öğretir.
  Etkinlik hiyerarşisi, çoklu oturum planlama, bilet yaşam döngüsü, bilet transferi, QR kod
  ile giriş kontrolü, konuşmacı yönetimi, sponsor yönetimi, promosyon kodları, bekleme listesi,
  anket ve geri bildirim, bildirim otomasyonu ve analitik kurallarını kapsar.
-->

# EVENT MANAGEMENT BUSINESS LOGIC & REQUIREMENTS

## 1. CORE DOMAIN FOCUS
Bu proje, uçtan uca konferans ve etkinlik yönetim platformudur. Temel öncelikler: esnek etkinlik hiyerarşisi, çoklu oturum/ajanda planlaması, güvenli biletleme ve QR kod giriş kontrolü, bilet transferi, konuşmacı ve sponsor yönetimi, katılımcı etkileşimi (anket, canlı soru-cevap) ve kapsamlı analitiktir.

## 2. USER ROLES & PERMISSIONS
- **Roller:** `attendee` (katılımcı), `organizer` (etkinlik düzenleyicisi), `admin` (platform yöneticisi).
- **Organizer:** Kendi etkinliklerini oluşturur, yönetir. Oturum, konuşmacı, bilet tipi, sponsor ekleyebilir. Kendi etkinliklerinin satış ve check-in raporlarını görüntüler.
- **Attendee:** Etkinlikleri görüntüler, bilet satın alır, bilet transfer eder, oturumları favorilere ekler, anket doldurur.
- **Admin:** Tüm etkinlikleri yönetir, organizer onaylar, platform komisyon oranlarını belirler, sistem raporlarını görüntüler.

## 3. EVENT HIERARCHY & MANAGEMENT
- **Etkinlik Durumları:** `draft` → `published` → `cancelled` / `completed`. `draft` etkinlikler sadece organizer tarafından görüntülenebilir. `published` etkinlikler herkese açıktır.
- **Etkinlik Alanı (Venue):** Fiziksel mekan bilgisi: ad, kapasite, adres, enlem/boylam, zaman dilimi. Bir venue birden fazla Room içerebilir.
- **Oda (Room):** Venue içindeki salon/oda. Her room'un kendi kapasitesi vardır. Oturumlar room'lara atanır.
- **Çoklu Oturum (Session):** Bir etkinlikte birden fazla paralel oturum olabilir. Her oturum: başlık, açıklama, başlangıç/bitiş zamanı, oda, konuşmacı(lar), kapasite, session tipi (talk, workshop, panel, keynote, networking, break).
- **Oturum Kapasitesi:** Room kapasitesinden bağımsız olarak oturum bazında kontenjan sınırı konulabilir. Kayıt sistemi varsa `registeredCount` takip edilir.
- **Zaman Çakışması Kontrolü:** Aynı room'da aynı anda iki oturum olamaz. Aynı konuşmacı aynı anda iki oturumda olamaz. Validasyon API seviyesinde yapılır.
- **Hibrit Etkinlik:** `livestreamUrl` ile sanal katılım desteği. `isHybrid = true` olarak işaretlenir. Sanal bilet tipleri tanımlanabilir.
- **Etkinlik Galerisi:** `EventImage` ile çoklu görsel. `isCover = true` olan görsel etkinlik kartında gösterilir. `orderIndex` ile sıralama.

## 4. TICKETING & PRICING
- **Bilet Tipleri (TicketType):** Her etkinlik için en az 1 bilet tipi tanımlanır. Tipler: `paid`, `free`, `donation`. `Early Bird` için `saleStartAt`/`saleEndAt` ile zaman sınırlı fiyatlandırma.
- **Stok Yönetimi:** `maxQuantity` ile bilet tipi bazında stok sınırı. `soldCount` denormalize olarak tutulur. Stok bittiğinde `isSoldOut = true`.
- **Grup Bileti:** `isGroupTicket = true` olan bilet tipleri için `groupSize` kadar bilet tek seferde satın alınır. Grup biletleri tek tek transfer edilebilir.
- **Bilet Kişiselleştirme:** Her bilet satın alma sırasında katılımcı adı, e-posta adresi ile kişiselleştirilebilir. `Ticket.attendeeName`, `Ticket.attendeeEmail`.
- **Promosyon Kodları:** `PromoCode` modeli ile indirim kodu desteği. Kod tipleri: yüzde indirim (`percentage`, örn: %20), sabit indirim (`fixed`, örn: 50 TL). Her kod için: kullanım limiti (`maxUses`), son kullanma tarihi (`expiresAt`), geçerli bilet tipleri (`applicableTicketTypes` JSONB).
- **Bilet İade Politikası:** Organizer tarafından belirlenir. `RefundPolicy` JSONB: `{ enabled: true, rules: [{ daysBeforeEvent: 30, refundPercent: 100 }, { daysBeforeEvent: 14, refundPercent: 50 }, { daysBeforeEvent: 7, refundPercent: 0 }] }`. İade talebi otomatik hesaplanır.

## 5. BOOKING & PAYMENT
- **Booking Süreci:** Kullanıcı bilet tiplerini ve adetlerini seçer → kişiselleştirme bilgilerini girer → promosyon kodu uygular → ödeme yapar → Booking ve Ticket kayıtları oluşturulur.
- **Booking Statüleri:** `pending` (ödeme bekliyor), `confirmed` (ödeme başarılı), `cancelled` (iptal edildi), `partially_refunded`, `refunded`.
- **Ödeme Akışı:** Ödeme sağlayıcıya provizyon isteği → başarılı → Booking ve Ticket'lar oluşturulur. Ödeme ID'si `Booking.transactionId` olarak kaydedilir.
- **Stok Rezervasyonu:** `pending` booking'ler 15 dakika süreyle stok rezerve eder. Süre dolduğunda ödeme yapılmazsa stok geri verilir, booking `cancelled` olur.
- **Bilet Oluşturma:** Booking `confirmed` olduğunda her bilet için: benzersiz QR kod (JWS imzalı token), `Ticket.qrCodeHash` alanına yazılır. QR kod içeriği: `{ ticketId, bookingId, eventId, attendeeName, signature }`.

## 6. QR CODE & CHECK-IN
- **QR Kod Güvenliği:** QR kodlar JWS (JSON Web Signature) ile imzalanır. HMAC-SHA256 algoritması, sunucu tarafında `CHECKIN_SECRET` ortam değişkeni ile doğrulanır. Sahte QR kod girişi engellenir.
- **Check-In İşlemi (Idempotent):** `POST /api/v1/checkin` — QR kod taranır, JWS doğrulanır. `CheckIn` kaydı `ticketId` bazında unique constraint ile idempotenttır — aynı biletle ikinci giriş denemesi `409 Conflict` döner.
- **Check-In Cihazı:** Check-in yapan kullanıcı (staff) `checkedInBy` alanına kaydedilir. Hangi cihazdan (IP, user agent) yapıldığı loglanır.
- **Oturum Check-In:** Opsiyonel olarak oturum bazında check-in yapılabilir. `SessionCheckIn` modeli ile oturum katılım takibi.
- **Check-In Raporu:** Organizer anlık check-in sayısını, check-in oranını, bilet tipi bazında dağılımı görüntüleyebilir.

## 7. TICKET TRANSFER
- **Transfer Akışı:** Bilet sahibi `POST /api/v1/tickets/{id}/transfer` ile alıcı e-postasına transfer başlatır. Sistem `TicketTransfer` kaydı oluşturur, `transferToken` (unique, expiring) üretir, alıcıya e-posta gönderir.
- **Transfer Token:** 48 saat geçerli, tek kullanımlık, kriptografik olarak güvenli random token.
- **Transfer Kabul/Red:** Alıcı `PATCH /api/v1/transfers/{id}` ile kabul veya reddeder. Kabul durumunda: bilet `attendeeName`, `attendeeEmail` güncellenir, eski QR kod geçersiz olur (`Ticket.qrCodeHash` yeniden oluşturulur), `Ticket.previousOwnerId` eski sahibi referanslar.
- **Transfer İptali:** Gönderen, transfer henüz kabul edilmeden iptal edebilir. Kabul edilmiş transfer geri alınamaz (yeni transfer başlatılması gerekir).

## 8. WAITLIST
- **Bekleme Listesine Katılım:** Bilet tipi tükendiğinde (`isSoldOut = true`), kullanıcı bekleme listesine katılabilir.
- **Bildirim Sırası:** Bilet stoğu açıldığında (iade, ek kontenjan), bekleme listesindeki kullanıcılara FIFO sırasıyla bildirim gönderilir.
- **Bildirim Süresi:** Kullanıcıya 24 saat süre tanınır. Bu sürede satın alma yapmazsa sıradaki kişiye geçilir, `status = 'expired'`.
- **Otomatik Stok Kontrolü:** İade edilen biletler için cron job (5 dakikada bir) bekleme listesini kontrol eder.

## 9. SPEAKER & SPONSOR MANAGEMENT
- **Konuşmacı Profili:** `Speaker`: ad, biyografi, fotoğraf, şirket, unvan, sosyal medya linkleri (LinkedIn, Twitter, GitHub, website). Konuşmacılar etkinlikten bağımsız olarak kaydedilir, `EventSpeaker` junction ile etkinliğe bağlanır.
- **Konuşmacı Oturum Ataması:** Bir konuşmacı birden fazla oturuma atanabilir. `SessionSpeaker` junction tablosu ile many-to-many ilişki.
- **Sponsor Yönetimi:** `Sponsor` modeli: şirket adı, logo, website, sponsorluk seviyesi (platinum, gold, silver, bronze, media_partner), açıklama. `EventSponsor` junction ile etkinliğe bağlanır.
- **Sponsor Görünürlüğü:** Sponsor seviyesine göre etkinlik sayfasında ve uygulamada farklı konumlandırma.

## 10. ENGAGEMENT & INTERACTION
- **Anket (Survey):** Organizer etkinlik sonrası otomatik anket oluşturabilir. Soru tipleri: `rating` (1-5), `text` (açık uçlu), `multiple_choice`, `checkbox`. `SurveyResponse.answers` JSONB olarak saklanır.
- **Canlı Soru-Cevap (Opsiyonel):** Oturum sırasında katılımcılar soru sorabilir, oylayabilir. `SessionQuestion` modeli: soru metni, oy sayısı, durum (pending, approved, answered).
- **Favori Oturumlar:** Kullanıcı oturumları favorilere ekleyebilir. `UserSessionFavorite` ile kişiselleştirilmiş ajanda. Favori oturumun başlangıcına 15 dakika kala bildirim gönderilir.
- **Takvim Entegrasyonu:** Oturumlar için `.ics` (iCal) dosyası oluşturulur. `GET /api/v1/sessions/{id}/calendar` — Google Calendar, Outlook, Apple Calendar uyumlu.

## 11. NOTIFICATIONS & EMAIL AUTOMATION
- **Otomatik E-posta Tetikleyicileri:**
  - Bilet satın alma onayı (booking confirmed) — PDF bilet eki ile.
  - Etkinlik hatırlatması (24 saat ve 1 saat önce).
  - Oturum hatırlatması (favorilenen oturumlar için 15 dakika önce).
  - Bilet transfer bildirimi (alıcıya).
  - Bekleme listesi sıra bildirimi.
  - Etkinlik sonrası anket daveti (etkinlik bitiminden 2 saat sonra).
  - Etkinlik iptal bildirimi.
- **Bildirim Kanalları:** E-posta (birincil), in-app notification, push notification (mobil opsiyonel).
- **E-posta Şablonları:** Yönetilebilir e-posta şablonları. Değişkenler: `{{event.title}}`, `{{attendee.name}}`, `{{session.title}}`, `{{qrCode}}`, `{{transferLink}}`.

## 12. ANALYTICS & REPORTING
- **Organizer Dashboard:** Bilet satış grafiği (günlük), bilet tipi dağılımı, check-in oranı, gelir özeti, katılımcı demografisi, anket sonuçları.
- **Admin Dashboard:** Platform genel: toplam etkinlik, bilet satış hacmi, komisyon geliri, aktif organizer sayısı, iade oranı.
- **Dışa Aktarma:** CSV/Excel: katılımcı listesi, check-in listesi, bilet satış raporu.
- **Gerçek Zamanlı İzleme:** Etkinlik günü canlı check-in sayacı, anlık katılım oranı.

## 13. SECURITY & COMPLIANCE
- **QR Kod Sahtecilik Koruması:** JWS imzalı QR kodlar, sunucu tarafı doğrulama. Geçersiz imza → giriş reddi. İptal edilen biletlerin QR kodları `CheckIn` kaydı olmadığı için değil, `Ticket.status = 'voided'` kontrolü ile reddedilir.
- **Bilet Karaborsa Önlemi:** Aynı IP'den toplu bilet alımı limiti (maksimum 10 bilet/saat). Şüpheli aktivite admin uyarısı.
- **Rate Limiting:** Public: 1000/dk. Auth: 100/dk. Admin: 50/dk. Check-in: 300/dk/cihaz.
- **Veri Saklama:** Etkinlik verileri etkinlik bitiminden 1 yıl sonra arşivlenir. Bilet ve ödeme kayıtları yasal süre boyunca saklanır.
- **KVKK/GDPR:** Katılımcı verileri (ad, e-posta) organizer tarafından sadece etkinlik iletişimi için kullanılabilir. Katılımcı onayı olmadan pazarlama amaçlı kullanılamaz.
