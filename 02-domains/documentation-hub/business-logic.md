<!--
  Dokümantasyon Merkezi — İş Mantığı Kuralları
  Bu doküman, Kurumsal Dokümantasyon Merkezi platformunun tüm iş mantığı kurallarını,
  süreç akışlarını, validasyon kurallarını ve domain kısıtlamalarını tanımlar.
  Kapsam: Çoklu dil (i18n) yönetimi, semver sürümleme, RBAC erişim kontrolü,
  hiyerarşik navigasyon (sidebar ağaç yapısı), tam metin arama (Meilisearch/Elasticsearch),
  taslak/yayın yaşam döngüsü, 301/302 yönlendirme motoru, sayfa görüntüleme ve
  geri bildirim analitiği, SSG/ISR rendering ve Redis önbellek stratejisi.
  Tüm içerik Türkçedir.
-->
# Dokümantasyon Merkezi — İş Mantığı Kuralları

## 1. Domain Odağı ve Temel Kavramlar

Dokümantasyon Merkezi, kurumsal bilgi yönetimi için geliştirilmiş çoklu dil ve çoklu sürüm destekli bir dokümantasyon platformudur. Proje bazlı organizasyon, hiyerarşik kategori yapısı, tam metin arama ve analitik takibi ile teknik ekiplerin dokümantasyon ihtiyaçlarını karşılar.

**Temel varlıklar:**
- **Project**: Dökümantasyon projesi. Her projenin kendine ait sürümleri, kategorileri ve makaleleri vardır. `slug` bazlı URL yapısı.
- **Version**: Semver sürüm (v1, v2.3, latest). Her sürüm altında bağımsız kategori ve makale ağacı.
- **Category**: Hiyerarşik kategori. `parentId` ile ağaç yapısı. Her sürüm altında yerel (locale) bazlı.
- **Article**: Makale. Markdown/MDX içerik, çoklu dil desteği, taslak/yayın/arşiv durumları. SEO metadata içerir.
- **Redirect**: 301/302 yönlendirme kuralları. Eski URL'lerin kırılmasını önler.
- **Feedback**: Makale bazında faydalı/faydasız geri bildirimi. Kaynak takibi (bottom/search).

## 2. Proje, Sürüm ve Lokalizasyon Yönetimi

### 2.1 Proje Yapısı
- Her Project bağımsız bir dokümantasyon alanıdır: `domain.com/docs/{projectSlug}`.
- `isPublic = false` olan projeler sadece kimlik doğrulamalı kullanıcılar tarafından görülebilir.
- Project silindiğinde tüm alt sürümler, kategoriler, makaleler ve yönlendirmeler cascade silinir.

### 2.2 Sürümleme (Versioning)
- Semver formatı: `v1`, `v2`, `v2.3`, `latest` (latest her zaman en yüksek kararlı sürümü işaret eder).
- `?version=latest` → en güncel `isStable=true` sürümü getirir.
- `?version=v2.3` → belirli bir sürümü getirir.
- Yeni sürüm oluşturma: mevcut sürümdeki tüm makaleler ve kategoriler yeni sürüme kopyalanır (deep copy). Bu işlem async background job ile yapılır.
- `isDeprecated = true` olan sürümler, sayfanın üstünde "Bu sürüm artık desteklenmiyor" uyarısı gösterir.

### 2.3 Çoklu Dil (i18n)
- Desteklenen diller: `en`, `tr`, `de`, `fr`, `es` (proje bazında yapılandırılabilir).
- Her Article ve Category locale-aware'dir. `slug + version + locale` kombinasyonu unique olmalıdır.
- Fallback zinciri: İstenen locale → proje varsayılan locale'i → `en`.
- Eksik çeviri durumunda: "Bu sayfa henüz Türkçe'ye çevrilmedi. İngilizce görüntülüyorsunuz." uyarısı.

### 2.4 Dil Tespiti
- `Accept-Language` header'ına göre otomatik dil yönlendirmesi.
- `?locale=tr` query parametresi ile override edilebilir.
- Kullanıcı dil tercihi tarayıcı localStorage'da saklanır.

## 3. RBAC ve Erişim Kontrolü

### 3.1 Rol Hiyerarşisi
- **Admin**: Tüm projelerde tam yetki. Kullanıcı yönetimi, proje oluşturma/silme, audit log erişimi.
- **Editor**: Atandığı proje(ler)de makale ve kategori yönetimi. Yayınlama, arşivleme, sıralama.
- **Writer**: Atandığı proje(ler)de makale oluşturma ve taslak düzenleme. Yayınlama YAPAMAZ, Editor onayı gerekir.

