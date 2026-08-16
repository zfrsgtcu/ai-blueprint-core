<!--
  BU DOSYANIN AMACI:
  MSSQL'in Docker container'ında doğru yapılandırılmasını, ARM/x64 platform uyumluluğunu ve .NET + Node.js container entegrasyonunu AI'a öğretir.

  İLGİLİ DOSYALAR:
  - 04-frameworks/mssql/config-rules.md
  - 04-frameworks/mssql/best-practices.md
  - 03-infrastructures/docker/
-->

# DOCKER + MSSQL ENTEGRASYONU

## 1. PLATFORM UYARI (ARM vs x64)

**SQL Server'ın resmi Docker image'ı sadece x64/amd64 platformda çalışır.** Apple Silicon (M1/M2/M3) Mac'lerde şu seçenekler var:

```yaml
services:
  mssql:
    image: mcr.microsoft.com/mssql/server:2022-latest
    platform: linux/amd64  # Apple Silicon'da ZORUNLU (emülasyon)
    # VEYA Azure SQL Edge (ARM64 native):
    # image: mcr.microsoft.com/azure-sql-edge:latest
    # platform: linux/arm64
```

## 2. DOCKER COMPOSE (GELİŞTİRME)

```yaml
services:
  mssql:
    image: mcr.microsoft.com/mssql/server:2022-latest
    platform: linux/amd64
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_SA_PASSWORD: ${MSSQL_SA_PASSWORD}  # En az 8 char, büyük+küçük+sayı+özel
      MSSQL_PID: Developer  # Developer/Express/Enterprise
    ports:
      - "1433:1433"
    volumes:
      - mssql_data:/var/opt/mssql
    healthcheck:
      test: /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P ${MSSQL_SA_PASSWORD} -C -Q "SELECT 1"
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s  # MSSQL başlangıcı yavaş, 30s bekle

  # .NET Web API (backend)
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    depends_on:
      mssql:
        condition: service_healthy
    environment:
      ConnectionStrings__Default: Server=mssql,1433;Database=AppDb;User Id=sa;Password=${MSSQL_SA_PASSWORD};TrustServerCertificate=True;

  # Node.js (frontend BFF)
  bff:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    depends_on:
      api:
        condition: service_started
    environment:
      API_URL: http://api:8080
```

## 3. .NET WEB API DOCKERFILE

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY *.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
RUN adduser --system --uid 1001 appuser

COPY --from=build /app ./

USER appuser
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "App.dll"]
```

## 4. CONNECTION STRING (Container'lar Arası)

```ts
// Node.js'ten MSSQL'e:
const config = {
  server: 'mssql',  // Docker Compose servis adı (localhost DEĞİL)
  port: 1433,
  database: 'AppDb',
  user: 'sa',
  password: process.env.MSSQL_SA_PASSWORD,
  options: {
    trustServerCertificate: true,  // Development'ta: self-signed cert
    encrypt: false,                // Container içi iletişimde gerekmez
  },
};
```

## 5. PRODUCTION'DA MSSQL

**Production'da MSSQL'i container'da çalıştırma.** Azure SQL veya yönetilen SQL Server kullan:

```env
# Production connection string:
ConnectionStrings__Default=Server=tcp:myapp.database.windows.net,1433;Database=AppDb;User Id=appuser;Password=${DB_PASSWORD};Encrypt=True;TrustServerCertificate=False;
```

## 6. YAPILMAMASI GEREKENLER

- **Apple Silicon'da `platform: linux/amd64` olmadan çalıştırma** — Container başlamaz
- **SA şifresini zayıf belirleme** — En az 8 karakter, 3/4 karakter grubundan (büyük, küçük, rakam, özel)
- **Production'da `TrustServerCertificate=True`** — Sadece development
- **Container'da `localhost` bağlantısı** — Servis adını kullan
- **MSSQL container'ı 2GB'dan az RAM ile çalıştırma** — Minimum 2GB RAM gerekir
