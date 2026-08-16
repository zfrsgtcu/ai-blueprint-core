<!--
  BU DOSYANIN AMACI:
  Mongoose ODM'in Node.js projelerinde doğru şekilde konfigüre edilmesini, schema tasarım kurallarını ve bağlantı yönetimini AI'a öğretir.
-->

# MONGOOSE CONFIGURATION RULES

## 1. KURULUM

```bash
npm install mongoose
```

## 2. BAĞLANTI YÖNETİMİ

### 2.1. Singleton Connection (Next.js / Serverless)

```ts
// lib/mongoose.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI tanımlanmamış');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false, // Serverless için: bağlantı yoksa hemen hata ver
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

**Next.js'te connection caching ZORUNLU.** Her hot reload'da yeni connection açılmamalı.

### 2.2. Event Handler'ları

```ts
mongoose.connection.on('connected', () => {
  console.log('MongoDB bağlantısı kuruldu');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB bağlantı hatası:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB bağlantısı kapatıldı');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
```

## 3. SCHEMA TASARIM KURALLARI

### 3.1. Temel Schema

```ts
import mongoose, { Schema, Document } from 'mongoose';

interface IUser extends Document {
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email zorunludur'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Geçerli bir email girin'],
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'İsim en fazla 100 karakter olabilir'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true, // createdAt ve updatedAt otomatik
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password; // Hassas alanları JSON'dan çıkar
      },
    },
  }
);
```

### 3.2. İlişki Tipleri (MongoDB'de)

```ts
// Reference (normalize) — önerilen
const OrderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Her foreign key index'lenmeli
  },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price: Number, // Sipariş anındaki fiyat (snapshot)
  }],
});

// Embedded (denormalize) — SADECE birlikte sorgulanan, değişmeyen veriler için
const UserSchema = new Schema({
  addresses: [{
    label: String,
    street: String,
    city: String,
    isDefault: Boolean,
  }],
});
```

**Kural:** Sipariş içindeki ürün fiyatı gibi kritik veriler EMBEDDED olmalı (snapshot). Referans ile canlı ürün fiyatına bağlanırsa sipariş geçmişi bozulur.

### 3.3. Index Tasarımı

```ts
// Tek alan index'leri
UserSchema.index({ email: 1 }, { unique: true });

// Compound index (sık sorgulanan kombinasyonlar)
OrderSchema.index({ userId: 1, createdAt: -1 });

// Text index (arama için)
ProductSchema.index({ name: 'text', description: 'text' });

// TTL index (otomatik silme)
SessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });
```

## 4. MIDDLEWARE (HOOKS)

```ts
// Pre-save: Kaydetmeden önce
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Post-findOneAndDelete: Cascade delete
PostSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await Comment.deleteMany({ postId: doc._id });
  }
});

// Pre-find: Soft delete otomatik filtreleme
UserSchema.pre(/^find/, function (next) {
  // this.getQuery().deletedAt = { $exists: false };
  next();
});
```

## 5. VERSİYON UYUMU

| Mongoose | MongoDB | Node.js |
|----------|---------|---------|
| v8.x | 6.0 - 7.x | 18+ |
| v7.x | 5.0 - 7.x | 16+ |
| v6.x | 4.4 - 5.x | 14+ |

## 6. YAPILMAMASI GEREKENLER

- **Production'da `autoIndex: true`** — Migration olmadan index oluşturur, performansı düşürür
- **Embedded document sayısını sınırsız büyütme** — 16MB document limiti, max 100-200 embedded
- **Callback API kullanma** — Mongoose 7+ callback deprecated, async/await kullan
- **`save()` yerine doğrudan `updateOne()` ile validation'ı atlama** — Validation çalışmaz
- **Her alana index ekleme** — Yazma performansını düşürür
