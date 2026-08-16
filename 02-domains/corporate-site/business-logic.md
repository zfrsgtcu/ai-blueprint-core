<!--
  [TR] BU DOSYANIN AMACI:
  Kurumsal web sitesi (Corporate Website) sisteminin iş mantığı kurallarını, sayfa yönetimi,
  çoklu dil desteği, SEO optimizasyonu, çalışan dizini, hizmet vitrini, kariyer başvuruları
  ve iletişim yönetimi gibi temel iş süreçlerini AI'a eksiksiz öğretir.
  Blok tabanlı sayfa oluşturucu, çok seviyeli navigasyon, takım yönetimi ve lead yakalama
  kurallarını kapsar.
-->

# CORPORATE WEBSITE BUSINESS LOGIC & REQUIREMENTS

## 1. CORE DOMAIN FOCUS
Bu proje, çok sayfalı, çok dilli, SEO-optimize bir kurumsal web sitesi platformudur. Temel öncelikler: esnek sayfa yönetimi (block-based CMS), marka bütünlüğü, yerelleştirme (i18n), lead yakalama (formlar/CTA), kariyer başvuruları ve Core Web Vitals hedefli performans optimizasyonudur.

## 2. PAGE & CONTENT MANAGEMENT (CMS)
- **Block-Based Editor:** Her sayfa, sıralanabilir içerik bloklarından (`PageBlock`) oluşur. Blok tipleri: `hero`, `text`, `image`, `video`, `slider`, `cards`, `cta`, `form`, `testimonials`, `team_members`, `stats_counter`, `faq_accordion`, `embed_code`, `custom_html`.
- **Sayfa Türleri:** `page` (standart), `landing` (pazarlama), `legal` (KVKK/gizlilik), `system` (404, bakım modu). Her tür için farklı davranış kuralları uygulanır.
- **Yayınlama Akışı:** `draft` → `review` → `published`. Değişiklikler için `revision` sistemi — her kaydetmede otomatik versiyon oluşturulur, önceki versiyona geri dönülebilir.
- **Zamanlanmış Yayın:** Sayfalar `scheduledAt` ile ileri tarihli yayınlanabilir. Zamanı gelen sayfalar cron job ile otomatik `published` durumuna geçer.
- **Soft-Delete:** Silinen sayfalar `deletedAt` ile işaretlenir, 30 gün sonra kalıcı olarak silinir. Admin panelinden geri yüklenebilir.
- **Slug Çakışması:** Aynı locale içinde slug benzersiz olmalıdır. Çakışma durumunda otomatik `-2`, `-3` soneki eklenir.

## 3. NAVIGATION & SITE STRUCTURE
- **Çok Seviyeli Menü:** `Menu` → `MenuItem` hiyerarşisi. Maksimum 3 seviye derinlik (mobil uyumluluk için).
- **Menü Konumları:** `header_main`, `header_top`, `footer_primary`, `footer_secondary`, `sidebar`, `mobile`. Her konuma bağımsız menü atanabilir.
- **Menü Tipleri:** `page` (dahili sayfa), `url` (özel link), `anchor` (sayfa içi), `category` (blog/haber arşivi), `dropdown` (açılır menü başlığı).
- **Otomatik Güncelleme:** Sayfa slug'ı değiştiğinde veya sayfa silindiğinde, ilgili menü öğeleri otomatik güncellenmeli/kaldırılmalıdır. Kırık linkler admin panelinde uyarı olarak gösterilir.
- **Breadcrumb:** Her sayfa için otomatik breadcrumb zinciri oluşturulur. Parent sayfa ilişkisi üzerinden yürünür.

## 4. TEAM & EMPLOYEE DIRECTORY
- **Departman Yapısı:** `Department` → `Employee` ilişkisi. Çalışanlar birden fazla departmanda gösterilebilir.
- **Çalışan Profili:** Ad, soyad, unvan, biyografi, profil fotoğrafı, sosyal medya linkleri (LinkedIn, Twitter/X), e-posta (opsiyonel gösterim), telefon (opsiyonel).
- **Sıralama:** Departman içinde ve global listede `sortOrder` ile manuel sıralama. Varsayılan: `sortOrder ASC, lastName ASC`.
- **Yönetim Kurulu:** `isManagement` flag'i ile yönetim kadrosu ayrı bir blokta gösterilebilir.
- **Eski Çalışanlar:** `isActive` false olan çalışanlar frontend'de gösterilmez, ancak admin panelinde kalır.

