<!-- PURPOSE OF THIS FILE: PostgreSQL implementation best practice'leri — AI ajanının uyması gereken ZORUNLU/YASAK/ÖNERİLEN kurallar -->
# PostgreSQL Implementation Pattern

## Genel Prensipler

- 🔴 **ZORUNLU:** Tüm veritabanı erişimleri Repository Pattern üzerinden yapılır. Handler/Controller katmanı ASLA doğrudan `NpgsqlConnection`, `pg.Client`, veya `Pool.query` çağırmaz.
- 🔴 **ZORUNLU:** Bağlantı string'i ASLA kod içinde hardcoded yazılmaz. `appsettings.json` (.NET) → `Environment.GetEnvironmentVariable` zinciri veya `process.env.DATABASE_URL` (Node.js) üzerinden okunur.
- 🔴 **ZORUNLU:** Production ortamda `IncludeErrorDetail` (.NET) veya verbose error logging KAPALI olmalıdır. Veritabanı hata mesajları istemciye ham olarak döndürülmez.
- 🟠 **YASAK:** Raw SQL string concatenation ile sorgu oluşturulmaz. Her zaman parametrize query veya ORM kullanılır.
- 🟡 **ÖNERİLEN:** Connection pooling kullanılır. .NET'te varsayılan olarak aktiftir, Node.js'de `pg.Pool` kullanılır.

## Güvenlik Kuralları

### SQL Injection
- 🔴 **ZORUNLU:** Kullanıcı girdisi ASLA doğrudan SQL sorgusuna eklenmez.
- 🔴 **ZORUNLU:** `$1, $2, ...` (pg) veya `@p0, @p1, ...` (EF Core) parametre placeholder'ları kullanılır.
- 🟠 **YASAK:** `string.Format()` veya template literal ile dinamik SQL oluşturulmaz.

### Connection Security
- 🔴 **ZORUNLU:** Production'da SSL/TLS bağlantı zorunludur. Connection string'te `SSL Mode=Require` (.NET) veya `?sslmode=require` (Node.js).
- 🔴 **ZORUNLU:** Veritabanı şifresi ASLA loglanmaz, ASLA commit edilmez, ASLA client'a gönderilmez.
- 🟡 **ÖNERİLEN:** Azure Key Vault veya HashiCorp Vault ile secret rotation.

## Kodlama Standartları

### .NET (Entity Framework Core + Npgsql)
```
// ✅ DOĞRU — Repository Pattern
public class ProductRepository : IProductRepository
{
    private readonly AppDbContext _context;
    public ProductRepository(AppDbContext context) => _context = context;

    public async Task<Product?> GetByIdAsync(int id)
        => await _context.Products.FindAsync(id);
}

// ✅ DOĞRU — Parametrize query
var products = await _context.Products
    .FromSqlRaw("SELECT * FROM products WHERE category = {0}", categoryId)
    .ToListAsync();

// ❌ YANLIŞ — Raw SQL concatenation
var query = $"SELECT * FROM products WHERE name = '{name}'"; // SQL Injection riski!
```

### Node.js (pg Pool)
```
// ✅ DOĞRU — pg.Pool + parametrize
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const result = await pool.query(
  'SELECT * FROM products WHERE category = $1',
  [categoryId]
);

// ❌ YANLIŞ — Template literal ile sorgu
const result = await pool.query(`SELECT * FROM products WHERE name = '${name}'`);
```

### Node.js (Prisma)
```
// ✅ DOĞRU — Prisma Client
const products = await prisma.product.findMany({
  where: { category: categoryId },
  include: { variants: true },
});

// ❌ YANLIŞ — $queryRawUnsafe
const products = await prisma.$queryRawUnsafe(
  `SELECT * FROM products WHERE name = '${name}'`
);
```

## Performans

- 🔴 **ZORUNLU:** N+1 sorgu problemini önlemek için `.Include()` (.NET) veya Prisma `include` kullanılır.
- 🟡 **ÖNERİLEN:** Sık sorgulanan alanlara INDEX eklenir. Migration'da `.HasIndex()` (.NET) veya `@@index` (Prisma).
- 🟡 **ÖNERİLEN:** Büyük veri setlerinde sayfalama (pagination) kullanılır. `OFFSET` / `LIMIT` veya cursor-based pagination.
- 🟡 **ÖNERİLEN:** Connection pool min/max değerleri: min=5, max=50 (uygulama başına).

## Yaygın Hatalar

1. **Bağlantı string'ini hardcoded yazmak** — Environment variable kullanılmazsa production'da patlar.
2. **Raw SQL string concatenation** — SQL injection'a açık kapı bırakır.
3. **Repository Pattern kullanmamak** — Controller/Handler içinde doğrudan SQL yazmak, test edilebilirliği öldürür.
4. **Connection'ı kapatmamak** — `using` (.NET) veya pool.release (Node.js) çağırmamak connection leak'e yol açar.
5. **N+1 sorgu** — İlişkili entity'leri lazy load ile tek tek çekmek, performans katliamıdır.
6. **Transaction kullanmamak** — Birden fazla yazma işlemini transaction'sız yapmak, veri tutarsızlığına yol açar.
7. **Production'da verbose error mesajları** — İstemciye migration hatası veya constraint name döndürmek güvenlik açığıdır.

## Dizin Yapısı Kontrol Listesi

- [ ] `docker-compose.yml`'da `postgres` servisi tanımlı mı?
- [ ] Connection string environment variable'dan okunuyor mu?
- [ ] Repository Pattern uygulanmış mı? (`I*Repository` + `*Repository` dosyaları var mı?)
- [ ] Migration'lar oluşturulmuş mu?
- [ ] Production için SSL/TLS bağlantı zorunlu mu?
- [ ] Connection pooling yapılandırması yapılmış mı?
- [ ] Hassas veriler (şifre, connection string) loglanmıyor mu?
