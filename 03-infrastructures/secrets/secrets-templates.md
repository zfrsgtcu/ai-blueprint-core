<!--
  BU DOSYANIN AMACI:
  AI ajanlarına .env.example şablonları ve secret yönetim script'leri sunar.
  AI, projenin stack'ine göre uygun şablonu seçer ve .env.example dosyasını oluşturur.
  Tüm {PLACEHOLDER} değerleri AI tarafından gerçek proje değerleriyle değiştirilir.
-->

# SECRETS TEMPLATES

## Template 1: `.env.example` (Full-Stack Proje — Nginx + Frontend + Backend + DB + Monitoring)

Dosya yolu: `.env.example`

```bash
# =============================================================================
# {PROJECT_NAME} — Environment Variables
# =============================================================================
# Bu dosya Git'e commit edilir (örnek değerler içerir).
# Gerçek secret'lar için `.env` dosyası oluşturun (Git'e commit EDİLMEZ).
#
# Yeni geliştirici kurulumu:
#   1. cp .env.example .env
#   2. .env dosyasındaki CHANGE_ME değerlerini güvenli değerlerle değiştirin
#   3. Secret generation komutları:
#      - JWT_SECRET:    openssl rand -hex 32
#      - DB_PASSWORD:   openssl rand -base64 16
#      - ENCRYPTION_KEY: openssl rand -base64 32
# =============================================================================

# =============================================================================
# ORTAM
# =============================================================================
NODE_ENV=production
ASPNETCORE_ENVIRONMENT=Production

# =============================================================================
# DOMAIN & NETWORKING
# =============================================================================
DOMAIN={DOMAIN}
ADMIN_EMAIL={ADMIN_EMAIL}
FRONTEND_PORT={FRONTEND_PORT}
BACKEND_PORT={BACKEND_PORT}

# =============================================================================
# VERİTABANI ({DB_TYPE})
# =============================================================================
DB_SERVER=db
DB_NAME={PROJECT_NAME}
DB_USER={PROJECT_NAME}_user
DB_PASSWORD=CHANGE_ME
# Bağlantı string'i (backend tarafından otomatik oluşturulur):
# {DB_TYPE}://{DB_USER}:{DB_PASSWORD}@{DB_SERVER}:{DB_PORT}/{DB_NAME}

# =============================================================================
# REDIS (Opsiyonel)
# =============================================================================
# REDIS_PASSWORD=CHANGE_ME

# =============================================================================
# GÜVENLİK
# =============================================================================
JWT_SECRET=CHANGE_ME
ENCRYPTION_KEY=CHANGE_ME
SESSION_SECRET=CHANGE_ME

# =============================================================================
# EMAIL
# =============================================================================
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=CHANGE_ME

# =============================================================================
# MONITORING
# =============================================================================
GRAFANA_ADMIN_PASSWORD=CHANGE_ME

# =============================================================================
# ALERTING (Opsiyonel — en az birini doldurun)
# =============================================================================
# SLACK_WEBHOOK_URL=
# DISCORD_WEBHOOK_URL=
# TEAMS_WEBHOOK_URL=
# ALERT_EMAIL=

# =============================================================================
# DEPLOYMENT ({DEPLOYMENT_TARGET})
# =============================================================================
# VERCEL_TOKEN=                   # Vercel deployment (frontend)
# AZURE_CLIENT_ID=                # Azure service principal
# AZURE_CLIENT_SECRET=            # Azure service principal secret
# AZURE_TENANT_ID=                # Azure tenant
# AZURE_SUBSCRIPTION_ID=          # Azure subscription
# REGISTRY_USERNAME=              # Container registry
# REGISTRY_PASSWORD=              # Container registry password
```

---

## Template 2: `.env.example` — Node.js Frontend Only (Vercel Deploy)

Dosya yolu: `frontend/.env.example`

```bash
# =============================================================================
# {PROJECT_NAME} Frontend
# =============================================================================
NODE_ENV=production

# API URL (backend adresi)
NEXT_PUBLIC_API_URL=https://api.{DOMAIN}

# Site URL
NEXT_PUBLIC_SITE_URL=https://{DOMAIN}

# =============================================================================
# UYARI: Aşağıdaki değişkenlerin başına ASLA NEXT_PUBLIC_ getirilmez!
# =============================================================================
# JWT_SECRET=CHANGE_ME            # SSR/API routes için JWT
# API_KEY=CHANGE_ME               # Backend'e istek atarken API anahtarı
```

---

## Template 3: `.env.example` — .NET Backend Only

Dosya yolu: `backend/.env.example`

```bash
# =============================================================================
# {PROJECT_NAME} Backend (.NET)
# =============================================================================
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:{BACKEND_PORT}

# Veritabanı
DB_SERVER=db
DB_NAME={PROJECT_NAME}
DB_USER={PROJECT_NAME}_user
DB_PASSWORD=CHANGE_ME

# Güvenlik
JWT_SECRET=CHANGE_ME
ENCRYPTION_KEY=CHANGE_ME

# CORS — İzin verilen origin'ler (virgülle ayrılmış)
CORS_ORIGINS=https://{DOMAIN}

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=CHANGE_ME

# Azure Key Vault (Production)
# AZURE_KEY_VAULT_URI=https://{PROJECT_NAME}-kv.vault.azure.net/
```

---

## Template 4: Secret Generation Script

Dosya yolu: `scripts/generate-secrets.sh`

