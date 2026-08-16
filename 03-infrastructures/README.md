<!--
  BU DOSYANIN AMACI:
  AI ajanlarına 03-infrastructures katmanının bütünsel kullanım kılavuzunu sunar.
  Bu README, AI'nın bu katmanı nasıl okuyup uygulayacağını adım adım açıklar.
  Tüm alt katmanların (docker, ci-cd, monitoring, networking, secrets) birbirleriyle
  nasıl entegre olduğunu gösterir.
-->

# 03-INFRASTRUCTURES — PRODUCTION-READY ALTYAPI KATMANI

## KATMAN FELSEFESİ

Bu katman, uygulamanın **işletim ortamının** kodudur. Uygulama kodunun değil, sistemin kendisinin kodudur.

"Blueprint-as-Code" yaklaşımıyla çalışır:
- **Manifest dosyaları:** Projeyi tanımlar (ne var, ne yok, hangi seçenekler mevcut)
- **Rule dosyaları:** Kuralları tanımlar (ne ZORUNLU, ne YASAK, ne TAVSİYE)
- **Template dosyaları:** Çıktı şablonlarını içerir (AI placeholder'ları doldurur)

AI, bu katmandaki dosyaları okuyarak projenin altyapı ihtiyaçlarını anlar ve production-ready konfigürasyonları üretir.

## KLASÖR YAPISI

```
03-infrastructures/
├── manifest.json                  ← Bu katmanın ana manifesti (AI giriş noktası)
├── README.md                      ← Bu dosya (kullanım kılavuzu)
│
├── docker/                        ← Container ve orchestration
│   ├── manifest.json              ← Docker servis tanımları
│   ├── production-constraints.md  ← Production kısıtları (11 kural)
│   ├── dockerfile-template.md     ← Dockerfile şablonları (4 template)
│   └── docker-compose-template.yaml ← docker-compose şablonu
│
├── ci-cd/                         ← Pipeline ve deployment otomasyonu
│   ├── manifest.json              ← CI/CD stack tanımları
│   ├── pipeline-rules.md          ← Pipeline kuralları
│   ├── github-actions-templates.md ← GitHub Actions şablonları (4 template)
│   └── gitlab-ci-template.md      ← GitLab CI şablonu
│
├── monitoring/                    ← Gözlemlenebilirlik (observability)
│   ├── manifest.json              ← Monitoring stack tanımları
│   ├── monitoring-rules.md        ← Monitoring kuralları
│   └── monitoring-templates.md    ← Prometheus + Grafana + Loki şablonları
│
├── networking/                    ← Trafik yönetimi ve güvenlik
│   ├── manifest.json              ← Reverse proxy ve SSL tanımları
│   ├── networking-rules.md        ← Networking kuralları
│   └── networking-templates.md    ← Nginx + Traefik + Caddy şablonları
│
└── secrets/                       ← Gizli veri yönetimi
    ├── manifest.json              ← Secret kategorileri ve kuralları
    ├── secrets-rules.md           ← Secret yönetim kuralları
    └── secrets-templates.md       ← .env.example ve script şablonları
```

## AI İŞ AKIŞI (ADIM ADIM)

### Adım 1: Manifest'leri Oku

AI, önce ana `manifest.json` dosyasını okur ve projeye uygun alt katmanları belirler. Ardından her alt katmanın kendi `manifest.json` dosyasını okur.

```json
// manifest.json → sub_layers içinden seçim yap
// Örnek: fullstack proje → tüm alt katmanlar aktif
// Örnek: frontend-only → docker (frontend), ci-cd (Vercel), monitoring (opsiyonel)
```

### Adım 2: Proje Bağlamını Değerlendir

AI, projenin aşağıdaki özelliklerine göre seçim yapar:

| Bağlam | Seçenekler | Nereden Okunur |
|--------|-----------|----------------|
| Frontend framework | Nuxt.js / Next.js / Astro.js / Static | `docker/manifest.json` → `services.frontend` |
| Backend framework | .NET Web API / Node.js Express | `docker/manifest.json` → `services.backend` |
| Veritabanı | MSSQL / PostgreSQL / MySQL / MariaDB / MongoDB | `docker/manifest.json` → `services.database` |
| Deployment target | Vercel / Azure App Service / Azure Container Apps | `ci-cd/manifest.json` → `deployment_targets` |
| Reverse proxy | Nginx / Traefik / Caddy | `networking/manifest.json` → `reverse_proxy_options` |
| Monitoring stack | Lightweight / Enterprise / ELK | `monitoring/manifest.json` → `stack_options` |
| Secret yönetimi | .env / GitHub Secrets / Azure Key Vault | `secrets/manifest.json` → `secret_management_strategies` |

### Adım 3: Kuralları Kesin Uygula

Her alt katmandaki `*-rules.md` dosyalarındaki ZORUNLU (MUST) kuralları kesinlikle uygula.

**Öncelik sıralaması:**
1. 🔴 **ZORUNLU / ASLA / YASAK:** Kesinlikle uyulması gereken kurallar. İhlal → production'da sorun.
2. 🟡 **ÖNERİLEN:** Best practice. Uyman kuvvetle tavsiye edilir.
3. 🟢 **OPSİYONEL:** Projenin ihtiyacına göre karar ver.

### Adım 4: Template'leri Doldur

`*-templates.md` dosyalarındaki `{PLACEHOLDER}` değerlerini gerçek proje bilgileriyle değiştir.

**En sık kullanılan placeholder'lar:**
- `{PROJECT_NAME}` → kebab-case proje adı (örn: `my-ecommerce-app`)
- `{DOMAIN}` → ana domain (örn: `myapp.com`)
- `{FRONTEND_PORT}` → frontend iç port (genelde `3000`)
- `{BACKEND_PORT}` → backend iç port (genelde `5000` veya `8080`)
- `{ADMIN_EMAIL}` → yönetici email adresi
- `{DB_TYPE}` → veritabanı tipi (postgresql / mssql / mysql)

### Adım 5: Dosyaları Oluştur

Her template'in başında belirtilen dosya yolunu kullanarak çıktıyı projeye yaz.

**Oluşturulacak dosya listesi (full-stack proje için):**
```
proje/
├── Dockerfile                    # docker/dockerfile-template.md'den
├── docker-compose.yaml            # docker/docker-compose-template.yaml'dan
├── .dockerignore                  # ZORUNLU — docker/production-constraints.md'den
├── .github/workflows/
│   ├── ci.yml                    # ci-cd/github-actions-templates.md'den
│   └── deploy-*.yml              # Deployment target'ına göre
├── monitoring/
│   ├── prometheus/prometheus.yml  # monitoring/monitoring-templates.md'den
│   ├── grafana/datasources/       # monitoring/monitoring-templates.md'den
│   └── loki/loki-config.yaml     # monitoring/monitoring-templates.md'den
├── nginx/
│   ├── nginx.conf                 # networking/networking-templates.md'den
│   └── .htpasswd                  # Monitoring için basic auth
├── .env.example                   # secrets/secrets-templates.md'den
├── .gitignore                     # secrets/secrets-rules.md'ye göre güncelle
└── scripts/
    └── generate-secrets.sh        # secrets/secrets-templates.md'den
```

### Adım 6: Tutarlılığı Kontrol Et

Oluşturulan tüm dosyaların birbiriyle tutarlı olduğunu doğrula:

- [ ] docker-compose.yaml'daki port'lar ile nginx.conf'taki upstream port'lar aynı mı?
- [ ] nginx.conf'taki domain ile `.env.example`'daki `DOMAIN` aynı mı?
- [ ] CI/CD'deki build komutu ile Dockerfile'daki build komutu aynı mı?
- [ ] Prometheus targets ile docker-compose'daki servis isimleri eşleşiyor mu?
- [ ] `.env.example`'daki tüm değişkenler docker-compose'da referans edilmiş mi?
- [ ] `.gitignore`'da `.env` ve `.env.*` var mı?
- [ ] Tüm servislerde healthcheck tanımlı mı?
- [ ] Tüm container'lar non-root user ile çalışıyor mu?

## ALT KATMAN ENTEGRASYON NOKTALARI

Alt katmanlar birbirinden bağımsız değildir. Aşağıdaki entegrasyon noktalarına dikkat edilmelidir:

### Docker ↔ Networking
- docker-compose.yaml'daki network tanımları (`app_network`, `db_network`), nginx.conf'taki upstream tanımlarına referans olur
- Nginx container'ı `app_network` üzerinden frontend ve backend ile iletişim kurar

### Docker ↔ Monitoring
- docker-compose.yaml'a Prometheus, Grafana, Loki servisleri eklenir
- Prometheus, diğer servislerin `/metrics` endpoint'lerini scrape eder
- Tüm servisler `app_network` üzerinde olmalıdır

### Docker ↔ Secrets
- docker-compose.yaml'da `${VARIABLE}` syntax ile `.env` dosyasındaki değişkenler referans edilir
- `env_file: .env` ile `.env` dosyası yüklenir
- Production'da secret'lar Docker Secret veya Key Vault'tan gelir

### CI/CD ↔ Secrets
- GitHub Actions workflow'ları `${{ secrets.VARIABLE }}` ile GitHub Secrets'ı okur
- `.env.example`'daki değişkenler CI/CD'de secret olarak tanımlanmalıdır

### CI/CD ↔ Docker
- CI'da build edilen Docker image'ı registry'e push edilir
- CD'de Azure Container Apps veya Docker Compose ile deploy edilir

### Networking ↔ Monitoring
- Monitoring dashboard'u (Grafana) `monitoring.{DOMAIN}` subdomain'inde sunulur
- Nginx, monitoring sunucusuna basic auth ekler

## STACK BAZLI VARSAYILAN SEÇİMLER

AI, proje stack'ine göre aşağıdaki varsayılan seçimleri yapmalıdır (aksi belirtilmedikçe):

| Stack | Docker | CI/CD | Monitoring | Networking | Secrets |
|-------|--------|-------|------------|------------|---------|
| Node.js Static Frontend | Nginx runtime | Vercel | Lightweight | Nginx | .env + GitHub Secrets |
| Node.js SSR Frontend | Node.js SSR | Vercel | Lightweight | Nginx | .env + GitHub Secrets |
| .NET Backend | .NET runtime | Azure App Service | Lightweight | Nginx | .env + Azure Key Vault |
| Full-stack | İki Dockerfile | CI + Vercel + Azure | Lightweight | Nginx | .env + Azure Key Vault |
| Containerized | Multi-stage Docker | Docker Build + Azure Container Apps | Enterprise | Nginx/Traefik | .env + Azure Key Vault |

## YASAKLI İHLALLER (Deal Breakers)

Bunlardan herhangi biri varsa, proje production-ready DEĞİLDİR:

1. ❌ Container root kullanıcı ile çalışıyor
2. ❌ Docker image'ında `:latest` tag'i kullanılmış
3. ❌ Healthcheck tanımlanmamış servis var
4. ❌ `.env` dosyası Git'e commit edilmiş
5. ❌ Secret bir değer kodda hardcoded
6. ❌ Production'da HTTP açık (HTTPS redirect yok)
7. ❌ `.env.example` dosyası yok
8. ❌ `.dockerignore` dosyası yok
9. ❌ CI pipeline'ında test aşaması yok
10. ❌ Production deployment'ı manuel onay olmadan otomatik
11. ❌ Monitoring olmadan production'a çıkılmış
12. ❌ Multi-stage build kullanılmamış

## ÖZET

Bu katman, AI'nın bir projeyi sıfırdan production'a hazır hale getirmesi için gereken tüm altyapı bilgisini içerir. AI, bu katmandaki manifest → rules → templates zincirini takip ederek:

1. Projenin ne olduğunu anlar (manifest)
2. Neyi yapıp neyi yapamayacağını bilir (rules)
3. Çıktıyı doğru formatta üretir (templates)
4. Ürettiği çıktının tutarlı olduğunu kontrol eder (cross-cutting rules)

Her şey tek bir hedefe hizmet eder: **`docker-compose up` dediğinde sistemin production'da olduğu gibi çalışması.**