### 3.2 Proje Bazlı Yetkilendirme
- `ProjectMember` tablosu: proje bazında kullanıcı yetkilendirmesi.
- Bir kullanıcı birden fazla projede farklı rollerde olabilir.
- Admin rolü tüm projelerde otomatik yetkilidir, `ProjectMember` kaydı gerekmez.

### 3.3 İçerik Erişim Kontrolü
- Public: yayınlanmış makaleler, navigasyon, arama.
- Auth (Editor/Writer rolü): taslak makaleleri preview.
- `isPublic = false` projeler: sadece kimlik doğrulamalı kullanıcılar.

## 4. Makale Yaşam Döngüsü

### 4.1 Durum Makinesi
- `draft` → `published` (Editor/Admin yayınlar)
- `draft` → `draft` (Writer düzenlemeye devam eder)
- `published` → `draft` (unpublish, yayından kaldır)
- `published` → `archived` (soft delete, arşivle)
- `archived` → `published` (restore, geri yükle)

### 4.2 Taslak (Draft) Yönetimi
- Writer makale oluşturduğunda `draft` durumunda oluşur.
- Taslaklar arama indeksine EKLENMEZ.
- Taslaklar navigasyon ağacında GÖRÜNMEZ.
- Preview endpoint'i (`GET /api/admin/articles/{id}`) taslak içeriği döndürür, auth zorunludur.
- Taslak preview sayfasına `X-Robots-Tag: noindex, nofollow` header'ı eklenir.

### 4.3 Yayınlama
- `PATCH /api/admin/articles/{id}/publish`: `status = published`, `publishedAt = NOW()`.
- Yayınlanan makale arama indeksine eklenir (async queue).
- SSG/ISR cache invalidation tetiklenir.

### 4.4 Arşivleme (Soft Delete)
- `DELETE /api/admin/articles/{id}/archive`: `isDeleted = true`, `deletedAt = NOW()`.
- Arşivlenen makale arama indeksinden kaldırılır.
- Arşivlenen makaleler navigasyonda görünmez.
- Kalıcı silme sadece Admin tarafından yapılabilir.

## 5. Kategori Hiyerarşisi ve Navigasyon

### 5.1 Ağaç Yapısı
- Adjacency list: `parentId` self-relation.
- Maksimum derinlik: 5 seviye.
- Döngüsel referans engeli: `parentId` atamadan önce döngü kontrolü yapılır.
- `orderIndex` ile sıralama.

### 5.2 Kategori Silme
- Kategori silindiğinde bağlı makaleler `?moveToCategoryId` ile başka bir kategoriye taşınır.
- `moveToCategoryId` belirtilmezse `400 Bad Request`.
- Alt kategoriler: parentCategory silindiğinde alt kategoriler bir üst seviyeye taşınır (`parentId = deleted.parentId`).

### 5.3 Navigasyon (Sidebar) Oluşturma
- `GET /api/docs/navigation` → `{ tree: [{ id, title, slug, children: [...] }] }`.
- Sadece `published` ve `isDeleted = false` makaleler görünür.
- Navigasyon ağacı Redis'te 1 saat TTL ile önbelleklenir.
- İçerik değişikliğinde (makale/category CRUD) önbellek invalidate edilir.

## 6. Tam Metin Arama (Search)

### 6.1 Arama Motoru
- Veritabanı `LIKE` sorguları KESİNLİKLE kullanılmaz.
- Meilisearch veya Elasticsearch entegrasyonu.
- PostgreSQL `tsvector` + `tsquery` alternatif olarak kullanılabilir.

