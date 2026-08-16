<!--
  [TR] BU DOSYANIN AMACI:
  Kitle fonlaması (Crowdfunding) platformunun iş mantığı kurallarını AI'a eksiksiz öğretir.
  All-or-Nothing modeli, finansal bütünlük (transactional pledging), kampanya yaşam döngüsü,
  ödül kademeleri (tier), admin onay süreci, otomatik iade mekanizması ve topluluk etkileşimi
  kurallarını kapsar.
-->

# CROWDFUNDING SYSTEM BUSINESS LOGIC & REQUIREMENTS

## 1. CORE DOMAIN FOCUS
Bu proje, All-or-Nothing modeliyle çalışan bir kitle fonlaması (Crowdfunding) platformudur. En kritik öncelikler: finansal işlem bütünlüğü, transactional pledge mekanizması, otomatik iade sistemi, admin onay süreci ve kampanya sahibi-destekçi arası güven ilişkisidir.

## 2. USER ROLES & VERIFICATION
- **Roller:** `user` (destekçi), `creator` (kampanya sahibi), `admin` (platform yöneticisi).
- **Creator Olma:** Her kullanıcı varsayılan olarak `user` rolündedir. Kampanya oluşturabilmek için `isVerified = true` olması gerekir. Doğrulama: e-posta onayı + kimlik belgesi yükleme + admin onayı.
- **Creator Panel:** Kampanya sahipleri dashboard üzerinden kampanya metriklerini (toplam destek, backer sayısı, tier doluluk oranları) görüntüler. Güncelleme, SSS, payout talebi oluşturabilir.
- **Admin Yetkileri:** Kampanya onay/red, kullanıcı doğrulama, içerik moderasyonu (yorum silme), anlaşmazlık çözümü, platform raporları.

