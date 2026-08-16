<!-- PURPOSE OF THIS FILE: MSSQL implementation best practice'leri — AI ajanının uyması gereken ZORUNLU/YASAK/ÖNERİLEN kurallar -->
# Microsoft SQL Server Implementation Pattern

## Genel Prensipler

- 🔴 **ZORUNLU:** Tüm veritabanı erişimleri Repository Pattern üzerinden yapılır. Controller ASLA doğrudan DbContext kullanmaz.
- 🔴 **ZORUNLU:** Bağlantı string'i ASLA hardcoded yazılmaz. `appsettings.json` → Key Vault → environment variable zinciri kullanılır.
- 🔴 **ZORUNLU:** Production'da `Encrypt=True` ve `TrustServerCertificate=False` (Azure SQL / güvenilen sertifika varsa).
- 🔴 **ZORUNLU:** Connection resiliency aktif edilir. `EnableRetryOnFailure()` EF Core'da varsayılan olarak AKTİF DEĞİLDİR.
- 🟡 **ÖNERİLEN:** Azure SQL kullanılıyorsa Managed Identity (şifresiz bağlantı) tercih edilir.

## Güvenlik Kuralları

### SQL Injection
- 🔴 **ZORUNLU:** Parametrize query. EF Core LINQ veya `FromSqlRaw` ile parametre placeholder'ları kullanılır.
- 🟠 **YASAK:** `string.Format()` veya string interpolation ile dinamik SQL.

### Connection Security
- 🔴 **ZORUNLU:** Azure Key Vault veya environment variable ile secret yönetimi.
- 🔴 **ZORUNLU:** SA hesabı production'da kullanılmaz. Sınırlı yetkili uygulama kullanıcısı oluşturulur.
- 🟡 **ÖNERİLEN:** Row-Level Security (RLS) hassas veri filtrelemesi için.

## Kodlama Standartları

### .NET (EF Core)
```csharp
// ✅ DOĞRU — Connection resiliency
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null
        );
        sqlOptions.CommandTimeout(60);
    })
);

// ✅ DOĞRU — Repository Pattern
public class {{ModelName}}Repository : I{{ModelName}}Repository
{
    private readonly AppDbContext _context;
    public {{ModelName}}Repository(AppDbContext context) => _context = context;

    public async Task<PaginatedList<{{ModelName}}>> GetPaginatedAsync(int page, int limit)
    {
        var query = _context.{{ModelNames}}.AsNoTracking();
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * limit).Take(limit).ToListAsync();
        return new PaginatedList<{{ModelName}}>(items, total, page, limit);
    }
}

// ❌ YANLIŞ — Controller'da doğrudan DbContext
// public async Task<IActionResult> Index() {
//     var products = await _context.Products.ToListAsync(); // REPO İHLALİ!
// }
```

### Node.js (mssql driver)
```javascript
const sql = require('mssql');

const config = {
  server: process.env.DB_HOST || '{{DB_HOST}}',
  port: parseInt(process.env.DB_PORT, 10) || {{DB_PORT}},
  database: process.env.DB_NAME || '{{DB_NAME}}',
  user: process.env.DB_USER || '{{DB_USER}}',
  password: process.env.DB_PASSWORD || '{{DB_PASSWORD}}',
  options: {
    encrypt: true,
    trustServerCertificate: process.env.NODE_ENV !== 'production',
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
  },
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

// ✅ DOĞRU — Prepared statement
async function getById(id) {
  await poolConnect;
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM {{model_names}} WHERE id = @id');
  return result.recordset[0];
}
```

## Performans

- 🔴 **ZORUNLU:** Read-only sorgularda `.AsNoTracking()` kullanılır (EF Core — change tracker overhead'ini önler).
- 🟡 **ÖNERİLEN:** Sık sorgulanan alanlara INDEX. `CREATE NONCLUSTERED INDEX IX_name ON ...`
- 🟡 **ÖNERİLEN:** Büyük veri setlerinde sayfalama için `OFFSET ... FETCH NEXT` kullanılır.
- 🟡 **ÖNERİLEN:** N+1 sorgu için `.Include()` / `.ThenInclude()` kullanılır.

## Yaygın Hatalar

1. **`EnableRetryOnFailure` kullanmamak** — Geçici ağ hatasında uygulama crash olur.
2. **AsNoTracking eksikliği** — Read-only sorguda change tracker overhead'i.
3. **SA hesabı kullanmak** — Production'da full yetkili hesap güvenlik açığıdır.
4. **Bağlantı string'ini appsettings.json'da düz metin bırakmak** — Secret manager / Key Vault kullanılmazsa güvenlik riski.
5. **N+1 sorgu** — İlişkili entity'leri lazy load ile tek tek çekmek.
6. **Controller'da DbContext kullanmak** — Repository Pattern ihlali.
7. **Azure SQL'de Managed Identity kullanmamak** — Şifresiz bağlantı varken şifre yönetmek.
