<!--
  Bulut Depolama — İş Mantığı Kuralları
  Bu doküman, Bulut Depolama platformunun tüm iş mantığı kurallarını, süreç akışlarını,
  validasyon kurallarını ve domain kısıtlamalarını tanımlar.
  Kapsam: Doğrudan buluta yükleme (pre-signed URL), çok parçalı (multipart) yükleme,
  klasör hiyerarşisi (adjacency list + materialized path), dosya sürümleme (versioning),
  çakışma çözümü (conflict resolution), depolama kotası, çöp kutusu (soft delete, 30 gün),
  paylaşımlı linkler (token, şifre, expiry, download tracking) ve güvenlik.
  Tüm içerik Türkçedir.
-->
# Bulut Depolama — İş Mantığı Kuralları

## 1. Domain Odağı ve Temel Kavramlar

Bulut Depolama, kullanıcıların dosyalarını bulutta saklayabildiği, klasörler halinde organize edebildiği, sürüm takibi yapabildiği ve güvenli bağlantılarla paylaşabildiği bir dosya barındırma ve senkronizasyon platformudur.

**Temel varlıklar:**
- **Folder**: Klasör. Hiyerarşik yapı (parentId + materialized path). Çöp kutusu desteği (soft delete).
- **File**: Dosya. S3/DigitalOcean Spaces üzerinde saklanır. Sürüm zinciri (versionNumber, previousVersionId). Çöp kutusu desteği.
- **SharedLink**: Paylaşım bağlantısı. Token tabanlı, isteğe bağlı şifre ve son kullanma tarihi. İndirme takibi.
- **User**: Kullanıcı. Depolama kotası (storageQuota, storageUsed). Kullanılan alan trigger/ORM hook ile güncellenir.

## 2. Dosya Yükleme Stratejisi (KRİTİK)

### 2.1 Doğrudan Buluta Yükleme (Pre-signed URL)
- Backend büyük dosya upload'larını bellekte TUTMAZ.
- `POST /api/files/presigned-url` → body: `{ fileName, mimeType, sizeBytes, folderId? }`.
- Backend kotayı kontrol eder (storageUsed + sizeBytes <= storageQuota). Kota doluysa `413 Quota Exceeded`.
- Backend AWS S3/DigitalOcean Spaces için pre-signed PUT URL üretir (varsayılan: 15 dakika geçerli).
- Response: `{ uploadUrl, storageKey, fields?: {}, expiresIn: 900 }`.
- Client dosyayı doğrudan pre-signed URL'e yükler.
- Yükleme tamamlandıktan sonra `POST /api/files/confirm` → body: `{ storageKey, folderId?, name? }`. Backend veritabanı kaydını oluşturur.

### 2.2 Çok Parçalı (Multipart) Yükleme
- Büyük dosyalar (>50 MB) için multipart yükleme zorunludur.
- Akış: `POST /api/files/multipart/init` → `POST /api/files/multipart/{uploadId}/presigned-url?partNumber=N` (her parça için) → client parçaları yükler → `POST /api/files/multipart/{uploadId}/complete`.
- Parça boyutu: 5 MB - 50 MB arası (S3 multipart gereksinimi).
- Maksimum parça sayısı: 10.000.
- Yükleme ilerlemesi: WebSocket veya polling endpoint (`GET /api/files/multipart/{uploadId}/progress`) ile takip edilebilir.
- Yarım kalan multipart yüklemeler 24 saat sonra cron job ile abort edilir ve parçalar temizlenir.

### 2.3 Yükleme Onayı (Confirm)
- Client pre-signed URL'e yükleme yaptıktan sonra mutlaka confirm endpoint'ini çağırmalıdır.
- Confirm sırasında storageKey'in gerçekten yüklenip yüklenmediği kontrol edilir (S3 HEAD request).
- Yüklenmemiş storageKey → `404 File not uploaded yet`.
- Confirm başarılı → File kaydı oluşturulur, storageUsed güncellenir.

