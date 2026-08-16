<!--
  E-Öğrenme (LMS) — İş Mantığı Kuralları
  Bu doküman, Kurumsal Öğrenme Yönetim Sistemi'nin tüm iş mantığı kurallarını,
  süreç akışlarını, validasyon kurallarını ve domain kısıtlamalarını tanımlar.
  Kapsam: Kurs hiyerarşisi (Course→Module→Lesson), kayıt ve erişim kontrolü,
  drip-feeding (içerik kademeli açma), ilerleme takibi (server-side heartbeat),
  quiz ve ödev değerlendirme (sunucu taraflı, güvenlik kritik), sertifika üretimi,
  kupon ve ödeme yönetimi (server-side fiyat doğrulama), forum ve canlı ders,
  eğitmen dashboard'u ve denetim.
  Tüm içerik Türkçedir.
-->
# E-Öğrenme Sistemi (LMS) — İş Mantığı Kuralları

## 1. Domain Odağı ve Temel Kavramlar

E-Öğrenme Sistemi, kurumsal ve bireysel kullanıcılar için kapsamlı bir Öğrenme Yönetim Sistemi'dir (LMS). Kurs hiyerarşisi, sunucu taraflı değerlendirme, güvenli içerik akışı, sertifika otomasyonu ve entegre ödeme altyapısı ile tam teşekküllü bir eğitim platformudur.

**Temel varlıklar:**
- **Course**: Kurs. Eğitmen tarafından oluşturulur. Kategori, seviye, fiyat ve yayın durumu içerir.
- **Module**: Modül. Kurs içindeki bölümler. Sıralı yapı.
- **Lesson**: Ders. Video, metin, quiz veya ödev formatında. Drip-feeding ile kademeli açılabilir.
- **Enrollment**: Kayıt. Kullanıcının kursa erişim hakkı. Süreli veya süresiz.
- **Certificate**: Sertifika. Kurs tamamlandığında otomatik üretilir. Doğrulanabilir sertifika numarası.
- **Quiz/Assignment**: Sınav ve ödev. Sunucu taraflı puanlama, güvenlik kritik.

## 2. Kurs Hiyerarşisi ve Erişim Kontrolü

### 2.1 Hiyerarşi Yapısı
- **Course → Module → Lesson**: Her ders bir modüle, her modül bir kursa aittir.
- Modüller `orderIndex` ile sıralanır. Dersler modül içinde `orderIndex` ile sıralanır.
- Bir kurs en az 1 modül, en fazla 50 modül içerebilir.
- Bir modül en az 1 ders, en fazla 100 ders içerebilir.

### 2.2 Ders Formatları
- **video**: HLS/signed URL ile güvenli video akışı. `durationMinutes` ve `videoUrl` zorunlu.
- **markdown**: Metin tabanlı ders. `content` alanında Markdown.
- **quiz**: Sınav dersi. Quiz modeline bağlı.
- **assignment**: Ödev dersi. Assignment modeline bağlı.

### 2.3 Erişim Kontrolü
- Kullanıcı, kursa erişmek için aktif bir `Enrollment` kaydına sahip olmalıdır.
- `Enrollment.status = active` ve `expiresAt > NOW()` (veya null) → erişim var.
- Kayıtsız kullanıcılar sadece `isFreePreview = true` dersleri görebilir.
- Preview kısıtlamaları: video için maksimum 5 dakika, metin için maksimum 500 kelime.

### 2.4 İçerik Kademeli Açma (Drip-Feeding)
- Modül/ders bazında `unlockDelayHours` tanımlanabilir.
- Hesaplama: `enrollmentDate + (önceki tüm derslerin unlockDelayHours toplamı)`.
- Zamanı gelmemiş ders için `403 Forbidden` + `{ unlockAt: ISO8601, remainingHours: N }`.
- Drip-feeding opsiyoneldir, varsayılan olarak tüm içerik hemen açıktır.

## 3. İlerleme Takibi (KRİTİK GÜVENLİK)

### 3.1 Video İlerleme Takibi (Server-Side Heartbeat)
- Frontend ilerleme raporlarına GÜVENİLMEZ.
- Video oynatma sırasında client her 15 saniyede bir heartbeat gönderir: `POST /api/progress/heartbeat`.
- Body: `{ lessonId, currentTime, playbackRate, isPlaying }`.
- Backend `watchedDuration` hesaplar: eğer `isPlaying = true` ise `elapsed * playbackRate` eklenir.
- `watchedDuration >= durationMinutes * 0.90` → ders tamamlandı (`isCompleted = true`).
- Aynı saniyeyi tekrar gönderme (seek geri) → sayılmaz.
- Hızlı izleme tespiti: `playbackRate > 2.0` → heartbeat kabul edilmez, uyarı loglanır.

### 3.2 Kurs İlerleme Yüzdesi
- `kullanıcının tamamladığı ders sayısı / toplam ders sayısı * 100`.
- Quiz dersleri: quiz'den geçer not alındıysa tamamlandı.
- Ödev dersleri: ödev gönderildi ve notlandıysa tamamlandı.
- `GET /api/enrollments/{id}/progress` → `{ completedLessons, totalLessons, percentage, lastActivityAt }`.

