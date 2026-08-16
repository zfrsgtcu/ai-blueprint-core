---
name: workflow
description: "Otomatik iş akışı çalıştırır"
---

# /workflow

## Ne yapar?
Sık kullanılan görevleri otomatikleştiren iş akışları.

## Mevcut akışlar:

### `test` - Test çalıştırma ve raporlama
```bash
npm test -- --coverage
```
- Test sonuçlarını analiz eder
- Failed test'ları listeler
- Coverage raporu oluşturur

### `lint-fix` - Lint hatalarını otomatik düzeltme
```bash
eslint . --fix
prettier --write "src/**/*.{ts,tsx}"
```
- Lint hatalarını düzeltir
- Değişiklikleri commit eder (onay ister)

### `deploy-check` - Deploy öncesi kontrol
1. Test'ler başarılı mı? ✓
2. Lint hataları var mı? ✓
3. Security scan sonuçları ✓
4. Build başarılı mı? ✓

## Kullanım
```
/workflow test
/workflow lint-fix
/workflow deploy-check
```
