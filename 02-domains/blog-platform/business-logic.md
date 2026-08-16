<!--
  Blog Platformu — İş Mantığı Kuralları
  Bu doküman, Blog Platformunun tüm iş mantığı kurallarını, süreç akışlarını,
  validasyon kurallarını ve domain kısıtlamalarını tanımlar.
  Kapsam: İçerik yönetimi (CMS), SEO ve metadata, yorum moderasyonu,
  taksonomi yönetimi (kategori hiyerarşisi, etiketleme), SSG/ISR okuma performansı,
  arama (full-text search) ve rol tabanlı erişim kontrolü (RBAC).
  Tüm içerik Türkçedir.
-->
# Blog Platformu — İş Mantığı Kuralları

## 1. Domain Odağı ve Temel Kavramlar

Blog Platformu, içerik odaklı bir yayıncılık sistemidir. Yüksek performanslı okuma deneyimi, katı SEO uyumluluğu, güçlü yazarlık araçları ve esnek taksonomi yönetimi sağlar.

**Temel varlıklar:**
- **Post**: Yazı/İçerik. Durum yaşam döngüsüne sahiptir (taslak, yayınlanmış, zamanlanmış, arşivlenmiş). SEO metadata, okuma süresi ve görüntülenme sayısı içerir.
- **Category**: Hiyerarşik kategori ağacı. Maksimum 5 seviye derinlik. Her kategorinin post sayısı denormalize tutulur.
- **Tag**: Etiket. Normalize edilmiş, benzersiz slug. Post sayısı denormalize tutulur. Maksimum 50 karakter.
- **Comment**: Yorum. Moderasyon akışı: pending → approved | spam | rejected. Kayıtlı kullanıcı veya anonim yorum.
- **SeoMetadata**: Her post için özel SEO ayarları. OG/Twitter sosyal medya tag'leri, canonical URL, noIndex.

## 2. İçerik Oluşturma ve Yayınlama

### 2.1 Editör Veri Yapısı
- İçerik blok-tabanlı yapıda saklanır (Editor.js, ProseMirror, Slate.js). `content` alanı JSONB olarak tutulur.
- Basit WYSIWYG kullanımında salt HTML string kabul edilir, ancak XSS sanitizasyonu zorunludur.
- Görsel yükleme: editör içinde sürükle-bırak ile görsel eklenebilir. Görseller CDN'e yüklenir, URL content içine gömülür.

### 2.2 Post Yaşam Döngüsü
- Durum makinesi: `draft` → `published` | `scheduled` | `archived`.
- `draft`: Sadece yazar ve admin görebilir.
- `scheduled`: `publishedAt` zamanı geldiğinde cron job ile otomatik `published` durumuna geçer.
- `published`: Herkese açık. `publishedAt` alanı null ise geçiş anında `NOW()` atanır.
- `archived`: URL'ler korunur ancak liste görünümlerinden kaldırılır.

### 2.3 Slug ve Kalıcı Bağlantılar (Permalink)
- Post URL'leri SEO dostu olmalıdır: küçük harf, tireli (kebab-case), özel karakterler temizlenmiş.
- Slug başlıktan otomatik üretilir. Türkçe karakterler ASCII'ye dönüştürülür (ş→s, ğ→g, ç→c, ö→o, ü→u, ı→i).
- Slug benzersiz olmalıdır. Çakışma durumunda sona sayaç eklenir: `baslik-yazisi`, `baslik-yazisi-2`.
- Post silinirse slug başka bir post tarafından kullanılabilir (30 gün bekleme süresi sonrası).

### 2.4 Özet (Excerpt) ve Sosyal Medya
- `excerpt` manuel girilmezse içeriğin ilk 300 karakterinden otomatik oluşturulur.
- HTML tag'leri temizlenir, düz metin olarak saklanır.
- Sosyal medya paylaşım kartları OG/Twitter meta tag'leri üzerinden render edilir.

## 3. SEO ve Metadata (KRİTİK)

### 3.1 Meta Tag Yönetimi
- Her post için ayrı SEO kaydı (`SeoMetadata`): `metaTitle`, `metaDescription`, `canonicalUrl`, `ogTitle`, `ogDescription`, `ogImageUrl`, `noIndex`.
- `metaTitle` boşsa post başlığı kullanılır. `metaDescription` boşsa excerpt kullanılır.
- `canonicalUrl` boşsa post'un kendi URL'i kullanılır. Farklı domain'de yayınlanan içerikler için manuel girilebilir.
- `noIndex=true` olduğunda `<meta name="robots" content="noindex, nofollow">` render edilir.

### 3.2 SSG/ISR Render Stratejisi
- İçerik sayfaları Statik Site Üretimi (SSG) ile render edilmelidir.
- Değişiklik anında artımlı statik yeniden üretim (ISR) tetiklenir: post güncellendiğinde veya yeni yorum onaylandığında.
- Client-side rendering (CSR) sadece dashboard/admin panel için kullanılabilir. İçerik sayfalarında CSR KESİNLİKLE YASAKTIR.
- Revalidation interval: 60 saniye (yapılandırılabilir).

