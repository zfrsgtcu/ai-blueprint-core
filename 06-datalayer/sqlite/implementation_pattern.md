<!-- PURPOSE OF THIS FILE: SQLite implementation best practice'leri — AI ajanının uyması gereken ZORUNLU/YASAK/ÖNERİLEN kurallar -->
# SQLite Implementation Pattern

## Genel Prensipler

- 🔴 **ZORUNLU:** SQLite dosyası ASLA repository'ye commit edilmez. `.gitignore`'da `*.db` ve `data/` mutlaka bulunur.
- 🔴 **ZORUNLU:** WAL (Write-Ahead Logging) modu aktif edilir. `PRAGMA journal_mode=WAL;` — concurrent okuma + yazmaya izin verir.
- 🔴 **ZORUNLU:** Foreign key desteği aktif edilir. `PRAGMA foreign_keys=ON;` — SQLite'da varsayılan olarak KAPALIdır!
- 🟠 **YASAK:** Production'da yüksek concurrent yazma (>50 yazma/sn) SQLite ile yapılmaz. PostgreSQL'e geçilir.
- 🟡 **ÖNERİLEN:** `better-sqlite3` (Node.js) tercih edilir — senkron API, daha hızlı, `sqlite3`'e göre daha basit.

## Güvenlik Kuralları

- 🔴 **ZORUNLU:** Veritabanı dosyası web root dışında tutulur (`data/` veya `db/` dizini).
- 🔴 **ZORUNLU:** Parametrize query kullanılır. Template literal ile SQL oluşturulmaz.
- 🟡 **ÖNERİLEN:** Production'da dosya izinleri kısıtlanır (sadece uygulama kullanıcısı okuyabilir/yazabilir).

## Kodlama Standartları

### Node.js (better-sqlite3)
```javascript
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', '{{project-name}}.db');
const db = new Database(dbPath);

// 🔴 ZORUNLU — WAL modu + foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

// Tablo oluşturma
db.exec(`
  CREATE TABLE IF NOT EXISTS {{model_names}} (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_{{model_names}}_name ON {{model_names}}(name);
`);

// ✅ DOĞRU — Prepared statement
const stmt = db.prepare('SELECT * FROM {{model_names}} WHERE id = ?');
const getById = (id) => stmt.get(id);

// ✅ DOĞRU — Insert
const insert = db.prepare(`
  INSERT INTO {{model_names}} (id, name, description)
  VALUES (?, ?, ?)
`);

const create = ({ id, name, description }) => {
  return insert.run(id, name, description || '');
};

// ❌ YANLIŞ — Template literal SQL injection riski
// const result = db.prepare(`SELECT * FROM {{model_names}} WHERE name = '${name}'`);

module.exports = { db, getById, create };
```

### .NET (EF Core SQLite)
```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=./data/{{project-name}}.db"));

// DbContext'te foreign keys aktif
public class AppDbContext : DbContext
{
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseSqlite(connectionString, options =>
        {
            options.CommandTimeout(30);
        });
    }
}
```

## Performans

- 🔴 **ZORUNLU:** WAL modu aktif. `journal_mode=WAL` okuma ve yazmanın eşzamanlı çalışmasını sağlar.
- 🟡 **ÖNERİLEN:** `synchronous=NORMAL` (WAL modunda güvenli, FULL'dan daha hızlı).
- 🟡 **ÖNERİLEN:** `cache_size=-64000` (64MB page cache).
- 🟡 **ÖNERİLEN:** Toplu insert için transaction kullanılır — 1000x+ hız farkı yaratır.

## Yaygın Hatalar

1. **Foreign keys'i unutmak** — `PRAGMA foreign_keys=ON` çağırmamak, referential integrity ihlaline yol açar.
2. **WAL modunu açmamak** — Concurrent okuma bloklanır.
3. **`.db` dosyasını commit etmek** — Her deployment'da veri kaybı veya merge conflict.
4. **Production'da yüksek yazma trafiği** — SQLite single-writer'dır, 50+ yazma/sn'de PostgreSQL'e geç.
5. **Prepared statement kullanmamak** — Her sorguda SQL parse overhead'i.
6. **Transaction'sız batch insert** — 1000 satır insert, transaction ile 10ms, olmadan 10sn sürer.
