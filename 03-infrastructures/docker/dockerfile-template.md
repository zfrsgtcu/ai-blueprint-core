<!--
  BU DOSYANIN AMACI:
  AI ajanlarına Dockerfile şablonları sunar. Her infrastructure (astrojs, nuxtjs, netwebapi vb.)
  için optimize edilmiş multi-stage Dockerfile şablonları içerir.
  AI, projenin infrastructure tipine göre uygun şablonu seçip özelleştirir.
-->

# DOCKERFILE TEMPLATES

## Template 1: Node.js Frontend (Astro.js / Nuxt.js / Next.js / React / Vue — SSR)

```dockerfile
# Stage 1: Build
FROM node:20.11-alpine AS build
WORKDIR /app

# Bağımlılık dosyalarını kopyala (layer caching)
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Bağımlılıkları yükle (production hariç, devDependencies build için gerekli)
RUN npm ci

# Kaynak kodu kopyala
COPY . .

# Build al
RUN npm run build

# Stage 2: Production Runtime
FROM node:20.11-alpine AS runtime
WORKDIR /app

# Non-root kullanıcı
USER node

# Sadece production bağımlılıkları ve build çıktısını kopyala
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.output ./.output
COPY --from=build --chown=node:node /app/package.json ./

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", ".output/server/index.mjs"]
```

## Template 2: .NET Web API Backend

```dockerfile
# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# .csproj dosyalarını kopyala (layer caching)
COPY ["src/{ProjectName}/{ProjectName}.csproj", "src/{ProjectName}/"]
RUN dotnet restore "src/{ProjectName}/{ProjectName}.csproj"

# Kaynak kodu kopyala
COPY . .

# Publish
WORKDIR "/src/src/{ProjectName}"
RUN dotnet publish "{ProjectName}.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Non-root kullanıcı oluştur
RUN adduser --disabled-password app && chown -R app:app /app
USER app

COPY --from=build --chown=app:app /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "{ProjectName}.dll"]
```

## Template 3: Node.js Frontend — Static Export (Astro.js / React / Vue — SPA)

```dockerfile
# Stage 1: Build
FROM node:20.11-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Nginx Runtime
FROM nginx:1.27-alpine AS runtime

# Nginx konfigürasyonu
COPY nginx.conf /etc/nginx/nginx.conf

# Build çıktısını Nginx serve dizinine kopyala
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

## Template 4: Node.js Express Backend

```dockerfile
# Stage 1: Build (derleme gerekiyorsa)
FROM node:20.11-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
# TypeScript derlemesi varsa:
RUN npm run build

# Stage 2: Production Runtime
FROM node:20.11-alpine AS runtime
WORKDIR /app

USER node

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
```

## AI KULLANIM KURALLARI

1. `{ProjectName}` placeholder'ını gerçek proje adıyla değiştir.
2. Frontend framework'üne göre doğru template'i seç:
   - SSR yapıyorsa (Nuxt.js, Next.js) → Template 1
   - Static export yapıyorsa (Astro static, React SPA, Vue SPA) → Template 3
3. `.csproj` yolu proje yapısına göre ayarlanmalıdır.
4. Production'da `npm ci` kullan, ASLA `npm install` kullanma (package-lock.json'a sadık kal).
5. Node.js projelerinde `package-lock.json` yoksa template'i oluşturma — önce `npm install` ile lock file oluştur.