## 5. SERVICES & SOLUTIONS SHOWCASE
- **Hizmet Kategorileri:** `ServiceCategory` altında gruplanmış `Service` kayıtları.
- **Hizmet Detayı:** Başlık, açıklama, ikon, görsel, detay sayfası (opsiyonel), CTA butonu (metin + link).
- **Vaka Çalışmaları (Case Studies):** Her hizmete bağlı vaka çalışmaları. `challenge` → `solution` → `results` yapısı. Sonuçlar sayısal metriklerle desteklenir (`metrics: [{ label, value }]` JSON).
- **Müşteri Referansları (Testimonials):** Müşteri adı, şirket, unvan, fotoğraf, referans metni, puan (1-5), `isFeatured` flag'i. Anasayfada sadece featured olanlar gösterilir.

## 6. NEWS, BLOG & INSIGHTS
- **Makale Yapısı:** Başlık, özet (excerpt), gövde (block-based veya markdown), kapak görseli, yazar ilişkisi (Employee tablosundan), kategoriler, etiketler.
- **Kategoriler ve Etiketler:** `ArticleCategory` ve `ArticleTag` çoka-çok ilişki (`ArticleCategoryRelation`, `ArticleTagRelation` junction tabloları).
- **SEO Metadata:** Her makale için özel `metaTitle`, `metaDescription`, `ogImage`, `canonicalUrl`. Boş bırakılırsa otomatik türetilir.
- **Öne Çıkanlar:** `isFeatured` + `featuredUntil` ile zaman sınırlı öne çıkarma.
- **Sosyal Paylaşım:** Her makale sayfası Open Graph meta etiketleri ve Twitter Card desteği içermelidir.

