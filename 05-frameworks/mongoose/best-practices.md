<!--
  BU DOSYANIN AMACI:
  Mongoose ile performanslı MongoDB sorgu optimizasyonu, populate/aggregation best practice'leri ve production güvenliği kurallarını AI'a öğretir.
-->

# MONGOOSE BEST PRACTICES

## 1. QUERY OPTİMİZASYONU

### 1.1. populate (JOIN) Optimizasyonu

```ts
// KÖTÜ: Tüm alanları getir
const orders = await Order.find().populate('userId');

// İYİ: Sadece gerekli alanlar
const orders = await Order.find().populate('userId', 'name email');

// İYİ: Nested populate sınırlı (max 2 seviye)
const orders = await Order.find().populate({
  path: 'userId',
  select: 'name email',
  populate: {
    path: 'addresses',
  },
});
```

### 1.2. select ile Alan Filtreleme

```ts
// KÖTÜ: Tüm doküman
const users = await User.find();

// İYİ: Sadece gerekli alanlar
const users = await User.find().select('name email role');

// Dışlama: password hariç tüm alanlar
const users = await User.find().select('-password -__v');
```

### 1.3. Lean Query (Plain JS Object)

```ts
// KÖTÜ: Mongoose Document (hydrated, ağır)
const users = await User.find();
const json = users.map(u => u.toJSON()); // Ekstra işlem

// İYİ: Plain JS object (hafif, hızlı)
const users = await User.find().lean();
// Direkt JSON serialize edilebilir, getter/setter yok
```

**Read-only sorgularda her zaman `.lean()` kullan.** 3-5x daha hızlıdır.

### 1.4. Aggregation Pipeline

```ts
// Karmaşık raporlama için aggregation:
const revenue = await Order.aggregate([
  {
    $match: {
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'DELIVERED',
    },
  },
  {
    $group: {
      _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
      totalRevenue: { $sum: '$totalAmount' },
      orderCount: { $sum: 1 },
      avgOrderValue: { $avg: '$totalAmount' },
    },
  },
  { $sort: { _id: 1 } },
]);
```

## 2. PERFORFANS İYİLEŞTİRMELERİ

### 2.1. Query Execution Explain

```ts
// Sorgunun index kullanıp kullanmadığını kontrol et:
const explanation = await User.find({ email: 'test@test.com' }).explain('executionStats');
console.log(explanation.executionStats);
```

### 2.2. Bulk Operations

```ts
// KÖTÜ: Tek tek insert
for (const user of users) {
  await User.create(user);
}

// İYİ: Bulk insert
await User.insertMany(users, { ordered: false });
// ordered: false = hata olsa bile devam et

// Bulk update
const bulkOps = users.map(user => ({
  updateOne: {
    filter: { _id: user._id },
    update: { $set: { status: user.status } },
  },
}));
await User.bulkWrite(bulkOps);
```

### 2.3. Cursor ile Büyük Veri Seti

```ts
// 100K'den fazla doküman:
const cursor = User.find().cursor();

for await (const doc of cursor) {
  // Her bir dokümanı işle
  await processUser(doc);
}
```

## 3. VALIDASYON

### 3.1. Custom Validator

```ts
const ProductSchema = new Schema({
  price: {
    type: Number,
    required: true,
    min: [0, 'Fiyat negatif olamaz'],
    validate: {
      validator: (v: number) => v >= 0,
      message: 'Fiyat {VALUE} geçersiz. 0 veya pozitif olmalı.',
    },
  },
  discountPrice: {
    type: Number,
    validate: {
      validator: function (this: any, v: number) {
        return v < this.price; // İndirim fiyatı normal fiyattan düşük olmalı
      },
      message: 'İndirim fiyatı normal fiyattan düşük olmalı',
    },
  },
});
```

## 4. VERSIONING (Optimistic Concurrency)

```ts
// Mongoose'ta __v alanı otomatik version key'dir.
// Concurrent update'lerde hata kontrolü:
const user = await User.findById(id);
user.name = 'Yeni İsim';

try {
  await user.save(); // save sırasında version kontrolü yapar
} catch (err) {
  if (err.name === 'VersionError') {
    // Başka bir işlem aynı dokümanı güncellemiş
    throw new Error('Doküman güncellenmiş, tekrar deneyin');
  }
}
```

## 5. CONNECTION POOL

```ts
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,       // Varsayılan: 100 (fazla!), serverless için: 1-5
  minPoolSize: 2,        // Minimum bağlantı
  connectTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
});
```

## 6. YAPILMAMASI GEREKENLER

- **`.lean()` kullanmadan read-only sorgu yapma** — Gereksiz hydration
- **Aggregate pipeline'da `$lookup` (JOIN) kötüye kullanma** — MongoDB JOIN için optimize değil
- **Index olmayan alanda `$regex` ile arama** — Collection scan yapar, text index kullan
- **`updateMany({})` boş filter ile** — Tüm dokümanları günceller, VERİ KAYBI
- **Production'da `mongoose.set('debug', true)`** — Tüm sorguları konsola basar, güvenlik riski
- **`findByIdAndUpdate`'de `{ new: true }` unutma** — Güncellenmiş doküman yerine eski döner
