<!--
  [TR] BU DOSYANIN AMACI:
  Kurumsal e-ticaret platformunun iş mantığı kurallarını AI'a eksiksiz öğretir.
  Ürün ve varyant yönetimi, kategori ağacı, sepet ve ödeme akışı, stok yönetimi,
  kupon/indirim motoru, kargo ve teslimat, iade/iade süreci, ödeme entegrasyonu,
  müşteri yönetimi, yorum/değerlendirme, istek listesi, admin paneli ve güvenlik
  kurallarını kapsar.
-->

# E-COMMERCE BUSINESS LOGIC & REQUIREMENTS

## 1. CORE DOMAIN FOCUS
Kurumsal seviye e-ticaret motoru. Ana odak: atomik işlem bütünlüğü, stok yönetimi, karmaşık vergi ve kargo hesaplaması, güvenli ödeme işlemleri ve değişmez sipariş anlık görüntüleri (snapshot). Tüm finansal veriler `Decimal(19,4)` hassasiyetiyle saklanır.

## 2. PRODUCT & VARIANT MANAGEMENT
- **Ürün Durumları:** `draft`, `published`, `archived`, `discontinued`. `draft` ürünler sadece admin tarafından görülür. `published` ürünler katalogda listelenir.
- **Ürün Varyantları (ProductVariant):** Her ürün en az 1 varyanta sahiptir. Varyantlar ürünün satın alınabilir birimleridir: SKU, fiyat, stok, nitelik kombinasyonu (örn: Renk:Kırmızı, Beden:XL). Varyant olmayan ürünler için otomatik "Default" varyant oluşturulur.
- **Nitelik (Attribute) Sistemi:** Ürün özellikleri `ProductAttribute` modeli ile esnek yapıdadır. `attributes: [{ name: "Renk", value: "Kırmızı" }, { name: "Malzeme", value: "Pamuk" }]` JSONB formatında saklanır.
- **Fiyat Stratejisi:** `listPrice` (liste/etiket fiyatı) ve `price` (geçerli satış fiyatı) ayrı tutulur. `compareAtPrice` ile indirim algısı yaratılır. İndirim oranı: `(1 - price / listPrice) * 100` olarak hesaplanır.
- **Marka (Brand):** Her ürün bir markaya bağlanabilir. Marka modeli: ad, logo, açıklama, website. Marka filtresi ve marka sayfası (SEO) desteği.
- **Dijital Ürünler:** `isDigital = true` olan ürünler için `digitalFileUrl` alanı kullanılır. Fiziksel kargo uygulanmaz, ödeme onayı sonrası dosya erişimi verilir (max 5 indirme, 30 gün geçerlilik).
- **SEO:** Her ürün için: `metaTitle`, `metaDescription`, `ogImage`. Otomatik slug oluşturma: `name` alanından URL-safe slug türetilir. `slug` unique'dir.
- **Ürün Galerisi:** `ProductImage` ile çoklu görsel. `isPrimary = true` olan görsel ürün kartında gösterilir. `orderIndex` ile sıralama. `altText` zorunlu (accessibility).

## 3. CATEGORY & NAVIGATION
- **Kategori Ağacı:** Kategoriler recursive parent-child ilişkisiyle ağaç yapısı oluşturur. `parentId: null` → kök kategori. Derinlik sınırı: maksimum 4 seviye.
- **Kategori Slug Zinciri:** `/kadin/giyim/elbise` gibi zincir slug'lar. Her kategori için `ancestorSlugs` veya `materializedPath` ile performanslı ağaç navigasyonu.
- **Filtreleme (Faceted Search):** Kategori bazında ürün filtreleri: fiyat aralığı, marka, renk, beden, puan. Filtre değerleri mevcut ürünlerden dinamik olarak toplanır.

## 4. CART & CHECKOUT
- **Sepet (Cart):** Kullanıcı bazlı veya misafir (guest) bazlı sepet. Guest sepet `sessionId` ile tutulur, login sonrası kullanıcı sepetine merge edilir. Merge stratejisi: çakışan varyantlarda quantity toplanır.
- **Sepet Fiyat Güncellemesi:** Sayfa her yüklendiğinde veya sepette değişiklik olduğunda canlı fiyat yeniden hesaplanır. Güncel ürün fiyatı, stok durumu, geçerli kampanyalar kontrol edilir.
- **Stok Rezervasyonu:** Sepete ekleme stok rezerve etmez. Sadece checkout başlangıcında (`POST /api/v1/checkout`) stok rezerve edilir. Rezervasyon süresi 20 dakikadır. Süre aşımında stok geri verilir (`reservedStock` sıfırlanır).
- **Kargo Hesaplaması:** Teslimat adresine, sepet ağırlığına/boyutlarına ve seçilen kargo firmasına göre hesaplanır. `ShippingMethod` modeli: `ShippingZone` (bölge) ve `ShippingRate` (ücret tablosu) ile entegre.
- **Vergi Hesaplaması:** Ürün `taxClass` değerine ve teslimat adresindeki vergi kurallarına göre hesaplanır. `TaxRate`: ülke/eyalet bazında KDV oranı (örn: TR: %20, US/CA: %8).