### 2.4 Dosya Türü ve Boyut Kısıtlamaları
- Hiçbir dosya türü kısıtlaması yoktur (tüm MIME type'lar kabul edilir).
- Maksimum tek dosya boyutu: 5 GB (S3 multipart limiti).
- Zararlı dosya taraması: opsiyonel ClamAV entegrasyonu (admin ayarı).

## 3. Klasör Hiyerarşisi ve Navigasyon

### 3.1 Sanal Dosya Sistemi
- Adjacency List: `parentId` ile klasör ağacı.
- Materialized Path: `path` alanı sorgu performansı için denormalize edilir. Örn: `/root-folder-id/child-folder-id/`.
- `path` alanı klasör taşındığında veya yeniden adlandırıldığında güncellenir.
- Kök seviye klasörler: `parentId = null`, `path = '/'`.

### 3.2 Taşıma İşlemleri (Move)
- `PUT /api/folders/{id}/move?targetFolderId={newParentId}`.
- Taşıma atomik transaction olmalıdır: sadece `parentId` ve `path` güncellenir.
- Alt klasörlerin ve dosyaların `storageKey` değeri DEĞİŞMEZ.
- Hedef klasörün alt klasörü olup olmadığı kontrolü yapılır (döngüsel referans engeli).
- Hedef klasörde aynı isimde klasör varsa `409 Conflict`.

### 3.3 Klasör İçeriği Listeleme
- `GET /api/folders/{id}/contents?sort=name|date|size&order=asc|desc`.
- Response: `{ folders: [...], files: [...], totalCount }`.
- Çöp kutusundaki öğeler (`isTrashed=true`) listelenmez.
- Özyinelemeli listeleme: `?recursive=true` ile tüm alt klasör içerikleri (maksimum derinlik: 10).

## 4. Yeniden Adlandırma

### 4.1 Dosya Yeniden Adlandırma
- `PUT /api/files/{id}/rename` → body: `{ name }`.
- SADECE veritabanı `name` alanı güncellenir. `storageKey` DEĞİŞMEZ.
- Atomik transaction olmalıdır.
- Aynı klasörde aynı isimli dosya varsa `409 Conflict`.

### 4.2 Klasör Yeniden Adlandırma
- `PUT /api/folders/{id}/rename` → body: `{ name }`.
- Klasörün ve tüm alt öğelerinin `path` alanı güncellenir.
- Aynı parent altında aynı isimli klasör varsa `409 Conflict`.

## 5. Dosya Sürümleme (Versioning)

### 5.1 Sürüm Oluşturma
- Aynı klasöre aynı isimli dosya yüklendiğinde yeni sürüm oluşturulur.
- Eski sürüm: `versionNumber` sabit kalır, `isLatest = false`.
- Yeni sürüm: `versionNumber = eski.versionNumber + 1`, `previousVersionId = eski.id`, `isLatest = true`.
- Her sürüm için ayrı `storageKey` (farklı S3 nesnesi).

### 5.2 Sürüm Geçmişi
- `GET /api/files/{id}/versions` → tüm sürümlerin listesi (versionNumber DESC).
- Her sürüm için: `id, versionNumber, sizeBytes, createdAt, isLatest`.

### 5.3 Sürüm Geri Yükleme
- `POST /api/files/{id}/versions/{versionId}/restore`.
- Geri yüklenen sürümün içeriği yeni bir sürüm olarak eklenir (geçmiş KORUNUR).
- Yeni sürüm oluşturulur: `versionNumber = max(versions) + 1`, `storageKey` eski sürümün storageKey'i (copy yapılır).

### 5.4 Sürüm Temizleme
- Maksimum sürüm sayısı: 100 (yapılandırılabilir). Aşımda en eski sürümler silinir.
- Sürüm silindiğinde S3 nesnesi de silinir.

## 6. Depolama Kotası ve Tekilleştirme

### 6.1 Kota Yönetimi
- `User.storageQuota`: bayt cinsinden kota (Free: 5 GB, Pro: 100 GB, Enterprise: 1 TB).
- `User.storageUsed`: bayt cinsinden kullanılan alan. Trigger veya ORM hook ile otomatik güncellenir.
- Kota kontrolü pre-signed URL oluşturulmadan ÖNCE yapılır.
- Kota %80 doluluk → in-app bildirim.
- Kota %100 doluluk → yükleme engellenir, `413 Quota Exceeded` + `X-Quota-Reset` header'ı (opsiyonel).

### 6.2 Tekilleştirme (Deduplication) — Opsiyonel
- Aynı `fileHash` (SHA-256) ile dosya zaten mevcutsa, fiziksel kopya oluşturulmaz.
- Mevcut dosyanın `storageKey`'i referans alınır.
- Yeni bir File kaydı oluşturulur, ancak aynı S3 nesnesini gösterir.
- Referans sayacı: dosyayı referans alan File kaydı sayısı. 0 olduğunda S3 nesnesi silinebilir.

## 7. Çöp Kutusu (Soft Delete)

### 7.1 Çöp Kutusuna Taşıma
- `DELETE /api/files/{id}` → soft delete: `isTrashed = true`, `trashedAt = NOW()`.
- `DELETE /api/folders/{id}?recursive=true` → klasör ve tüm alt öğeler soft delete.
- Çöp kutusundaki öğeler normal listelemelerde görünmez.
- `GET /api/trash` → çöp kutusu içeriği.

### 7.2 Çöp Kutusundan Geri Yükleme
- `POST /api/trash/{id}/restore?type=file|folder`.
- Dosya: `isTrashed = false`, `trashedAt = null`, orijinal `folderId`'sine geri döner.
- Klasör: tüm alt öğelerle birlikte geri yüklenir.
- Orijinal parent klasör silinmişse, kök seviyeye geri yüklenir ve kullanıcıya uyarı gösterilir.

### 7.3 Kalıcı Silme
- Cron job her gece çalışır: `trashedAt < NOW() - 30 days` olan tüm dosya ve klasörleri kalıcı siler.
- Kalıcı silme: veritabanı kaydı + S3 nesnesi silinir.
- Klasör kalıcı silindiğinde tüm alt öğeler de kalıcı silinir (recursive).
- Kullanıcı `DELETE /api/trash/{id}/permanent` ile manuel kalıcı silebilir.

## 8. Paylaşımlı Bağlantılar (Shared Links)

### 8.1 Bağlantı Oluşturma
- `POST /api/files/{id}/share` veya `POST /api/folders/{id}/share`.
- Body: `{ accessType: 'view'|'edit', expiresAt?: ISO8601, password?: string }`.
- Token: 32 karakter kriptografik güvenli rastgele string.
- Response: `{ shareUrl: 'https://domain.com/s/{token}', token, accessType, expiresAt?, hasPassword }`.

### 8.2 Erişim Tipleri
- **view**: Sadece dosyayı görüntüleme/indirme. Klasör için içeriği listeleme ve indirme.
- **edit**: Dosya/klasör için düzenleme, yeniden adlandırma, silme, yeni dosya ekleme. Klasör edit ise tüm alt öğeler için de geçerlidir (recursive).

### 8.3 Güvenlik
- Şifre koruması: `passwordHash` (bcrypt) ile saklanır. Link'e erişimde şifre sorulur.
- Son kullanma tarihi: `expiresAt` sonrası link geçersiz, `410 Gone`.
- İptal: `DELETE /api/shares/{id}` → her an iptal edilebilir, `404 Not Found`.
- Rate limiting: paylaşımlı link indirmeleri IP bazlı 60/dk.

### 8.4 İndirme ve Erişim Takibi
- `downloadCount`: her indirmede artar.
- `lastAccessedAt`: her erişimde güncellenir.
- Dosya indirme: `GET /api/s/{token}` → redirect to pre-signed download URL (15 dakika geçerli).
- Klasör görüntüleme: `GET /api/s/{token}` → klasör içeriği sayfası (SSR).

### 8.5 Pre-signed İndirme URL'leri
- Tüm dosya indirmeleri pre-signed URL ile yapılır.
- Varsayılan geçerlilik: 15 dakika.
- Rate limiting: IP bazlı, 100/dk.
- Büyük dosyalar için `Content-Disposition: attachment`.

## 9. Güvenlik ve Erişim Kontrolü

### 9.1 Kimlik Doğrulama
- JWT tabanlı kimlik doğrulama.
- Public: paylaşımlı linkler (şifresiz veya şifre doğrulamalı).
- Auth: kendi dosya/klasörlerine erişim, yükleme, silme, paylaşma.

### 9.2 Rate Limiting
- Pre-signed URL talebi: 100/dk/kullanıcı.
- Dosya yükleme onayı: 50/dk/kullanıcı.
- Paylaşımlı link indirme: 60/dk/IP.
- Listeleme: 200/dk/kullanıcı.

### 9.3 Zararlı Dosya Taraması
- Yüklenen dosyalar opsiyonel olarak ClamAV ile taranabilir.
- Tespit edilen zararlı dosyalar `isQuarantined = true` olarak işaretlenir, indirilmesi engellenir.
- Kullanıcıya bildirim gönderilir.

## 10. Dosya Önizleme

### 10.1 Desteklenen Önizleme Formatları
- Görseller: JPG, PNG, GIF, WEBP, SVG → thumbnail üretimi (150px, 600px).
- Videolar: MP4, WEBM → thumbnail (ilk kare), HLS streaming için transcode (opsiyonel).
- Belgeler: PDF → ilk sayfa görsel önizleme. Office dokümanları → sadece ikon.
- Metin/Kod: TXT, JSON, XML, CSV, Markdown → içerik preview (max 100 KB).

### 10.2 Thumbnail Üretimi
- Görseller için otomatik thumbnail: yükleme sonrası async iş (Lambda/background worker).
- Thumbnail'ler ayrı S3 prefix'inde saklanır: `thumbnails/{storageKey}`.
- Erişim: pre-signed URL ile.

## 11. Etkinlik ve Denetim

### 11.1 Dosya Etkinlikleri
- `GET /api/activity?type=file|folder|share&limit=50`.
- Etkinlik tipleri: upload, download, move, rename, delete, restore, share_create, share_revoke, version_restore.

### 11.2 Audit Log
- Dosya/klasör oluşturma, silme, taşıma, yeniden adlandırma.
- Paylaşım bağlantısı oluşturma/iptal.
- Sürüm geri yükleme.
- Kota değişikliği (admin).
- Log'lar 90 gün saklanır.

## 12. Performans ve Optimizasyon

### 12.1 Veritabanı Optimizasyonu
- `path` materialized path ile alt klasör sorguları tek sorguda yapılır: `WHERE path LIKE '/parent-id/%'`.
- `folderId` indeksi ile klasör içeriği hızlı listelenir.
- `storageUsed` trigger ile otomatik güncellenir, her seferinde SUM hesaplanmaz.

### 12.2 Büyük Klasörler
- Maksimum alt öğe sayısı: klasör başına 10.000 dosya/klasör.
- 10.000+ öğe için pagination zorunludur.
- Özyinelemeli işlemler (move, delete) background job ile işlenir.
