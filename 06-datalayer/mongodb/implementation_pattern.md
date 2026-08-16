<!-- PURPOSE OF THIS FILE: MongoDB implementation best practice'leri — AI ajanının uyması gereken ZORUNLU/YASAK/ÖNERİLEN kurallar -->
# MongoDB Implementation Pattern

## Genel Prensipler

- 🔴 **ZORUNLU:** Tüm veritabanı erişimleri Repository Pattern veya Service katmanı üzerinden yapılır. Controller/Handler ASLA doğrudan `Model.find()` çağırmaz.
- 🔴 **ZORUNLU:** Bağlantı string'i environment variable'dan okunur, ASLA hardcoded yazılmaz.
- 🔴 **ZORUNLU:** Mongoose Schema'da `strict: true` (varsayılan) korunur — tanımlanmamış alanlar kaydedilmez.
- 🟠 **YASAK:** Kullanıcı girdisi ile dinamik `$where` veya `$eval` çalıştırılmaz.
- 🟡 **ÖNERİLEN:** Mongoose tercih edilir (şema doğrulama, middleware, virtuals, population).

## Güvenlik Kuralları

### NoSQL Injection
- 🔴 **ZORUNLU:** Kullanıcı girdisi ASLA ham obje olarak `find()` veya `updateMany()`'ye geçilmez.
- 🔴 **ZORUNLU:** `$where`, `$eval`, `mapReduce` gibi JavaScript çalıştıran operatörler kullanılmaz.
- 🟠 **YASAK:** `req.body` veya `req.query` doğrudan Mongoose sorgusuna verilmez. Her zaman explicit alan seçimi yapılır.

```
// ✅ DOĞRU — Explicit alan seçimi
const products = await Product.find({
  category: { $eq: req.query.category },
  isActive: true
}).limit(20);

// ❌ YANLIŞ — Kullanıcı girdisini doğrudan geçmek
const products = await Product.find(req.query); // NoSQL Injection riski!
```

### Connection Security
- 🔴 **ZORUNLU:** Production'da `?authSource=admin` ile yetkilendirme kaynağı belirtilir.
- 🔴 **ZORUNLU:** Network isolation — MongoDB port'u dış dünyaya açılmaz, sadece uygulama container'ı ile iletişim kurar.
- 🟡 **ÖNERİLEN:** Atlas kullanılıyorsa IP whitelist ve VPC peering.

## Kodlama Standartları

### Mongoose Model Tanımı
```
// ✅ DOĞRU — Schema + Model ayrımı
const {{modelName}}Schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,  // createdAt, updatedAt otomatik
  strict: true,      // tanımlanmamış alan reddedilir
});

// Index tanımı
{{modelName}}Schema.index({ name: 1 });
{{modelName}}Schema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('{{ModelName}}', {{modelName}}Schema);
```

### Repository Pattern ile Mongoose
```
// ✅ DOĞRU — Repository Pattern
class {{ModelName}}Repository {
  async findAll(filter = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.Model.find(filter).skip(skip).limit(limit).lean(),
      this.Model.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async findById(id) {
    return this.Model.findById(id).lean();
  }
}
```

## Performans

- 🔴 **ZORUNLU:** Sık sorgulanan alanlara INDEX eklenir. `.explain()` ile sorgu planı kontrol edilir.
- 🔴 **ZORUNLU:** Büyük veri setlerinde `.lean()` kullanılır (Mongoose doküman wrapper'ı olmadan plain JS obje döner, ~3-5x daha hızlı).
- 🟠 **YASAK:** `populate()` zinciri 3 seviyeyi geçmemelidir. Derin population yerine aggregation pipeline kullanılır.
- 🟡 **ÖNERİLEN:** Read-heavy uygulamalarda `secondary` okuma tercihi (replica set).

## Yaygın Hatalar

1. **NoSQL Injection** — Kullanıcı girdisini obje olarak doğrudan sorguya geçmek.
2. **Index eksikliği** — Sorgulanan alana index eklememek, COLLSCAN'e (full collection scan) yol açar.
3. **`.lean()` kullanmamak** — Read-only sorgularda Mongoose wrapper overhead'i.
4. **Connection'ı singleton yapmamak** — Her istekte yeni bağlantı açmak.
5. **Schema'da `strict: false`** — Tanımlanmamış alanların sessizce kaydedilmesi.
6. **Deep population** — 3+ seviye `.populate()` çağırmak, N+1 benzeri performans sorunu.
7. **Transaction kullanmamak** — Birden fazla collection'ı atomik güncellememek.