## 3. CAMPAIGN LIFECYCLE & MANAGEMENT
- **Durum Makinesi:** `draft` → `pending_review` → `active` → `successful` / `failed`. `cancelled` her aşamada mümkündür (creator veya admin tarafından).
- **Draft Aşaması:** Kampanya oluşturma sırasında tüm bilgiler (başlık, açıklama, hedef tutar, süre, tier'lar, görseller) kaydedilir. Önizleme yapılabilir, link paylaşılamaz.
- **Admin İncelemesi (pending_review):** Kampanya `pending_review` durumuna alındığında `CampaignReview` kaydı oluşturulur. Admin; içerik uygunluğu, yasal gereklilikler, tier mantığı, görsel kalitesi açısından inceler.
  - **Onay:** `CampaignReview.status = 'approved'`, `Campaign.status = 'active'`, `Campaign.isPublished = true`, `Campaign.publishedAt = now()`.
  - **Red:** `CampaignReview.status = 'rejected'`, `rejectionReason` zorunlu. Kampanya `draft` durumuna döner, creator düzenleyip tekrar gönderebilir.
- **Deadline Kontrolü:** `deadline` geçen `active` kampanyalar cron job ile kontrol edilir:
  - `currentAmount >= goalAmount` → `successful`, `fundedAt = now()`.
  - `currentAmount < goalAmount` → `failed`, otomatik iade süreci başlatılır.
- **Zaman Uzatma:** Creator, deadline'dan önce admin onayı ile deadline'ı maksimum 1 kez, en fazla 30 gün uzatabilir.
- **Başarılı Kampanya Sonrası:** Creator payout talep edebilir. Kampanya sayfası arşivde kalır, yeni pledge alınmaz (`allowLatePledges=true` ise alınabilir).

## 4. FINANCIAL INTEGRITY & PLEDGING
- **All-or-Nothing Modeli:** Kampanya hedefine ulaşamazsa tüm pledge'ler otomatik iade edilir. Kısmi ödeme yoktur. Platform komisyonu sadece başarılı kampanyalardan payout sırasında kesilir.
- **Pledge Atomikliği (Transaction):** Pledge oluşturma işlemi TEK bir veritabanı transaction'ında gerçekleşmelidir:
  1. `Campaign.status = 'active'` VE `deadline > NOW()` kontrolü.
  2. Eğer `tierId` verilmişse: `Tier.currentBackers < Tier.maxBackers` stok kontrolü. `SELECT ... FOR UPDATE` ile race condition önlenir.
  3. Ödeme sağlayıcıya provizyon (authorization) isteği gönderilir.
  4. Başarılıysa: `Pledge` kaydı oluşturulur (`status: 'authorized'`).
  5. `Campaign.currentAmount += pledge.amount`, `Campaign.backerCount += 1`.
  6. Eğer tier varsa: `Tier.currentBackers += 1`. `Tier.currentBackers >= Tier.maxBackers` ise `Tier.isSoldOut = true`.
- **Hata Senaryoları:**
  - Ödeme provizyonu başarısız → transaction rollback, `409 Conflict` + hata mesajı.
  - Tier stok dolu → `409 Conflict` + `TIER_SOLD_OUT` kodu.
  - Kampanya aktif değil veya deadline geçmiş → `422 Unprocessable Entity` + `CAMPAIGN_NOT_ACCEPTING` kodu.
- **Ödeme Yakalama (Capture):** Ödeme sağlayıcıdan gelen webhook ile `Pledge.status` `authorized` → `captured` güncellenir. Bu adım asenkrondur.
- **Ödeme Başarısız:** Webhook `failed` bildirirse → `Pledge.status = 'failed'`, `Campaign.currentAmount` ve `backerCount` geri alınır, tier stok geri verilir.

## 5. TIER / REWARD STRUCTURE
- **Kademe Tanımı:** Her kampanya en az 1, en fazla 15 tier'a sahip olabilir. Tier'lar artan `amount` değerine göre otomatik sıralanır.
- **Stok Yönetimi:** `maxBackers` ile sınırlı tier'lar için `currentBackers` takip edilir. Stok dolduğunda `isSoldOut = true` olur ve yeni pledge alınmaz.
- **Zorunlu Tier:** Kampanyada en az 1 tier olmalıdır. "No reward" (ödülsüz destek) için `amount = minPledgeAmount` olan varsayılan tier otomatik oluşturulur.
- **Tier Güncelleme Kısıtı:** `active` durumundaki kampanyada mevcut tier'ın `amount` ve `maxBackers` değeri değiştirilemez (mevcut backer'ları etkilememek için). Yeni tier eklenebilir, mevcut tier'ın `description` ve `estimatedDeliveryDate` güncellenebilir.
- **Reward Snapshot (KRİTİK):** Pledge anında tier bilgileri (`title`, `description`, `includes`, `estimatedDeliveryDate`) `Pledge.rewardSnapshot` alanına kopyalanır. Tier sonradan değişse veya silinse bile pledge kaydı etkilenmez.

## 6. PAYOUT & FEES
- **Payout Talebi:** Sadece `successful` kampanyaların creator'ı payout talep edebilir. Maksimum ayda 1 payout.
- **Platform Komisyonu:** `Payout.platformFee = Payout.amount * <komisyon_oranı>` (varsayılan: %5). `Payout.netAmount = Payout.amount - Payout.platformFee`. Komisyon oranı admin panelinden yapılandırılabilir.
- **Payout Yöntemi:** Banka havalesi (IBAN zorunlu). `Payout.payoutMethod` JSONB olarak saklanır.
- **Payout Limiti:** Minimum payout tutarı platform ayarlarında belirlenir (varsayılan: 100 TL). Bu tutarın altında payout talep edilemez.

## 7. REFUND AUTOMATION
- **Başarısız Kampanya İadesi:** `deadline` geçen ve `currentAmount < goalAmount` olan kampanyalar için:
  1. Cron job (her saat çalışır), uygun kampanyaları bulur.
  2. Kampanyanın tüm `captured` durumundaki pledge'leri bulunur.
  3. Her pledge için ödeme sağlayıcıya refund isteği gönderilir.
  4. Başarılı iade: `Pledge.status = 'refunded'`, `Pledge.refundedAt = NOW()`.
  5. Tüm pledge'ler iade edildikten sonra `Campaign.status = 'failed'`.
- **Kısmi İade:** `Pledge.refundAmount` ile kısmi iade mümkündür (admin tarafından, anlaşmazlık durumlarında).
- **Creator İptali:** Creator kampanyayı `cancelled` yaparsa, başarılı olsa bile tüm pledge'ler iade edilir.