### 3.3 Sitemap ve RSS
- `/sitemap.xml`: Tüm yayınlanmış post'ları dinamik olarak listeler. `lastmod`, `changefreq`, `priority` alanları doldurulur.
- `/rss.xml`: En son 50 post'un RSS feed'i. Başlık, excerpt, yazar, tarih bilgilerini içerir.
- Her iki endpoint de kimlik doğrulaması gerektirmez (public).
- Sitemap 50.000 URL üzerinde ise sitemap index dosyası kullanılır (`/sitemap-index.xml`).

### 3.4 Breadcrumbs ve Yapısal Veri
- Breadcrumbs: Ana Sayfa > Birincil Kategori > Alt Kategori > Post Başlığı.
- JSON-LD yapısal verisi: `Article`, `BreadcrumbList`, `Organization` şemaları otomatik render edilir.
- Birincil kategori: post'un atandığı ilk kategori, breadcrumbs ve canonical URL için kullanılır.

## 4. Arama ve Keşif

### 4.1 Tam Metin Arama
- PostgreSQL `tsvector` veya Meilisearch/Algolia ile tam metin araması.
- Aranan alanlar: `title`, `content` (plain text extract), `excerpt`, `tag.name`, `category.name`.
- PostgreSQL tsvector için GIN indeks kullanılır.
- Arama sonuçları alaka düzeyine göre sıralanır. `ts_rank` + `viewCount` çarpanı ile hibrit sıralama.
- Minimum arama uzunluğu: 3 karakter.

### 4.2 Öne Çıkarılan Post'lar
- `isFeatured=true` olan post'lar listelemelerde en üstte gösterilir.
- Maksimum 5 adet featured post. 6. featured yapılmak istendiğinde en eski featured post'un işareti kaldırılır.
- Featured post'lar için özel bir section veya carousel render edilebilir.

### 4.3 Filtreleme ve Sıralama
- Kategoriye, etikete, yazara, tarih aralığına göre filtreleme.
- Sıralama seçenekleri: `newest` (varsayılan), `oldest`, `popular` (görüntülenme), `reading_time` (okuma süresi).
- Pagination: sayfa başına 12 post, maksimum 50.

## 5. Yorum Sistemi ve Moderasyon

### 5.1 Moderasyon Akışı
- Tüm yorumlar varsayılan olarak `pending` durumunda oluşturulur.
- Admin veya post yazarı yorumu `approved` veya `rejected` yapana kadar frontend'de görünmez.
- `approved` yorumlar post sayfasında gösterilir ve post'un `commentCount` değeri artırılır.
- `rejected` yorumlar silinmez, admin panelinde listelenir.
- `spam` olarak işaretlenen yorumlar 30 gün sonra cron job ile otomatik silinir.

### 5.2 Spam Önleme
- reCAPTCHA v3 veya hCaptcha entegrasyonu. Skor < 0.5 ise yorum `pending` yerine `spam` olarak işaretlenir.
- Akismet veya benzeri spam tespit servisi entegrasyonu (opsiyonel).
- IP bazlı rate limiting: aynı IP'den 30 saniyede 1 yorum.
- Aynı içerikli yorumlar (karakter bazında %90 benzerlik) 5 dakika içinde duplicate sayılır ve reddedilir.

### 5.3 Kayıtlı Kullanıcı vs Anonim
- Kayıtlı kullanıcılar `authorId` ile yorum yapar, profil bilgileri yorumda gösterilir.
- Anonim kullanıcılar `authorName` ve `email` zorunludur. `ipAddress` kaydedilir.
- Anonim kullanıcı email'i sadece moderasyon ve yanıt bildirimi için kullanılır, frontend'de gösterilmez.

## 6. Kullanıcı Rolleri ve Yetkilendirme

### 6.1 Rol Hiyerarşisi
- **Admin**: Tam yetki. Tüm post'ları, kategorileri, etiketleri, kullanıcıları ve ayarları yönetir. Tüm yorumları moderasyonlayabilir.
- **Author**: Kendi post'larını oluşturma, düzenleme, yayınlama. Kendi post'larındaki yorumları moderasyonlama. Kategori ve etiket yönetimi yapamaz.
- **Subscriber**: Salt okuma. Yorum yapabilir (moderasyon onayı ile). Profil yönetimi.
- **Unregistered (Guest)**: Salt okuma. Anonim yorum yapabilir.

### 6.2 Author Kapasite Sınırları
- Author başına maksimum 100 post (spam/blog çiftliği önlemi). Admin sınırsız.
- Author günlük maksimum 20 post oluşturabilir.
- Author sadece kendi post'larını silemez, admin'e silme talebi gönderir (soft limit).

## 7. Taksonomi ve İlişki Kuralları

### 7.1 Kategori Hiyerarşisi
- Maksimum derinlik: 5 seviye. API `parentId` atamadan önce derinlik validasyonu yapar.
- Döngüsel referans engeli: bir kategorinin `parentId`'si kendi alt kategorilerinden biri olamaz.
- Slug normalizasyonu: küçük harf, tireli, benzersiz. Türkçe karakterler ASCII'ye dönüştürülür.
- Kategori silindiğinde alt kategorilerin `parentId`'si silinen kategorinin `parentId`'sine taşınır (köke taşınmaz).
- Kategori silindiğinde ilişkili post'lar silinmez, many-to-many ilişki kaldırılır.