```bash
#!/bin/bash
# =============================================================================
# Secret Generation Script
# Bu script güvenli random secret'lar üretir ve .env dosyasına yazar.
#
# Kullanım: bash scripts/generate-secrets.sh
# =============================================================================

set -euo pipefail

ENV_FILE=".env"
BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"

# Renk çıktıları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  {PROJECT_NAME} — Secret Generator${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# Mevcut .env varsa yedekle
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$BACKUP_FILE"
    echo -e "${YELLOW}Mevcut .env yedeklendi: $BACKUP_FILE${NC}"
    echo ""
fi

# .env.example'dan kopyala
if [ -f ".env.example" ]; then
    cp .env.example "$ENV_FILE"
    echo -e "${GREEN}.env.example'dan .env oluşturuldu.${NC}"
else
    echo -e "${RED}HATA: .env.example bulunamadı!${NC}"
    exit 1
fi

# Secret generation fonksiyonu
generate_secret() {
    local key=$1
    local length=$2
    local value

    case $length in
        64) value=$(openssl rand -hex 32) ;;       # 32 byte = 64 hex
        32) value=$(openssl rand -base64 24) ;;    # 24 byte = 32 base64
        24) value=$(openssl rand -base64 16) ;;    # 16 byte = 24 base64
        *)  value=$(openssl rand -base64 "$length") ;;
    esac

    # Linux ve macOS uyumlu sed
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/^${key}=CHANGE_ME/${key}=${value}/" "$ENV_FILE"
    else
        sed -i "s/^${key}=CHANGE_ME/${key}=${value}/" "$ENV_FILE"
    fi

    echo -e "  ✓ ${key} → ${YELLOW}${value}${NC}"
}

echo "Secret'lar oluşturuluyor..."
echo ""

# Veritabanı şifresi
generate_secret "DB_PASSWORD" 24

# JWT Secret
generate_secret "JWT_SECRET" 64

# Encryption Anahtarı
generate_secret "ENCRYPTION_KEY" 32

# Session Secret
generate_secret "SESSION_SECRET" 32

# Grafana şifresi
generate_secret "GRAFANA_ADMIN_PASSWORD" 24

# SMTP şifresi (varsa)
if grep -q "^SMTP_PASSWORD=CHANGE_ME" "$ENV_FILE" 2>/dev/null; then
    generate_secret "SMTP_PASSWORD" 16
fi

# Redis şifresi (varsa)
if grep -q "^REDIS_PASSWORD=CHANGE_ME" "$ENV_FILE" 2>/dev/null; then
    generate_secret "REDIS_PASSWORD" 24
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Secret'lar başarıyla oluşturuldu!${NC}"
echo -e "${GREEN}  Dosya: ${ENV_FILE}${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}UYARILAR:${NC}"
echo "  • .env dosyası ASLA Git'e commit edilmez"
echo "  • Production secret'ları için Azure Key Vault / HashiCorp Vault kullanın"
echo "  • Bu secret'ları güvenli bir şifre yöneticisinde saklayın"
echo "  • Secret'ları 90 günde bir rotasyonlayın"
echo ""
```

---

## Template 5: Azure Key Vault Setup Script

Dosya yolu: `scripts/setup-keyvault.sh`

```bash
#!/bin/bash
# =============================================================================
# Azure Key Vault Setup Script
# Production secret'larını Azure Key Vault'a yükler.
#
# Gereksinimler:
#   - Azure CLI kurulu ve login olunmuş (az login)
#   - Key Vault Contributor rolü
#
# Kullanım: bash scripts/setup-keyvault.sh
# =============================================================================

set -euo pipefail

VAULT_NAME="{PROJECT_NAME}-kv"
RESOURCE_GROUP="{RESOURCE_GROUP}"
LOCATION="westeurope"

echo "Azure Key Vault oluşturuluyor: $VAULT_NAME..."

# Key Vault oluştur
az keyvault create \
    --name "$VAULT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --enable-rbac-authorization \
    --output none

echo "Key Vault oluşturuldu."

# Secret'ları yükle (.env dosyasından oku — INTERAKTİF DEĞİL, CI/CD'den çalışır)
# Bu kısım CI/CD pipeline'ında kullanılır, lokal geliştirmede .env yeterlidir.

echo ""
echo "Secret'ları yüklemek için:"
echo "  az keyvault secret set --vault-name $VAULT_NAME --name DB-PASSWORD --value \"\$DB_PASSWORD\""
echo "  az keyvault secret set --vault-name $VAULT_NAME --name JWT-SECRET --value \"\$JWT_SECRET\""
echo "  az keyvault secret set --vault-name $VAULT_NAME --name ENCRYPTION-KEY --value \"\$ENCRYPTION_KEY\""
```

---

## AI KULLANIM KURALLARI

1. Her projede `.env.example` dosyası ZORUNLUDUR. İstisna yoktur.

2. Proje tipine göre doğru template'i seç:
   - **Full-stack:** Template 1 (tüm servisleri kapsayan)
   - **Frontend-only (Vercel):** Template 2
   - **Backend-only (.NET):** Template 3

3. `.env.example`'da:
   - Gerçek secret değerleri yerine `CHANGE_ME` yaz
   - Her değişken için yorum satırı ekle
   - Kategorileri `# ====` ile ayır
   - Secret olmayan değişkenler için default değer ver

4. `.gitignore`'a gerekli kuralları ekle (`.env`, `.env.*`, `*.pem`, `*.key`, vb.)

5. `scripts/generate-secrets.sh` script'ini projeye ekle (geliştirici onboarding için).

6. Production deployment için secret yönetim stratejisini dokümantasyonda belirt.

7. Dizin yapısı:
   ```
   secrets/
   └── (manifest ve template'ler bu repoda — gerçek .env dosyaları projede,
        Git'e commit EDİLMEZ)
   ```
