<!--
  BU DOSYANIN AMACI:
  MSSQL ile performanslı sorgu optimizasyonu, indexing stratejileri, stored procedure kullanımı ve production best practice'lerini AI'a öğretir.
-->

# MSSQL BEST PRACTICES

## 1. INDEX STRATEJİSİ

### 1.1. Clustered vs Non-Clustered Index

```sql
-- Clustered Index (her tabloda SADECE 1 tane, genelde PK)
ALTER TABLE users ADD CONSTRAINT PK_users PRIMARY KEY CLUSTERED (id);

-- Non-Clustered Index (sık sorgulanan alanlar)
CREATE NONCLUSTERED INDEX IX_users_email ON users(email);

-- Filtered Index (belirli koşul için)
CREATE NONCLUSTERED INDEX IX_orders_active
  ON orders(created_at, status)
  WHERE status IN ('PENDING', 'PROCESSING');
```

### 1.2. Covering Index (INCLUDE)

```sql
-- Sık sorgulanan pattern: email ile kullanıcı ara, id ve name döndür
CREATE NONCLUSTERED INDEX IX_users_email_cover
  ON users(email)
  INCLUDE (id, name); -- Bu alanlar index'te saklanır, tabloya gitmeden döner
```

### 1.3. Index Seçim Rehberi

| Sorgu Pattern'i | Index Tipi |
|----------------|-----------|
| `WHERE email = ?` | Non-clustered |
| `WHERE category_id = ? AND status = ?` | Composite non-clustered |
| `ORDER BY created_at DESC` | Non-clustered |
| `SELECT email, name WHERE ...` | Covering index (INCLUDE) |
| `WHERE status IN (...)` | Filtered index |

## 2. QUERY OPTİMİZASYONU

### 2.1. NOLOCK vs READ COMMITTED SNAPSHOT

```sql
-- KÖTÜ: NOLOCK dirty read yapabilir (satış rakamları hatalı olur)
SELECT * FROM orders WITH (NOLOCK) WHERE status = 'DELIVERED';

-- İYİ: Database seviyesinde READ_COMMITTED_SNAPSHOT ON
ALTER DATABASE AppDb SET READ_COMMITTED_SNAPSHOT ON;
-- Artık tüm SELECT'ler otomatik snapshot isolation kullanır, NOLOCK gerekmez
```

### 2.2. Pagination (OFFSET vs Keyset)

```sql
-- KÖTÜ: Büyük veri setinde OFFSET
SELECT * FROM orders ORDER BY id OFFSET 10000 ROWS FETCH NEXT 20 ROWS ONLY;

-- İYİ: Keyset pagination
SELECT TOP 20 * FROM orders
WHERE id > @lastSeenId  -- Son görülen kaydın ID'si
ORDER BY id;
```

### 2.3. Execution Plan Analizi

```sql
-- Sorgunun index kullanıp kullanmadığını kontrol et:
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
SELECT * FROM users WHERE email = 'test@test.com';
-- Logical reads değerine bak: düşük = index kullanıyor, yüksek = table scan
```

## 3. TRANSACTION VE LOCKING

### 3.1. Transaction Scope

```ts
const transaction = new sql.Transaction(pool);
await transaction.begin();

try {
  await transaction.request()
    .input('productId', sql.Int, productId)
    .input('quantity', sql.Int, quantity)
    .query(`
      UPDATE products
      SET stock = stock - @quantity
      WHERE id = @productId AND stock >= @quantity;
    `);

  await transaction.request()
    .input('productId', sql.Int, productId)
    .input('quantity', sql.Int, quantity)
    .query(`INSERT INTO orders (...) VALUES (...)`);

  await transaction.commit();
} catch (err) {
  await transaction.rollback();
  throw err;
}
```

### 3.2. Deadlock Önleme

- Tablolara her zaman aynı sırayla eriş
- Transaction'ları olabildiğince kısa tut
- Uzun transaction'larda `SET DEADLOCK_PRIORITY LOW` kullan
- Sık deadlock olan tablolara index ekle

## 4. STORED PROCEDURE KULLANIMI

```sql
-- Karmaşık iş mantığı için stored procedure:
CREATE PROCEDURE sp_PlaceOrder
  @userId INT,
  @productId INT,
  @quantity INT
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRANSACTION;
  BEGIN TRY
    -- Stok kontrolü ve sipariş oluşturma
    UPDATE products SET stock = stock - @quantity
    WHERE id = @productId AND stock >= @quantity;

    IF @@ROWCOUNT = 0
      THROW 50001, 'Yetersiz stok', 1;

    INSERT INTO orders (user_id, product_id, quantity) VALUES (@userId, @productId, @quantity);

    COMMIT;
  END TRY
  BEGIN CATCH
    ROLLBACK;
    THROW;
  END CATCH
END;
```

## 5. YAPILMAMASI GEREKENLER

- **`SELECT *` production kodunda** — Sadece ihtiyaç duyulan kolonları seç
- **WHERE'de fonksiyon (örn: `WHERE YEAR(date) = 2024`)** — Index'i devre dışı bırakır, range query kullan
- **NOLOCK yaygın kullanımı** — READ_COMMITTED_SNAPSHOT database seviyesinde aç
- **nvarchar(max) gereksiz kullanım** — Varchar boyutunu bilmiyorsan bile nvarchar(500) daha iyi
- **Production'da auto-shrink açık** — Performansı düşürür, index fragmentasyonu yaratır
- **Guid cluster index** — Sıralı veri ekleme performansını düşürür, int autoincrement daha iyi