### 3.3 İlerleme Sıfırlama
- Kullanıcı `POST /api/enrollments/{id}/reset-progress` ile ilerlemesini sıfırlayabilir.
- Tüm `LessonProgress` kayıtları silinir, quiz tekrar alma hakkı sıfırlanır.
- Bu işlem `AuditLog`'a kaydedilir. Sebep alanı zorunlu.

## 4. Quiz (Sınav) Değerlendirme (SUNUCU TARAFLI)

### 4.1 Güvenlik Kuralları (KRİTİK)
- Quiz cevapları SADECE sunucu tarafında değerlendirilir.
- Doğru cevap anahtarları (`Question.correctOptionId`) CLIENT'A GÖNDERİLMEZ.
- Quiz API'si sadece soru metinlerini ve seçenekleri döndürür, doğru cevap bilgisi olmadan.
- Sınav süresi: `timeLimitMinutes` varsa, `startedAt + timeLimitMinutes` sonrası cevaplar kabul edilmez.
- Soru karıştırma: `shuffleQuestions = true` ise sorular rastgele sıralanır (her denemede farklı).

### 4.2 Soru Formatları
- **multiple_choice**: Çoktan seçmeli. `correctOptionId` ile doğru seçenek işaretlenir.
- **true_false**: Doğru/Yanlış. İki seçenek, biri doğru.
- **fill_in_the_blank**: Boşluk doldurma. `correctOptionId` null, cevap metin karşılaştırması ile değerlendirilir (trim + lowercase + normalize).
- **essay**: Açık uçlu. Otomatik puanlanmaz, eğitmen manuel değerlendirir.

### 4.3 Sınav Denemesi (Quiz Attempt)
- `attemptsAllowed`: maksimum deneme sayısı (0 = sınırsız).
- Her denemede: `QuizAttempt` oluşturulur, `answers` JSONB snapshot'ı kaydedilir.
- `score >= passingScore` → `isPassed = true`.
- Başarısız denemeler: kullanıcıya yanlış cevaplar ve açıklamalar gösterilir.
- En yüksek skorlu deneme geçerli sayılır.

### 4.4 Kopya Önleme
- Sınav sırasında sekme değiştirme tespiti (Page Visibility API).
- 3'ten fazla sekme değiştirme → sınav otomatik teslim edilir, `cheatFlag = true`.
- Klavye kısayolları engellenir (Ctrl+C, Ctrl+V, Ctrl+P).
- Sağ tık ve metin seçimi devre dışı bırakılır (CSS `user-select: none`).

## 5. Ödev (Assignment) Değerlendirme

### 5.1 Ödev Gönderimi
- `POST /api/assignments/{id}/submit`: multipart dosya yükleme.
- Desteklenen formatlar: PDF, DOCX, ZIP, PNG, JPG (max 50 MB).
- Son teslim tarihi (`dueDate`) kontrolü: geçmişse `submissionStatus = late` işaretlenir.
- Aynı ödeve tekrar gönderim: önceki `AssignmentSubmission` `superseded` durumuna geçer.

### 5.2 Eğitmen Değerlendirmesi
- `PATCH /api/admin/submissions/{id}/grade`: body `{ score, feedback, resubmissionRequired? }`.
- `resubmissionRequired = true` → öğrenciye yeniden gönderim hakkı, bildirim gönderilir.
- `score` maksimum `Assignment.maxScore` değerini aşamaz.
- Notlandırma sonrası öğrenciye bildirim: e-posta + in-app.

## 6. Sertifika Yönetimi

### 6.1 Sertifika Otomasyonu
- Kurs tamamlama koşulu: tüm dersler tamamlandı + tüm quiz'lerden geçildi + tüm ödevler notlandı.
- Koşullar sağlandığında `Certificate` otomatik oluşturulur.
- `certificateNumber`: UUID veya `CERT-{timestamp}-{random6}` formatında, tahmin edilemez.
- Her kullanıcı-kurs çifti için sadece 1 sertifika.

### 6.2 Sertifika Doğrulama
- `GET /api/certificates/verify/{certificateNumber}` → public endpoint.
- Response: `{ valid: true, studentName, courseName, issueDate, instructorName }`.
- Doğrulama sayfası: sertifika bilgileri + PDF indirme linki.
- Sertifika iptal edildiyse `{ valid: false, reason: 'revoked' }`.

### 6.3 Sertifika Tasarımı
- PDF olarak üretilir (Puppeteer/Playwright ile HTML → PDF).
- Tasarım şablonu: kurum logosu, öğrenci adı, kurs adı, tamamlama tarihi, sertifika numarası.
- Özelleştirilebilir şablon: kurum admin panelinden logo ve renk değiştirebilir.

## 7. Gelir, Kupon ve Ödeme