## 8. COMMUNITY & ENGAGEMENT
- **Yorum Sistemi:** Kayıtlı kullanıcılar kampanyalara yorum yapabilir. İç içe yanıt desteği (maksimum 2 seviye: yorum → yanıt).
- **Creator Rozeti:** Kampanya sahibinin yorumları `isCreatorReply = true` olarak işaretlenir ve özel rozetle gösterilir.
- **Spam Koruması:** Kullanıcı başına 1 dakikada maksimum 3 yorum. CAPTCHA zorunlu.
- **Favoriler:** Kullanıcılar kampanyaları favorilere ekleyebilir. Favorilenen kampanya aktif olduğunda, güncelleme aldığında, deadline yaklaştığında (24 saat) ve sonuçlandığında bildirim gönderilir.
- **Sosyal Paylaşım:** Kampanya sayfası Open Graph meta etiketleri içermelidir. Pledge sonrası "paylaş" CTA'si gösterilir.
- **Kampanya Güncellemeleri:** Creator, `CampaignUpdate` ile ilerleme raporu paylaşabilir. `isPublic = false` güncellemeler sadece backer'lara gösterilir. Her güncelleme sonrası backer'lara ve favorilere bildirim gider.

## 9. SEARCH & DISCOVERY
- **Arama:** Kampanya başlığı, açıklaması ve etiketlerinde tam metin araması. Filtreler: kategori, durum, tutar aralığı, sıralama (trending, yeni, bitişe yakın, en çok desteklenen).
- **Trending Algoritması:** `trendingScore = (backerCount * 2) + (currentAmount / goalAmount * 50) + (commentCount * 0.5) - (hoursUntilDeadline * 0.1)`. Negatif değer 0'a çekilir.
- **Ana Sayfa Vitrini:** `isPublished = true AND status = 'active'` kampanyalar arasından; featured (admin seçimi), trending, yakında bitecek, yeni eklenen şeklinde bölümler.

## 10. NOTIFICATIONS
- **Bildirim Tipleri:** `campaign_update`, `pledge_confirmed`, `pledge_refunded`, `campaign_succeeded`, `campaign_failed`, `comment_reply`, `favorite_reminder`, `admin_review`.
- **Bildirim Kanalları:** In-app notification (varsayılan), e-posta (opsiyonel, kullanıcı tercihine bağlı).
- **Toplu Bildirim:** Kampanya güncellemelerinde backer sayısı > 1000 ise, bildirimler kuyruk (queue) üzerinden toplu olarak işlenir.

## 11. SECURITY & COMPLIANCE
- **Finansal Veri Koruma:** `Pledge.transactionId` ve `Payout.payoutMethod` hassas veri olarak işaretlenir, log'larda maskelenir.
- **Rate Limiting:** Public endpoint'lerde 1000 req/dk, pledge endpoint'inde 10 req/dk/kullanıcı, yorum endpoint'inde 20 req/dk/kullanıcı.
- **Idempotency:** `POST /api/v1/pledges` endpoint'i `Idempotency-Key` header'ı gerektirir. Aynı key ile tekrarlanan istekler aynı sonucu döndürür, çift pledge oluşturmaz.
- **KVKK/GDPR:** Kullanıcı verileri şifreli saklanır. Hesap silme talebinde pledge geçmişi anonimleştirilir, finansal kayıtlar yasal süre boyunca saklanır.
- **Dolandırıcılık Koruması:** Aynı IP'den farklı hesaplarla aynı kampanyaya çoklu pledge, anormal yüksek tutarlı pledge tespiti. Admin uyarısı oluşturulur.

## 12. ANALYTICS & REPORTING
- **Creator Dashboard:** Günlük pledge grafiği, backer demografisi, trafik kaynakları, tier doluluk oranları, ortalama pledge tutarı.
- **Admin Dashboard:** Toplam kampanya/backer/pledge sayısı, toplam işlem hacmi, başarı oranı, kategori bazında dağılım, aylık komisyon geliri.
- **Export:** CSV dışa aktarma (admin ve creator). Admin tüm platform verilerini export edebilir.
- **Otomatik Rapor:** Her ay sonu creator'lara kampanya özet raporu e-posta ile gönderilir.
