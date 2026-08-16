---
name: setup
description: "Proje kurulumunu tamamlar"
---

# /setup

## Ne yapar?
Yeni klonlanmış projeyi çalıştırılabilir hale getirir.

## Adımlar:
1. **Bağımlılıkları yükle**: `npm install` veya `yarn`
2. **Environment değişkenleri**: `.env.example` → `.env` (opsiyonel)
3. **Veritabanı migration**: `prisma migrate dev` veya `knex migrate:latest`
4. **Test verisi**: Gerekirse seed data yükle
5. **Başarı mesajı**: Kurulum tamamlandı bilgisi

## Çıktı
```markdown
## ✅ Kurulum Tamamlandı

- [x] Bağımlılıklar yüklendi (127 paket)
- [x] Environment değişkenleri oluşturuldu
- [x] Veritabanı migration uygulandı
- [x] Test verisi yüklendi

🚀 Uygulamayı başlatmak için: `npm run dev`
```