### 7.2 Etiket Kısıtlamaları
- Maksimum etiket uzunluğu: 50 karakter. Aşımda `400 Bad Request`.
- Agresif normalizasyon: trim, küçük harf, özel karakter temizleme, ardışık boşlukları tek boşluğa indirgeme.
- "AI", "aI", "ai " → hepsi "ai" olarak normalize edilir.
- `postCount=0` olan etiketler haftalık cron job ile temizlenir veya admin panelinde "öksüz etiketler" raporunda listelenir.

### 7.3 Post-Taksonomi İlişkileri
- Bir post maksimum 10 etikete sahip olabilir (keyword stuffing önlemi).
- Bir post birden fazla kategoriye atanabilir.
- İlk atanan kategori "Birincil Kategori" olarak kabul edilir, breadcrumbs ve canonical URL için kullanılır.
- Post silindiğinde many-to-many ilişkiler cascade silinir, kategori ve etiketler silinmez.

## 8. Medya Yönetimi

### 8.1 Görsel Yükleme
- Desteklenen formatlar: JPG, PNG, GIF, WEBP, SVG (sanitize edilmiş).
- Maksimum dosya boyutu: 5 MB (yapılandırılabilir, max 20 MB).
- Otomatik resize: `large` (1200px), `medium` (600px), `thumbnail` (150px) + orijinal.
- WebP formatına otomatik dönüşüm (opsiyonel, browser desteğine göre).
- CDN üzerinden sunum, cache-control: public, max-age=31536000, immutable.

### 8.2 Medya Kütüphanesi
- Kullanıcı bazında medya kütüphanesi: yüklenen tüm görseller listelenir.
- Kullanılmayan görseller 90 gün sonra otomatik silinir (opsiyonel).
- EXIF veri temizleme: GPS, kamera bilgisi gibi hassas metadata'lar sıyrılır.

## 9. Bülten ve Abonelik

### 9.1 E-posta Aboneliği
- Kullanıcılar yeni post'lar için e-posta aboneliği başlatabilir.
- Double opt-in: abonelik onay e-postası, 24 saat içinde onaylanmazsa iptal.
- Abonelik tercihleri: tüm post'lar, sadece haftalık özet, sadece belirli kategoriler.
- Tek tıkla abonelikten çıkma (unsubscribe link, JWT token içerir).

### 9.2 Bülten Gönderimi
- Toplu e-posta gönderimi: background job ile işlenir, batch başına 50 alıcı.
- Gönderim limiti: saatte maksimum 500 e-posta (ESP rate limit uyumu).
- Açılma ve tıklama takibi (opsiyonel, GDPR onayı ile).

## 10. Önbellekleme ve Performans

### 10.1 Cache Stratejisi
- Statik sayfalar: CDN edge cache, 1 saat TTL.
- Post detay sayfası: SSR cache, ISR ile invalidasyon. Değişiklik anında revalidate.
- Liste sayfaları: 5 dakika TTL, yeni post yayınlandığında invalidasyon.
- API yanıtları: `Cache-Control` header'ları ile client-side cache.

### 10.2 Performans Hedefleri
- Post detay sayfası FCP (First Contentful Paint): <1.5 saniye.
- TTFB (Time to First Byte): <200ms.
- Lighthouse skoru: >90 (performans, SEO, erişilebilirlik).

## 11. Güvenlik

### 11.1 XSS ve İçerik Güvenliği
- Tüm kullanıcı girdileri HTML entity encode edilir.
- Content-Security-Policy header'ı: script-src sadece güvenli kaynaklar.
- SVG upload'ları SVG sanitizer'dan geçirilir (potansiyel XSS vektörü).
- HTML içerik DOMPurify veya benzeri ile sanitize edilir.

### 11.2 Rate Limiting
- Post listeleme: 300/dk (public).
- Post detay: 300/dk (public).
- Yorum gönderme: 2/dk/IP.
- Admin API: 50/dk/kullanıcı.

### 11.3 Admin Paneli Güvenliği
- Admin paneli `/admin` rotasında, IP whitelist desteği.
- Hassas işlemler (kullanıcı silme, rol değiştirme) ek şifre doğrulaması gerektirir.
- Brute force koruması: 5 başarısız giriş → 15 dakika hesap kilidi.

## 12. Denetim ve Loglama

### 12.1 Audit Log Kapsamı
- Post oluşturma/güncelleme/silme/durum değişikliği.
- Yorum moderasyonu (onaylama/reddetme).
- Kategori ve etiket yönetimi.
- Kullanıcı rol değişikliği.
- Hassas ayar değişiklikleri.

### 12.2 Log Saklama
- Audit log'lar 90 gün saklanır.
- Hassas veri loglanmaz (şifre, token).
- Admin panelinde filtrelenebilir: kullanıcı, işlem tipi, tarih aralığı, entity.