## 5. PAYMENT INTEGRATION
- **Ödeme Sağlayıcıları:** Stripe, Iyzico (Türkiye), PayPal. Adaptör pattern ile yeni sağlayıcı eklenebilir.
- **Ödeme Akışı (Checkout):**
  1. `POST /api/v1/checkout` → stok rezerve edilir (`reservedStock++`), `Payment` kaydı `pending` oluşturulur, ödeme sağlayıcıya istek yapılır.
  2. Ödeme sağlayıcı cevabı: `transactionId`, `paymentUrl` (3D Secure yönlendirme URL'si).
  3. Ödeme tamamlandığında webhook ile `POST /api/v1/webhooks/payment` → imza doğrulanır → `Order` ve `OrderItem` oluşturulur, stok düşülür (`stock--`, `reservedStock--`), `StockLog` kaydı.
  4. Başarısız ödeme: stok geri verilir, `Payment.status = 'failed'`.
- **3D Secure:** Türkiye ve EU kartları için zorunlu. Stripe PaymentIntents veya Iyzico 3D callback akışı.
- **Webhook İmza Doğrulaması:** Tüm ödeme webhook'ları sağlayıcıya özel imza doğrulamasından geçer (Stripe: `stripe-signature`, Iyzico: HMAC-SHA256). Doğrulanmamış webhook istekleri 403.

## 6. ORDER LIFECYCLE
- **Sipariş Durumları:** `pending_payment` → `confirmed` → `processing` → `shipped` → `delivered`. İptal: `cancelled`. İade: `return_requested` → `return_approved` → `returned` → `refunded`.
- **Sipariş Anlık Görüntüleri (Snapshot):** Sipariş oluşturulduğunda tüm ürün bilgileri (ad, SKU, fiyat, vergi oranı) değişmez olarak `OrderItemSnapshot`'lara kopyalanır. Ürün bilgisi sonradan değişse bile sipariş verileri korunur.
- **Sipariş Numarası:** Otomatik, sıralı, okunabilir format: `ORD-20260719-00001`. `orderNumber` UNIQUE.
- **Sipariş Onay E-postası:** Sipariş `confirmed` olduğunda müşteriye e-posta gönderilir: sipariş özeti, ürünler, teslimat adresi, tahmini teslimat tarihi.

## 7. INVENTORY MANAGEMENT
- **Stok Takibi:** `ProductVariant.stock` (fiziksel stok), `reservedStock` (rezerve edilmiş stok). Kullanılabilir stok: `stock - reservedStock`.
- **Stok Hareketleri (StockLog):** Her stok değişikliği loglanır. Nedenler: `sale` (satış), `restock` (stok girişi), `return` (iade), `adjustment` (manuel düzeltme), `cancellation` (sipariş iptali). `referenceId` ile ilgili siparişe/iadeye bağlanır.
- **Düşük Stok Uyarısı:** `lowStockThreshold` altına düşen varyantlar için admin bildirimi tetiklenir. Varsayılan eşik: 10 adet.
- **Stok Kilitleme (Pessimistic Lock):** Checkout sırasında `SELECT ... FOR UPDATE` ile stok satırı kilitlenir. Overselling (stoktan fazla satış) kesinlikle engellenir.

## 8. COUPON & DISCOUNT ENGINE
- **Kupon Tipleri:** `percentage` (yüzde, örn: %15), `fixed` (sabit, örn: 50 TL), `free_shipping` (ücretsiz kargo).
- **Kupon Kapsamı:** `applicableProducts` (belirli ürünler), `applicableCategories` (belirli kategoriler), `applicableBrands` (belirli markalar). Boş bırakılırsa tüm ürünlerde geçerlidir.
- **Kupon Limitleri:** `minSpend` (minimum sepet tutarı), `maxUses` (toplam kullanım limiti), `maxUsesPerUser` (kullanıcı başına limit, default 1), `validFrom`/`validTo` (geçerlilik tarih aralığı).
- **Kupon Kombinasyonu:** Default: tek kupon. `isCombinable = true` olan kuponlar birleştirilebilir. Birleştirmede önce yüzde indirim, sonra sabit indirim uygulanır.
- **Kupon Kullanım Takibi:** `CouponUsage` modeli ile hangi kullanıcının hangi siparişte kullandığı kaydedilir.

## 9. SHIPPING & FULFILLMENT
- **Kargo Bölgeleri (ShippingZone):** Coğrafi bölge tanımları (ülke, eyalet/şehir listesi). Her bölge için farklı kargo ücreti tanımlanabilir.
- **Kargo Yöntemleri:** `standard` (3-7 iş günü), `express` (1-2 iş günü), `same_day` (aynı gün), `pickup` (mağazadan teslim).
- **Kargo Ücret Tablosu (ShippingRate):** `ShippingMethod` + `ShippingZone` kesişiminde tanımlanır. Fiyatlandırma: sabit ücret veya ağırlığa göre kademeli (`tiers: [{ maxWeight: 1, price: 25.00 }, { maxWeight: 5, price: 35.00 }]`).
- **Ücretsiz Kargo:** `freeShippingThreshold` (örn: 500 TL üzeri ücretsiz kargo). `isFreeShipping = true` olan kuponlar kargo ücretini sıfırlar.
- **Kargo Takip:** `carrier` (kargo firması) + `trackingNumber` + `trackingUrl`. Sipariş `shipped` durumuna geçtiğinde müşteriye kargo takip e-postası.
- **Teslimat Durumları:** `pending` → `picked` → `packed` → `shipped` → `in_transit` → `delivered` / `failed`.

## 10. RETURN & REFUND WORKFLOW
- **İade Talebi (ReturnRequest):** Müşteri sipariş üzerinden iade talebi oluşturur. Body: `{ orderId, items: [{ orderItemId, quantity, reason }], returnMethod: 'shipping'|'in_store', notes? }`.
- **İade Politikası:** Admin tarafından tanımlanır. Varsayılan: teslimattan itibaren 14 gün. `returnWindowDays`. Bazı kategoriler iade edilemez (`isReturnable = false`, örn: iç giyim, dijital ürünler).
- **İade Statüleri:** `pending` → `approved` → `shipped_by_customer` → `received` → `inspected` → `refunded` / `rejected`.
- **Stok İade:** İade onaylandığında ve ürün teslim alındığında stok otomatik artırılır (`StockLog` reason: `return`).
- **Kısmi İade:** Siparişin belirli kalemleri için iade yapılabilir. `ReturnItem` her bir iade kalemini ayrı takip eder.
- **İade Tutarı Hesaplaması:** İade edilen ürünlerin satın alma fiyatı + ilgili vergi oranı üzerinden hesaplanır. Kargo ücreti genellikle iade edilmez (istisna: hatalı ürün).

## 11. REVIEWS & RATINGS
- **Yorum Yapma Kuralı:** Sadece satın alma yapmış ve siparişi `delivered` olan kullanıcılar yorum yapabilir. Aynı ürüne bir kez yorum yapılabilir (unique `(productId, userId)`).
- **Yorum Onayı:** Yorumlar admin onayından geçer (`isApproved`). Onaylanmamış yorumlar ürün sayfasında görünmez.
- **Ortalama Puan:** `Product.avgRating` denormalize olarak tutulur. Her yorum onaylandığında/reddedildiğinde yeniden hesaplanır.
- **Yorum İçeriği:** `rating` (1-5), `title`, `comment`, opsiyonel `images` (max 5 görsel).

## 12. CUSTOMER MANAGEMENT
- **Müşteri Profili:** Ad, soyad, e-posta, telefon, doğum tarihi, profil fotoğrafı.
- **Adres Defteri:** Birden fazla adres (ev, iş, fatura). `isDefault` ile varsayılan seçilir. Adres silinmez, `isActive = false` yapılır.
- **Sipariş Geçmişi:** Tüm siparişler, detayları ve durumları ile görüntülenir.
- **İstek Listesi (Wishlist):** Kullanıcı ürünleri istek listesine ekleyebilir. Stok durumu değiştiğinde veya fiyat düştüğünde bildirim (opsiyonel).
- **KVKK/GDPR:** Kişisel veri dışa aktarma (JSON) ve silme/anonymize etme. Hesap silme talebi 30 gün içinde işlenir.

## 13. ADMIN DASHBOARD & ANALYTICS
- **Satış Özeti:** Bugünkü/haftalık/aylık: sipariş sayısı, ciro, ortalama sepet tutarı, iade oranı.
- **Dönüşüm Hunisi:** Ziyaretçi → sepete ekleme → checkout başlatma → sipariş tamamlama dönüşüm oranları.
- **En Çok Satan Ürünler:** Dönemsel sıralama, kategori bazında dağılım.
- **Stok Raporu:** Düşük stoklu, stoksuz, fazla stoklu ürünler.
- **Kupon Kullanım Raporu:** Kupon bazında kullanım sayısı, yaratılan toplam indirim.
- **Dışa Aktarma:** CSV/Excel: sipariş listesi, stok raporu, müşteri listesi.

## 14. SECURITY & COMPLIANCE
- **PCI DSS Uyumu:** Kredi kartı bilgileri ASLA sunucuda saklanmaz. Ödeme işlemleri tamamen sağlayıcı tarafında (Stripe Elements, Iyzico Checkout Form) gerçekleşir.
- **Rate Limiting:** Public: 1000/dk. Auth: 100/dk. Admin: 50/dk. Checkout: 10/dk/kullanıcı (kart-deneme saldırısı önlemi).
- **Webhook Güvenliği:** Tüm ödeme webhook'ları imza doğrulamasından geçer. Stripe: `Stripe-Signature` header, Iyzico: HMAC-SHA256.
- **SQL Injection/CSRF/XSS:** Input validasyon, parameterized queries, CORS politikası, CSP header'ları.
- **Session Yönetimi:** JWT access token (15 dk) + refresh token (7 gün, rotate). Admin panel için 2FA zorunlu.
- **Fatura Saklama:** E-fatura/e-arşiv entegrasyonu (Türkiye için opsiyonel). Fatura bilgileri `Invoice` modelinde saklanır.
