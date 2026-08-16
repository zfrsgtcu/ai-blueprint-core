<!--
  [TR] BU DOSYANIN AMACI:
  Kurumsal seviye CRM (Müşteri İlişkileri Yönetimi) platformunun iş mantığı kurallarını
  AI'a eksiksiz öğretir. Lead yönetimi, özelleştirilebilir pipeline aşamaları, kişi/firma
  yönetimi, aktivite zaman çizelgesi, görev takibi, toplu işlemler, webhook entegrasyonu,
  RBAC yetkilendirme, audit logging ve veri uyumluluğu (GDPR/KVKK) kurallarını kapsar.
-->

# CRM SYSTEM BUSINESS LOGIC & REQUIREMENTS

## 1. CORE DOMAIN FOCUS
Bu proje, satış ekipleri için kurumsal seviye bir CRM (Customer Relationship Management) platformudur. Temel öncelikler: lead'ten müşteriye dönüşüm hunisi, özelleştirilebilir satış pipeline'ları, aktivite takibi (çağrı, e-posta, toplantı, not), RBAC tabanlı erişim kontrolü, tam audit logging, soft-delete ile veri bütünlüğü ve dış sistem entegrasyonlarıdır.

## 2. LEAD MANAGEMENT & QUALIFICATION
- **Lead vs Contact:** `Lead` kalifiye edilmemiş potansiyel müşteridir. Kalifiye olduğunda `convert` işlemi ile `Contact` ve isteğe bağlı `Deal` oluşturulur. Dönüşüm sonrası lead `status = 'converted'` olur.
- **Lead Statüleri:** `new` → `contacted` → `qualified` → `converted`. `unqualified` ve `archived` durumları da mevcuttur.
- **Lead Skorlaması (Lead Scoring):** Otomatik puanlama: sektör uyumu (+10), şirket büyüklüğü (+5), web sitesi ziyareti (+2/her ziyaret), e-posta açma (+3), form doldurma (+15), demo talebi (+20). Manuel puanlama da mümkündür.
- **Dönüşüm (Convert) İşlemi:** Lead → Contact + Deal (opsiyonel). Lead'e ait tüm aktiviteler ve notlar yeni Contact'a taşınır. `convertedAt`, `convertedContactId`, `convertedDealId` alanları doldurulur.
- **Mükerrer Lead Tespiti:** Aynı e-posta adresiyle lead girişinde uyarı verilir. Mevcut lead/contact ile eşleşme önerilir.

## 3. CONTACT MANAGEMENT
- **Contact:** Müşteri adayları ve mevcut müşterilerin iletişim bilgilerini tutar. Bir Contact birden fazla Account'a bağlı olabilir.
- **İletişim Bilgileri:** Birincil e-posta, alternatif e-postalar (JSONB), telefon numaraları (JSONB: [{ type, number, isPrimary }]), sosyal medya profilleri (LinkedIn, Twitter), adres.
- **Yaşam Döngüsü:** `lead` → `prospect` → `customer` → `churned` → `reactivated`. CRM'deki her contact bir yaşam döngüsü aşamasındadır.
- **GDPR/KVKK:** Consent (açık rıza) takibi: `marketingConsent`, `processingConsent`, `consentDate`, `consentSource`. Consent geri çekme (opt-out) imkanı. Veri silme/anonimleştirme talebi kaydı.

## 4. ACCOUNT / COMPANY MANAGEMENT
- **Account (Firma):** Birden fazla Contact'ın bağlı olduğu kurumsal müşteri/tedarikçi firmasıdır. Contact ↔ Account ilişkisi many-to-many'dir (bir kişi birden fazla firmada çalışabilir).
- **Firma Sınıflandırması:** Sektör (industry), şirket büyüklüğü (employees), yıllık gelir, account type (customer, partner, vendor, competitor).
- **Hiyerarşi:** `parentAccountId` ile firma-alt firma ilişkisi kurulabilir (holding → alt şirketler).

## 5. DEAL & PIPELINE MANAGEMENT
- **Özelleştirilebilir Pipeline:** Admin `PipelineStage` tablosundan aşamaları tanımlar. Her aşama için: sıralama, zorunlu alanlar (`requiredFields` JSONB), izin verilen geçişler (`allowedTransitions` JSONB). Birden fazla pipeline tanımlanabilir (örn: "Kurumsal Satış", "KOBİ Satışı").
- **Deal Statüleri:** `open`, `won`, `lost`, `on_hold`. Deal statüsü pipeline aşamasından bağımsızdır. `won` ve `lost` durumları pipeline'ın son aşamasına bağlıdır.
- **Aşama Geçiş Validasyonu:** Bir Deal bir aşamadan diğerine taşınırken, hedef aşamanın `requiredFields` listesindeki alanların dolu olması zorunludur. Eksik alan varsa `422 Unprocessable Entity` döner.
- **Tahmini Kapanış:** `expectedCloseDate` ve `probability` (%) alanları ile satış tahmini yapılır. Pipeline aşaması değiştikçe `probability` otomatik güncellenebilir.
- **Kaybedilen Deal Analizi:** `lostReason` enum'ı (price, competition, budget, timing, need_changed, other) ve `lostNotes` ile kayıp analizi yapılır.

