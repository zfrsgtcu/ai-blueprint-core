<!--
  BU DOSYANIN AMACI:
  AI ajanlarına gizli veri (secrets) yönetimi kurallarını öğretir.
  Environment variables, .env dosyaları, secret manager entegrasyonu ve güvenlik politikalarını kapsar.
  Secret yönetimi, production-ready bir sistemin en kritik güvenlik katmanıdır.
-->

# SECRETS MANAGEMENT RULES

## 1. ALTIN KURALLAR

Bu kurallar ASLA ihlal edilmemelidir:

1. **Secret'lar ASLA kodda (hardcoded) olmaz.** Hiçbir istisna yoktur.
2. **Secret'lar ASLA Git'e commit edilmez.** `.gitignore` bu dosyaları kapsamalıdır.
3. **Secret'lar ASLA loglanmaz.** Log sanitization zorunludur.
4. **Secret'lar ASLA frontend kodunda olmaz.** Client-side kodda secret bulunmaz.
5. **Her ortam için farklı secret seti kullanılır.** Development secret'ı ASLA production'da kullanılmaz.

## 2. .ENV DOSYASI KURALLARI

### 2.1. `.env.example` (ZORUNLU)

HER projede `.env.example` dosyası bulunmalıdır. Bu dosya:
- TÜM gerekli environment variable'ları listeler
- Secret olanlar için **örnek/değer** içerir (gerçek secret DEĞİL)
- Secret olmayanlar için **default değer** içerebilir
- Her değişkenin yanında açıklama bulunur

**Format:**
```bash
# =============================================================================
# UYGULAMA
# =============================================================================
NODE_ENV=production              # Ortam modu (development | staging | production)
PORT=3000                         # Uygulama portu

# =============================================================================
# VERİTABANI
# =============================================================================
DB_SERVER=db                      # Veritabanı sunucu adresi
DB_NAME=myapp                     # Veritabanı adı
DB_USER=myapp_user                # Veritabanı kullanıcı adı
DB_PASSWORD=CHANGE_ME             # !!! BU DEĞERİ DEĞİŞTİRİN - minimum 16 karakter

# =============================================================================
# GÜVENLİK (Secret — Değiştirilmesi Zorunlu)
# =============================================================================
JWT_SECRET=generate-random-32-chars-here  # !!! openssl rand -hex 32 ile oluşturun
ENCRYPTION_KEY=generate-random-32-chars   # !!! openssl rand -hex 32 ile oluşturun

# =============================================================================
# EMAIL
# =============================================================================
SMTP_HOST=smtp.sendgrid.net       # SMTP sunucusu
SMTP_PORT=587                     # SMTP portu
SMTP_USER=apikey                  # SMTP kullanıcı adı
SMTP_PASSWORD=CHANGE_ME           # !!! BU DEĞERİ DEĞİŞTİRİN

# =============================================================================
# GRAFANA
# =============================================================================
GRAFANA_ADMIN_PASSWORD=CHANGE_ME  # !!! Değiştirin - min 12 karakter

# =============================================================================
# EXTERNAL SERVİSLER (Opsiyonel — ihtiyaç varsa)
# =============================================================================
# STRIPE_SECRET_KEY=sk_test_...   # Stripe secret key
# SENTRY_AUTH_TOKEN=...            # Sentry hata takip token'ı
```

### 2.2. `.gitignore` (ZORUNLU)

AI, projeye şu gitignore kurallarını eklemelidir:
```gitignore
# Environment files
.env
.env.local
.env.development
.env.staging
.env.production

# Secrets
*.pem
*.key
*.pfx
secrets.yaml
secrets.yml
credentials.json
*.secret
```

### 2.3. `.env` Yükleme Stratejisi

Her framework/language için doğru yöntem:

