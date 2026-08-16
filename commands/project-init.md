---
name: project-init
description: "Yeni proje başlatır, stack seçimi ve konfigürasyon oluşturur"
---

# /project-init

## Ne yapar?
Yeni bir proje için başlangıç konfigürasyonu oluşturur. Stack template'lerinden birini seçer ve proje dosyalarını hazırlar.

## Kullanım

```bash
/project-init <proje-adi> --stack <stack-id> [--name "Proje Adı"]
```

### Parametreler:
- `<proje-adi>` — Proje klasör adı (kebab-case)
- `--stack` — Stack ID (zorunlu)
- `--name` — Proje gösterge adı (opsiyonel)

## Mevcut Stack'ler

| Stack ID | Proje Türü | Frontend | Backend | Database |
|----------|------------|----------|---------|----------|
| `corporate-portfolio` | Kurumsal & Portfolyo | Astro.js | Node.js | SQLite |
| `landing-page` | Landing Page | Astro.js | - | - |
| `news-magazine` | Haber & Dergi | Astro.js | Node.js/.NET | MSSQL |
| `ecommerce` | E-Ticaret | Nuxt.js | .NET Web API | MSSQL |
| `classifieds` | İlan & Sınıflandırılmış | Nuxt.js | .NET Web API | MSSQL |
| `booking` | Randevu / Booking | Nuxt.js | .NET Web API | MSSQL |
| `lms` | E-Öğrenme (LMS) | Nuxt.js | .NET Web API | MSSQL |
| `saas-crm` | SaaS / CRM | Nuxt.js | .NET Web API | MSSQL |
| `admin-panel` | Özel Yönetim Paneli | Nuxt.js/Blazor | .NET Web API | MSSQL |
| `mobile-backend` | Mobil Backend | React Native | .NET Web API | MSSQL |
| `native-mobile` | Native Mobil (MAUI) | .NET MAUI | .NET Web API | MSSQL/SQLite |
| `hybrid-blazor-maui` | Hibrit (Blazor+MAUI) | Blazor Hybrid | .NET Web API | MSSQL/SQLite |

## Örnek Kullanımlar

### E-Ticaret Sitesi Başlatma
```bash
/project-init online-magaza --stack ecommerce --name "Online Mağazam"
```

### Kurumsal Site Başlatma (Avukatlık Bürosu)
```bash
/project-init yildiz-avukatlik --stack corporate-portfolio --name "Yıldız Avukatlık Bürosu"
```

### SaaS CRM Sistemi
```bash
/project-init satis-crm --stack saas-crm --name "Satış CRM Sistemi"
```

## Sonrası Ne Olur?

1. `.claude/projects/<proje-adi>.json` oluşturulur (stack konfigürasyonu ile)
2. Proje kök dizininde `README.md` oluşturulur (stack bilgileri ile)
3. Workflow hazır olur: `/workflow feature-dev --feature "İlk özellik"`

## Stack Detayları

Her stack template şunları içerir:
- ✅ Teknoloji yığını (frontend, backend, database, deploy)
- ✅ UI kütüphaneleri ve versiyonları
- ✅ Ekstra servisler/entegrasyonlar
- ✅ Compliance gereksinimleri (KVKK, GDPR, PCI-DSS)
- ✅ Departman prompt'ları (otomatik özelleştirilmiş)
- ✅ Performans hedefleri

Detaylı bilgi için: `.claude/stacks/README.md`