## 6. CUSTOM FIELDS & DATA FLEXIBILITY
- **Custom Field Tanımı:** Admin, `CustomFieldDefinition` üzerinden her entity tipi (Lead, Contact, Account, Deal) için özel alanlar tanımlayabilir. Alan tipleri: `text`, `number`, `date`, `datetime`, `dropdown`, `multi_select`, `checkbox`, `url`, `email`, `phone`, `currency`.
- **Dropdown Seçenekleri:** `options` JSONB: `[{ label, value, color? }]`.
- **Validasyon:** `isRequired`, `minLength`, `maxLength`, `minValue`, `maxValue`, `regex` alanları ile validasyon kuralları tanımlanır.
- **Custom Field Değerleri:** İlgili entity'nin `customFields` JSONB alanında `{ fieldDefinitionId: value }` şeklinde saklanır.

## 7. TASK MANAGEMENT & WORKFLOW
- **Görev Tipleri:** `call`, `email`, `meeting`, `follow_up`, `proposal`, `demo`, `other`.
- **Görev Atama:** Görevler kullanıcılara atanır. Polymorphic ilişki ile Lead, Contact, Account veya Deal'e bağlanır (`entityType`, `entityId`).
- **Hatırlatıcılar:** `reminderAt` alanı ile görev başlangıcından önce bildirim gönderilir.
- **Tekrarlayan Görevler:** `isRecurring`, `recurrenceRule` (RFC 5545 RRULE formatı) ile periyodik görevler oluşturulabilir.
- **Görev Durumları:** `pending` → `in_progress` → `completed`. `cancelled` ve `deferred` durumları da vardır.
- **Günlük Özet:** Her sabah e-posta ile günün görev özeti gönderilir (gecikmiş görevler, bugün yapılacaklar).

## 8. ACTIVITY TIMELINE & COMMUNICATION
- **Aktivite Tipleri:** `call` (telefon görüşmesi), `email` (e-posta), `meeting` (toplantı), `note` (not), `task_completed` (görev tamamlandı), `stage_changed` (aşama değişikliği), `file_uploaded` (dosya yüklendi).
- **Polymorphic Timeline:** Her aktivite `entityType` (Lead, Contact, Account, Deal) ve `entityId` ile ilgili kayda bağlanır. Bir entity'nin sayfasında tüm aktiviteleri kronolojik olarak listelenir.
- **E-posta Senkronizasyonu (Opsiyonel):** IMAP/OAuth2 entegrasyonu ile gönderilen/alınan e-postalar otomatik Activity olarak kaydedilir.
- **Arama Kaydı:** Manuel çağrı girişi: arama yönü (inbound/outbound), süre, sonuç (connected, voicemail, no_answer, callback_requested), notlar.

## 9. TEAM & TERRITORY MANAGEMENT
- **Team (Ekip):** Bir `Team` bir manager ve birden fazla sales_rep'ten oluşur. Manager, ekibindeki tüm lead/contact/deal'lere erişebilir. Sales rep sadece kendi kayıtlarına erişebilir.
- **Team Hiyerarşisi:** `parentTeamId` ile alt-üst ekip ilişkisi. Üst ekip manager'ı alt ekiplerin verilerini görebilir.
- **Territory (Bölge):** Opsiyonel coğrafi/segmentsel bölge ataması. Lead'ler oluşturulduğu bölgeye göre otomatik atanabilir.

## 10. ACCESS CONTROL & RBAC
- **Roller ve İzinler:**
  - `admin`: Tam yetki. Pipeline yönetimi, kullanıcı yönetimi, audit log erişimi, sistem ayarları.
  - `manager`: Kendi ekibinin tüm verilerine erişim. Raporlama, tahminleme.
  - `sales_rep`: Sadece kendi lead/contact/deal'leri. Kendi ekibinin verilerini okuyabilir (yapılandırılabilir).
  - `viewer`: Sadece okuma yetkisi (raporlama/analiz için).
- **Owner Bazlı Erişim:** Her entity'nin `ownerId` alanı vardır. Kullanıcı sadece kendi kayıtlarını düzenleyebilir, manager kendi ekibinin kayıtlarını.
- **2FA:** Manager ve Admin rolleri için TOTP tabanlı 2FA zorunludur. Sales rep için opsiyonel ama önerilir.