| Framework | Yöntem |
|-----------|--------|
| Node.js (Express) | `dotenv` paketi → `require('dotenv').config()` |
| Node.js (Nuxt.js) | `nuxt.config.ts` içinde `runtimeConfig` |
| Node.js (Next.js) | `.env.local` dosyası, `NEXT_PUBLIC_` prefix client-side |
| .NET | `appsettings.json` + `AddEnvironmentVariables()` |
| Docker | `env_file:` veya `environment:` docker-compose |

**Next.js Uyarısı:** Sadece `NEXT_PUBLIC_` ile başlayan değişkenler client-side'a expose edilir. Secret'lar ASLA `NEXT_PUBLIC_` prefix'i almaz!

## 3. PRODUCTION SECRET YÖNETİMİ

### 3.1. Azure Key Vault (.NET Projeleri — Önerilen)

```csharp
// Program.cs
builder.Configuration.AddAzureKeyVault(
    new Uri("https://{vault-name}.vault.azure.net/"),
    new DefaultAzureCredential()
);
```

AI, Key Vault referanslarını şu formatta tanımlamalıdır:
- `@Microsoft.KeyVault(SecretUri=https://{vault-name}.vault.azure.net/secrets/DB-PASSWORD/)`

### 3.2. HashiCorp Vault (Enterprise)

```yaml
# docker-compose vault servisi (development)
vault:
  image: hashicorp/vault:1.17
  cap_add:
    - IPC_LOCK
  environment:
    VAULT_DEV_ROOT_TOKEN_ID: ${VAULT_DEV_TOKEN:-root}
  ports:
    - "8200:8200"
```

### 3.3. GitHub Actions Secret Kullanımı

```yaml
- name: Deploy
  env:
    DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
  run: |
    # Burada secret'lar environment variable olarak kullanılabilir
```

### 3.4. Docker Secret Kullanımı

```yaml
# docker-compose (Docker Swarm modunda)
services:
  backend:
    secrets:
      - db_password
      - jwt_secret

secrets:
  db_password:
    external: true
  jwt_secret:
    external: true
```

## 4. SECRET GENERATION

AI, aşağıdaki komutlarla güvenli secret'lar oluşturma talimatını `.env.example`'a veya setup dokümanına eklemelidir:

```bash
# JWT Secret (64 karakter hex)
openssl rand -hex 32

# Veritabanı şifresi (16+ karakter)
openssl rand -base64 16

# Encryption key (32 byte)
openssl rand -base64 32

# Grafana admin şifresi
openssl rand -base64 12
```

## 5. SECRET ROTASYON POLİTİKASI

| Secret Tipi | Rotasyon Sıklığı | Metod |
|-------------|-----------------|-------|
| JWT Secret | 90 gün | Manuel değişim + deploy |
| Veritabanı şifresi | 90 gün | Key Vault otomatik rotasyon |
| API Key'leri | 180 gün | Servis sağlayıcı panelinden |
| SSL Sertifikası | 90 gün | Let's Encrypt otomatik |
| Encryption Key | 365 gün | Manuel (veri re-encrypt gerekir) |

## 6. YAYGIN HATALAR (AI'NIN KAÇINMASI GEREKENLER)

1. ❌ `.env` dosyasını Git'e commit etmek → `.gitignore`'a ekle, commit'lenmişse hemen geçersiz kıl
2. ❌ Secret'ı kod içinde hardcoded bırakmak → Her zaman environment variable'dan oku
3. ❌ Production secret'ını `.env.example`'a yazmak → Sadece placeholder (CHANGE_ME)
4. ❌ `NEXT_PUBLIC_JWT_SECRET` gibi client-side secret → Asla public prefix ile başlamamalı
5. ❌ Secret'ları log'a yazmak → Log sanitization middleware'i ekle
6. ❌ Zayıf secret kullanmak (admin, password, 123456) → Minimum 16 karakter, random
7. ❌ Aynı secret'ı tüm ortamlarda kullanmak → Her ortam için farklı değer
8. ❌ `.env.example` olmadan proje teslim etmek → Developer onboarding süresini uzatır
9. ❌ Docker image içine `.env` dosyasını COPY etmek → Runtime'da enjekte et (`env_file:` veya `environment:`)