## 7. CONTACT & LEAD GENERATION
- **İletişim Formu:** `ContactSubmission` modeli. Alanlar: ad, soyad, e-posta, telefon, şirket, konu (dropdown), mesaj, KVKK onayı.
- **Spam Koruması:** Honeypot alanı, Google reCAPTCHA v3, rate limiting (aynı IP'den 5 dakikada maksimum 3 gönderim).
- **Lead Puanlama:** `leadScore` otomatik hesaplanır: şirket alanı dolu (+10), telefon dolu (+5), mesaj uzunluğu >100 karakter (+3).
- **CRM Entegrasyonu:** Başarılı gönderimler opsiyonel olarak webhook ile CRM'e iletilir (yapılandırılabilir endpoint).
- **Otomatik Yanıt:** Her gönderim sonrası teşekkür e-postası gönderilir. Admin(ler)e bildirim e-postası gider.

## 8. CAREER & RECRUITMENT
- **İş İlanı Yönetimi:** `JobPosting` modeli. Alanlar: başlık, departman, lokasyon, çalışma türü (remote/hybrid/onsite), istihdam türü (full-time/part-time/contract/intern), açıklama (block-based), gereksinimler, yan haklar.
- **İlan Yaşam Döngüsü:** `draft` → `published` → `closed`. `closed` ilanlar arşivde kalır. `expiresAt` geçen ilanlar otomatik `closed` olur.
- **Başvuru Formu:** `JobApplication` modeli. Ad, soyad, e-posta, telefon, ön yazı (cover letter), CV yükleme (PDF/DOCX, maksimum 10MB), portföy linki, LinkedIn profili.
- **Başvuru Durumu:** `new` → `reviewed` → `contacted` → `interview` → `offered` → `hired` / `rejected`. ATS (Applicant Tracking) pipeline'ı.
- **KVKK & Saklama:** Başvuru sahiplerine KVKK metni gösterilir, onay zorunludur. Reddedilen başvurular 6 ay sonra anonimleştirilir.

## 9. MULTI-LANGUAGE & LOCALIZATION (i18n)
- **Dil Yapısı:** Desteklenen diller `SiteLanguage` modelinde tanımlanır. `locale` kodu (tr-TR, en-US, de-DE), `isDefault` flag'i.
- **Çeviri Stratejisi:** Her çevrilebilir entity (sayfa, hizmet, makale, iş ilanı) `translationGroupId` ile gruplanır. Aynı grubun farklı locale'deki kayıtları birbirine bağlıdır.
- **Statik Metinler:** Menü adları, site ayarları gibi statik metinler ayrı bir `Translation` modelinde `key`-`locale`-`value` olarak saklanır.
- **Dil Seçimi:** URL yapısı: `/tr/hakkimizda`, `/en/about-us`. Varsayılan dilde URL'de dil prefix'i olmaz: `/hakkimizda`. Alternatif: subdomain (`tr.site.com`).
- **hreflang:** Her sayfanın alternatif dil versiyonları `<link rel="alternate" hreflang="...">` ile belirtilir. SEO için zorunludur.
- **Eksik Çeviri:** Bir sayfa henüz çevrilmemişse, varsayılan dilde gösterilir ve admin panelinde "çeviri bekliyor" uyarısı çıkar.

## 10. SEO & PERFORMANCE
- **Genel SEO Ayarları:** `SiteSetting` üzerinden global `metaTitle`, `metaDescription`, `ogImage`, Google Search Console doğrulama kodu, Analytics tracking ID.
- **Sayfa Bazlı SEO:** Her sayfa için özel `metaTitle`, `metaDescription`, `ogImage`. `<title>` formatı: `{page.metaTitle} | {site.name}`.
- **Otomatik Sitemap:** `GET /sitemap.xml` endpoint'i, tüm published sayfaları, makaleleri, hizmetleri otomatik listeler. Haftada bir rejenere edilir.
- **robots.txt:** Admin panelinden düzenlenebilir. Varsayılan: staging ortamında `Disallow: /`.
- **SSG/ISR:** Sayfalar statik olarak oluşturulur (Static Site Generation). Blog/haber sayfaları ISR (Incremental Static Regeneration) ile 5 dakika revalidation süresiyle sunulur.
- **Core Web Vitals:** LCP < 2.5s, FID < 100ms, CLS < 0.1 hedeflenir. Tüm görseller WebP/AVIF formatında, lazy loading ile sunulur.
- **Canonical URL:** Her sayfa için otomatik canonical URL oluşturulur, admin panelinden override edilebilir.
- **Redirect Yönetimi:** `Redirect` modeli ile 301/302 yönlendirmeleri. Eski slug değiştiğinde otomatik 301 oluşturulur.

## 11. BRANDING & THEME MANAGEMENT
- **Tema Ayarları:** `SiteSetting` üzerinden: logo (light/dark), favicon, primary/secondary renkler, font ailesi (Google Fonts veya özel), tipografi ölçekleri.
- **Sosyal Medya:** Şirket sosyal medya hesapları (LinkedIn, Twitter/X, Instagram, YouTube, GitHub) footer ve header'da gösterilmek üzere site ayarlarında tanımlanır.
- **Footer Yapılandırması:** Footer kolonları, alt metin (copyright), KVKK/gizlilik/kullanım koşulları linkleri.
- **Cookie Consent:** GDPR/KVKK uyumlu çerez banner'ı. Zorunlu/analitik/pazarlama çerez kategorileri, detaylı tercih paneli.
- **Favicon & PWA:** Favicon seti (16x16, 32x32, 180x180), Web App Manifest, maskable icon desteği.

## 12. ADMIN & SYSTEM CONFIGURATION
- **Kullanıcı Rolleri:**
  - `super_admin`: Her şeye erişim, site ayarları, kullanıcı yönetimi.
  - `admin`: Sayfalar, hizmetler, makaleler, medya yönetimi.
  - `editor`: Sayfa ve makale düzenleme, yayınlama.
  - `author`: Sadece makale yazma, yayınlama izni yok (review'e gönderir).
  - `translator`: Sadece çeviri yapma, orijinal içerik oluşturamaz.
  - `viewer`: Salt okunur erişim (raporlama ve denetim için).
- **Medya Kütüphanesi:** `Media` modeli. Görsel, video, doküman yükleme. Otomatik thumbnail oluşturma, WebP dönüşümü. Klasör yapısı (`MediaFolder`) ile organizasyon.
- **Denetim Günlüğü:** `AuditLog` modeli. Kim, hangi entity, hangi aksiyon (create/update/delete/publish), ne zaman, eski/yeni değerler. GDPR uyumluluğu için zorunludur.
- **Backup & Export:** Site ayarları, sayfalar ve medya için manuel/otomatik yedekleme. Tüm veriler JSON/CSV olarak dışa aktarılabilir.
- **Bakım Modu:** Site `MAINTENANCE_MODE=true` iken tüm public endpoint'ler özel bakım sayfasına yönlendirilir. Whitelist IP'ler erişebilir.
- **Form Ayarları:** Hedef e-posta adresi, webhook URL'si, spam threshold ayarları admin panelinden yönetilir.
- **E-posta Şablonları:** Teşekkür e-postası, başvuru onayı, admin bildirimi gibi e-posta şablonları düzenlenebilir. Değişken desteği: `{{name}}`, `{{position}}`, `{{date}}`.