## 11. BULK OPERATIONS, IMPORT & EXPORT
- **Toplu Güncelleme:** `POST /api/v1/bulk/{entityType}/update` — ID listesi ve güncellenecek alanlar ile toplu güncelleme. Maksimum 500 kayıt/istek.
- **Toplu Silme:** `POST /api/v1/bulk/{entityType}/delete` — soft-delete uygulanır. Admin onayı gerektirir.
- **Toplu Atama:** `POST /api/v1/bulk/{entityType}/assign` — seçili kayıtları başka kullanıcıya devretme.
- **CSV/Excel İçe Aktarma:** `POST /api/v1/import` — Lead, Contact, Account için CSV veya Excel (.xlsx) yükleme. Sütun eşleştirme (mapping) arayüzü. Hatalı satırlar raporlanır, başarılı satırlar içe aktarılır.
- **Dışa Aktarma:** Filtrelenmiş liste sonuçları CSV/Excel olarak dışa aktarılabilir. Maksimum 50.000 kayıt.

## 12. NOTIFICATIONS & AUTOMATION
- **Bildirim Tetikleyicileri:** Deal aşama değişikliği, görev ataması, görev hatırlatıcısı, lead ataması, yaklaşan toplantı (15 dakika önce), gecikmiş görev.
- **Bildirim Kanalları:** In-app notification, e-posta, push notification (mobil).
- **Webhook Entegrasyonu:** Dış sistemlere olay bildirimi için outbound webhook desteği. Olay tipleri: `deal.created`, `deal.stage_changed`, `deal.won`, `deal.lost`, `contact.created`, `contact.updated`, `task.completed`.
- **Webhook Güvenliği:** HMAC-SHA256 imza doğrulaması. `WebhookSubscription.secret` ile payload imzalanır. Yeniden deneme mekanizması: başarısız teslimatlar exponential backoff ile 3 kez yeniden denenir.
- **Webhook Log:** Her teslimat `WebhookDelivery` tablosunda loglanır (request/response body, HTTP status, süre).

## 13. AUDIT LOGGING & COMPLIANCE
- **Audit Trail Kapsamı:** Deal değeri değişikliği, pipeline aşama değişikliği, Contact/Lead bilgisi güncellemesi, silme/geri yükleme işlemleri, toplu işlemler.
- **Delta Saklama:** `AuditLog.changes` JSONB alanında `{ fieldName: { old: ..., new: ... } }` formatında değişiklik deltası saklanır.
- **Soft Delete:** Tüm ana entity'ler (Lead, Contact, Account, Deal) `deletedAt` ve `deletedBy` ile soft-delete edilir. Silinen kayıtlar normal listelerde görünmez, admin "Çöp Kutusu"ndan görüntüleyip geri yükleyebilir. 30 gün sonra otomatik kalıcı silme.
- **GDPR/KVKK Uyumluluğu:** Veri sahibi başvurusu (DSAR) ile kullanıcı verileri dışa aktarılabilir. Hesap silme talebinde kişisel veriler anonimleştirilir. Consent yönetimi zorunludur.

## 14. REPORTING & ANALYTICS
- **Satış Dashboard'u:** Pipeline değeri (toplam/aşama bazında), kazanma oranı (win rate %), ortalama deal süresi, tahmini gelir, ay/çeyrek karşılaştırması.
- **Huni (Funnel) Raporu:** Her pipeline aşamasındaki deal sayısı ve toplam değeri. Aşamalar arası dönüşüm oranları.
- **Aktivite Raporu:** Kullanıcı/ekip bazında çağrı, e-posta, toplantı sayıları. Hedef karşılaştırması.
- **Özel Raporlama:** Kullanıcı özel filtre ve gruplamalarla rapor oluşturabilir. Rapor şablonları kaydedilebilir.
- **Forecast (Tahminleme):** Deal probability ve expectedCloseDate bazlı ağırlıklı gelir tahmini.

## 15. SECURITY & DATA PRIVACY
- **Şifreleme:** Hassas alanlar (e-posta, telefon) AES-256 ile encrypted at rest.
- **Rate Limiting:** Public: 100/dk. Auth: 1000/dk. Bulk ops: 10/dk. Import: 5/dk.
- **Session:** JWT access token (15 dakika) + refresh token (14 gün, rotasyonlu).
- **IP Logging:** Her login, audit log girişi IP adresi ile kaydedilir.
- **Veri Saklama:** Hesap silindikten 90 gün sonra tüm veriler kalıcı olarak silinir. Yasal yükümlülük gerektiren veriler (fatura, sözleşme) saklanmaya devam eder.
