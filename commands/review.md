---
name: review
description: "Pending changes'i code-review perspektifinden inceler"
---

# /review

## Ne yapar?
Mevcut branch'teki değişiklikleri alır ve aşağıdaki perspektiflerden inceler:
- **Doğruluk**: Bug var mı, mantık hatası var mı?
- **Performans**: Gereksiz işlemler, optimizasyon fırsatları
- **Güvenlik**: XSS, SQL injection, sensitive data sızıntısı
- **Temizlik**: Kod tekrarı, gereksiz karmaşıklık

## Nasıl çalışır?
1. `git diff` ile değişiklikleri alır
2. Her bir değişikliği tek tek inceler
3. Bulguları raporlar (severity: low/medium/high)
4. Öneriler sunar (fix veya no-op)

## Çıktı formatı
```markdown
## Code Review Raporu

### 🐛 Bug'lar
- [file.ts:123] ...

### ⚡ Performans
- [file.ts:456] ...

### 🔒 Güvenlik
- [file.ts:789] ...

### 💡 Öneriler
- ...
```