### 6.2 İndeksleme
- Yayınlanan her makale otomatik indekslenir (async queue).
- İndekslenen alanlar: `title`, `contentPlain` (HTML/Markdown'dan extract edilmiş düz metin), `keywords`, `category.name`.
- Filtrelenebilir alanlar: `version`, `locale`, `categoryId`, `projectId`.
- Makale güncellendiğinde indeks yeniden oluşturulur.
- Makale arşivlendiğinde indeksten kaldırılır.

### 6.3 Arama API
- `GET /api/docs/search?q=...&version=...&locale=...&category=...`.
- Response: `{ results: [{ title, slug, excerpt, score, category }], total, took }`.
- Excerpt: arama terimi etrafında 150 karakterlik bağlam.
- `GET /api/docs/search/suggest?q=...&limit=5`: otomatik tamamlama, 100ms içinde yanıt (Redis önbellek).

### 6.4 Arama Analitiği
- Her arama `SearchLog` tablosuna kaydedilir.
- `resultsCount = 0` olan aramalar "içerik boşluğu" olarak işaretlenir.
- Admin panelinde popüler aramalar ve sonuçsuz aramalar raporlanır.

## 7. Yönlendirme (Redirect) Motoru

### 7.1 Yönlendirme Kuralları
- `301 Moved Permanently`: kalıcı taşıma (SEO ağırlığı aktarılır).
- `302 Found`: geçici taşıma.
- `fromPath`: glob pattern desteklemez, tam eşleşme. `/docs/v1/old-page`.
- `toPath`: hedef URL, proje içi olmak zorundadır.

### 7.2 Yönlendirme Önceliği
- Yönlendirme kuralları SSR/CDN katmanında (middleware) uygulanır.
- Birden fazla eşleşme: en spesifik (en uzun `fromPath`) kazanır.
- 10'dan fazla zincirleme yönlendirme → `508 Loop Detected`.

## 8. Sayfa Görüntüleme ve Analitik

### 8.1 Sayfa Görüntüleme Takibi
- `POST /api/docs/page-view`: anonim takip. Rate limit: IP başına 60/dk.
- Body: `{ articleId, version, locale, referrer? }`.
- Async işlenir (kuyruk), API yanıtını beklemez.
- `Article.viewCount` her 5 dakikada bir batch update ile güncellenir.

### 8.2 Popüler Makaleler
- `GET /api/docs/popular?period=7d|30d|all&limit=10`.
- Redis sorted set ile tutulur: `pageviews:{period}`.
- Periyodik olarak (saat başı) PageView tablosundan hesaplanır.

## 9. Geri Bildirim (Feedback)

### 9.1 Fayda Geri Bildirimi
- `POST /api/docs/feedback`: `{ articleId, version, helpful: boolean, comment?, source: 'bottom'|'search' }`.
- Rate limit: IP başına günde 1 geri bildirim (aynı makale için).
- `source` alanı: feedback'in nereden verildiği (sayfa altı widget veya arama sonuçları).

### 9.2 Geri Bildirim Analitiği
- Admin paneli: `GET /api/admin/feedback?from=...&to=...&version=...`.
- Response: `{ helpful: N, notHelpful: N, rate: 0.XX, byArticle: [{ articleId, title, helpful, notHelpful }] }`.
- `helpfulRate < 0.5` (50%) olan makaleler admin panelinde işaretlenir.

## 10. Medya Yönetimi

### 10.1 Medya Yükleme
- `POST /api/admin/upload`: multipart `{ file, altText? }`.
- Desteklenen formatlar: PNG, JPG, GIF, WEBP, SVG (sanitize), PDF.
- Maksimum dosya boyutu: 10 MB.
- Otomatik optimize: görseller WebP dönüşümü, responsive boyutlar (320w, 768w, 1200w).

### 10.2 Medya Erişimi
- CDN üzerinden sunulur.
- Public medya endpoint'i cache-control: `public, max-age=31536000, immutable`.

## 11. SSG/ISR ve Önbellek Stratejisi

### 11.1 Rendering Stratejisi
- Dokümantasyon siteleri okuma ağırlıklıdır. SSG (Static Site Generation) veya ISR (Incremental Static Regeneration) ile sunulur.
- CSR (Client-Side Rendering) KULLANILMAZ (SEO için).
- Build zamanı: yeni makale yayınlandığında veya güncellendiğinde webhook ile tetiklenir.

### 11.2 Önbellek Stratejisi
- **Navigasyon ağacı**: Redis, 1 saat TTL. İçerik değişikliğinde invalidate.
- **Popüler makaleler**: Redis sorted set, saat başı güncelleme.
- **Arama önerileri**: Redis, 30 dakika TTL.
- **Makale içeriği**: CDN edge cache (Cloudflare/AWS CloudFront), `stale-while-revalidate`.

## 12. Güvenlik ve Performans

### 12.1 Rate Limiting
- Public okuma: 1000/dk/IP.
- Arama: 100/dk/IP.
- Kimlik doğrulamalı: 100/dk/kullanıcı.
- Admin: 50/dk/kullanıcı.
- Geri bildirim: günde 1/makale/IP.

### 12.2 SEO ve Robots
- Yayınlanmış sayfalar: `index, follow`.
- Taslak sayfalar: `noindex, nofollow`.
- Arşivlenmiş sayfalar: `noindex, nofollow` → `410 Gone` (30 gün sonra).
- Otomatik sitemap.xml: tüm yayınlanmış makaleler + kategoriler.

### 12.3 Audit Log
- Makale oluşturma, güncelleme, yayınlama, arşivleme.
- Kategori ve sürüm yönetimi.
- Kullanıcı rol değişiklikleri.
- Log'lar 90 gün saklanır.