### 7.1 Fiyat Doğrulama (KRİTİK)
- Client'tan gelen fiyat bilgisine ASLA güvenilmez.
- `POST /api/orders/checkout`: body `{ courseId, couponCode? }`.
- Backend kurs fiyatını veritabanından okur, kuponu doğrular, toplam tutarı HESAPLAR.
- Client fiyatı ile backend fiyatı uyuşmazsa `400 Price Mismatch`.

### 7.2 Kupon Doğrulama
- Kupon kodları: `code` (unique, büyük harf), `discountType` (percentage/fixed), `discountValue`.
- Doğrulama kontrolleri: `validUntil > NOW()`, `usedCount < maxUses`, `isActive = true`.
- `discountType = percentage`: `finalPrice = price * (1 - discountValue/100)`.
- `discountType = fixed`: `finalPrice = price - discountValue` (min 0).
- Kupon kullanıldığında `usedCount++` atomik olmalıdır.
- Geçersiz kupon → `422 Invalid Coupon` + spesifik sebep (expired, exhausted, inactive).

### 7.3 Ödeme Akışı
- `POST /api/orders/checkout` → `{ orderId, amount, currency }`.
- Client bu orderId ile payment gateway'e yönlendirilir.
- Webhook: `POST /api/webhooks/payment` → payment gateway'den gelen sonuç.
- Başarılı ödeme → Order: `status=completed`, Enrollment oluşturulur.
- Başarısız ödeme → Order: `status=failed`, kullanıcıya bildirim.

### 7.4 İade Politikası
- 14 gün içinde iade hakkı (yasal zorunluluk).
- `Enrollment.refundedAt` işaretlenir, erişim anında kesilir.
- Sertifika verilmişse sertifika iptal edilir.
- Ödeme webhook'u ile iade işlenir.

## 8. Forum ve Topluluk

### 8.1 Kurs Forumu
- Her kursun kendine ait forum alanı.
- `ForumThread`: kurs altında başlık. `isPinned` ile sabitlenebilir.
- `ForumPost`: thread altında gönderi. İç içe değil, düz liste.
- Sadece kayıtlı öğrenciler ve eğitmenler gönderi oluşturabilir.

### 8.2 Moderasyon
- Eğitmen ve admin gönderileri silebilir, thread'i kilitleyebilir.
- Spam koruması: aynı kullanıcı 60 saniyede 1 gönderi.
- Uygunsuz içerik raporlama: `POST /api/forum/posts/{id}/report` → admin incelemesi.

## 9. Canlı Ders

### 9.1 Entegrasyon
- Zoom, Google Meet veya WebRTC endpoint'i.
- `LiveSession`: başlık, açıklama, `scheduledAt`, `durationMinutes`, `meetingUrl`.
- Kurs sayfasında zaman çizelgesinde gösterilir.

### 9.2 Kayıt ve Arşiv
- Canlı ders sonrası `recordingUrl` alanına kayıt linki eklenir.
- Kayıtlar sadece kayıtlı öğrenciler tarafından izlenebilir.
- Kayıtlar 90 gün sonra otomatik silinir (veya kurum ayarına göre).

## 10. Eğitmen Dashboard'u

### 10.1 Öğrenci Analitiği
- Kurs başına kayıtlı öğrenci sayısı.
- Tamamlama oranı (enrolled vs completed).
- Ortalama quiz skoru, ortalama ödev notu.
- En çok zorlanılan dersler (quiz başarısızlık oranına göre).

### 10.2 Gelir Raporu
- Toplam gelir, iade tutarı, net gelir.
- Kupon kullanım istatistikleri.
- Aylık gelir grafiği.

## 11. Bildirimler

### 11.1 Bildirim Tetikleyicileri
- Kursa kayıt onayı.
- Drip-feeding ile yeni ders açıldı.
- Ödev notlandı.
- Quiz sonucu.
- Sertifika verildi.
- Forum yanıtı.
- Canlı ders yaklaşıyor (1 saat, 24 saat kala).
- Ödeme başarılı/başarısız.
- İade işlendi.

### 11.2 Bildirim Kanalları
- In-app (WebSocket).
- E-posta (SMTP).
- İsteğe bağlı: Push notification (FCM/APNs).

## 12. Güvenlik ve Denetim

### 12.1 Erişim Kontrolü
- Public: kurs listeleme, preview dersler, sertifika doğrulama.
- Auth (student): kayıtlı kurslara erişim, ilerleme takibi, forum.
- Auth (instructor): kendi kurslarını yönetme, öğrenci değerlendirme, gelir raporu.
- Admin: tüm kurslar, kullanıcı yönetimi, platform ayarları.

### 12.2 Rate Limiting
- Video heartbeat: 60/dk/kullanıcı.
- Quiz cevap gönderimi: 10/dk/kullanıcı.
- Ödeme: 5/dk/kullanıcı.
- Admin: 50/dk/kullanıcı.

### 12.3 Audit Log
- Kayıt oluşturma/iptal.
- Quiz denemesi başlatma/tamamlama.
- Ödev gönderimi/notlandırma.
- Sertifika verme/iptal.
- Ödeme ve iade işlemleri.
- İlerleme sıfırlama.
- Log'lar 90 gün saklanır.
