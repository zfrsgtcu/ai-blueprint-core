<!--
  BU DOSYANIN AMACI:
  AI ajanlarına saf Node.js (http modülü, framework'süz) ile REST API geliştirirken uyması gereken best practice kurallarını öğretir.
  Manuel routing, JWT auth, file-based JSON veritabanı, error handling,
  ve Docker deployment kurallarını kapsar.
-->

# PURE NODE.JS (FRAMEWORK'SÜZ) — BEST PRACTICE RULES

## 1. GENEL PRENSİPLER

Saf Node.js'in temel felsefesi: **Built-in modüllerle, sıfır framework bağımlılığıyla, her şeyin kontrolünü elinde tutan minimal API.**

1. 🔴 **ZORUNLU:** Sadece Node.js built-in modülleri kullan: `http`, `fs`, `path`, `crypto`, `url`, `querystring`.
2. 🔴 **ZORUNLU:** Async/await ile tüm I/O operasyonları — callback kullanma.
3. 🔴 **ZORUNLU:** Router → Handler → Service katman ayrımı.
4. 🔴 **ZORUNLU:** Environment variables `.env` dosyasından manuel olarak yükle.
5. 🟠 **YASAK:** Express, Fastify, Koa, Hapi veya başka bir HTTP framework kullanmak.

## 2. PROJE YAPISI KURALLARI

```
src/
├── index.js              # HTTP server + router bağlama
├── config/
│   └── env.js            # Ortam değişkenleri
├── router.js             # URL routing — method + path → handler
├── handlers/
│   └── {{modelName}}.handler.js  # Route handler (controller)
├── services/
│   └── {{modelName}}.service.js  # İş mantığı
├── middleware/
│   ├── auth.js           # JWT doğrulama
│   ├── bodyParser.js     # JSON body parse
│   └── cors.js           # CORS headers
└── utils/
    ├── response.js       # Standart yanıt yardımcıları
    └── jwt.js            # JWT sign/verify
data/
└── {{model_names}}.json   # File-based veritabanı
```

1. 🔴 **ZORUNLU:** Bu dizin yapısına sadık kal.
2. 🔴 **ZORUNLU:** `src/index.js` — HTTP server oluşturma, middleware chain, router.
3. 🟡 **ÖNERİLEN:** Her domain entity'si için ayrı handler ve service dosyası.

## 3. HTTP SERVER KURALLARI

```javascript
// src/index.js — STANDART YAPI
const http = require('http');
const { env } = require('./config/env');
const { parseBody } = require('./middleware/bodyParser');
const { handleCors } = require('./middleware/cors');
const { router } = require('./router');

const server = http.createServer(async (req, res) => {
  // CORS
  if (handleCors(req, res)) return;

  // Body parse (POST/PUT/PATCH)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      req.body = await parseBody(req);
    } catch (err) {
      return sendJson(res, 400, { error: 'Invalid JSON body' });
    }
  }

  // Route
  try {
    await router(req, res);
  } catch (err) {
    console.error('Unhandled error:', err);
    sendJson(res, 500, { error: 'Internal server error' });
  }
});

server.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
```

1. 🔴 **ZORUNLU:** `http.createServer()` ile server oluştur.
2. 🔴 **ZORUNLU:** Request pipeline: CORS → Body Parse → Auth (varsa) → Router → Error Handler.
3. 🔴 **ZORUNLU:** Tüm handler'lar try-catch içinde, hata durumunda standart yanıt.
4. 🔴 **ZORUNLU:** Sunucu `server.listen(PORT)` ile başlat, callback'te log.

## 4. MANUEL ROUTING KURALLARI

```javascript
// src/router.js — STANDART YAPI
const { sendJson } = require('./utils/response');

// Route map: { method, pattern, handler }
const routes = [];

function addRoute(method, pattern, handler) {
  routes.push({ method: method.toUpperCase(), pattern, handler });
}

// URL pattern → { path, params }
function matchRoute(method, url) {
  const parsed = new URL(url, 'http://localhost');
  const path = parsed.pathname;

  for (const route of routes) {
    if (route.method !== method) continue;

    // Dinamik :param eşleştirme
    const patternParts = route.pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) continue;

    const params = {};
    let matched = true;

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        matched = false;
        break;
      }
    }

    if (matched) return { handler: route.handler, params };
  }

  return null;
}

async function router(req, res) {
  const { url, method } = req;
  const match = matchRoute(method, url);

  if (!match) {
    return sendJson(res, 404, { error: 'Not found' });
  }

  req.params = match.params;
  await match.handler(req, res);
}

module.exports = { addRoute, router };
```

1. 🔴 **ZORUNLU:** URL path'ten parametre çıkarmak için `:` prefix pattern'i: `/api/{{model_names}}/:id`.
2. 🔴 **ZORUNLU:** Method + path eşleşmezse 404.
3. 🔴 **ZORUNLU:** `req.params` objesine çıkarılan parametreleri ekle.
4. 🟡 **ÖNERİLEN:** Route'lar bir index dosyasında toplu kaydedilsin.

## 5. JWT AUTHENTICATION KURALLARI

1. 🔴 **ZORUNLU:** `jsonwebtoken` npm paketi (tek istisnai bağımlılık).
2. 🔴 **ZORUNLU:** Auth middleware `req.headers.authorization` Bearer token'ı doğrulamalı.
3. 🔴 **ZORUNLU:** Doğrulanan kullanıcı `req.user`'a eklenmeli.
4. 🔴 **ZORUNLU:** JWT secret en az 256-bit, `.env`'den okunmalı.

```javascript
// src/middleware/auth.js
const { verifyToken } = require('../utils/jwt');
const { sendJson } = require('../utils/response');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendJson(res, 401, { error: 'Token gerekli' });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return sendJson(res, 401, { error: 'Geçersiz veya süresi dolmuş token' });
  }
}

module.exports = { authenticate };
```

## 6. HANDLER KURALLARI

```javascript
// src/handlers/{{modelName}}.handler.js — STANDART YAPI
const {{modelName}}Service = require('../services/{{modelName}}.service');
const { authenticate } = require('../middleware/auth');
const { sendJson, parseId } = require('../utils/response');

async function getAll(req, res) {
  const items = await {{modelName}}Service.getAll();
  sendJson(res, 200, items);
}

async function getById(req, res) {
  const id = req.params.id;
  const item = await {{modelName}}Service.getById(id);
  if (!item) return sendJson(res, 404, { error: 'Not found' });
  sendJson(res, 200, item);
}

async function create(req, res) {
  if (!req.body || !req.body.name) {
    return sendJson(res, 400, { error: 'name alanı zorunlu' });
  }
  const item = await {{modelName}}Service.create(req.body);
  sendJson(res, 201, item);
}

async function update(req, res) {
  const id = req.params.id;
  const updated = await {{modelName}}Service.update(id, req.body);
  if (!updated) return sendJson(res, 404, { error: 'Not found' });
  sendJson(res, 200, updated);
}

async function remove(req, res) {
  const id = req.params.id;
  const deleted = await {{modelName}}Service.remove(id);
  if (!deleted) return sendJson(res, 404, { error: 'Not found' });
  sendJson(res, 204, null);
}

module.exports = { getAll, getById, create, update, remove };
```

1. 🔴 **ZORUNLU:** Her handler sadece HTTP istek/yanıt yönetir, iş mantığı service'te.
2. 🔴 **ZORUNLU:** `sendJson(res, statusCode, data)` utility'si ile standart JSON yanıt.
3. 🔴 **ZORUNLU:** POST/PUT handler'ları body validasyonu yapmalı.

## 7. FILE-BASED VERİTABANI KURALLARI

1. 🔴 **ZORUNLU:** Her entity için `data/{{model_names}}.json` dosyası.
2. 🔴 **ZORUNLU:** `fs.promises.readFile` / `fs.promises.writeFile` ile async okuma/yazma.
3. 🔴 **ZORUNLU:** Write işlemlerinde race condition önlemi (basit kilit veya write queue).
4. 🟡 **ÖNERİLEN:** UUID (`crypto.randomUUID()`) ile ID oluşturma.

```javascript
// src/services/{{modelName}}.service.js
const { promises: fs } = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', '{{model_names}}.json');

async function readData() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function getAll() {
  return readData();
}

async function getById(id) {
  const items = await readData();
  return items.find((i) => i.id === id) || null;
}

async function create(dto) {
  const items = await readData();
  const newItem = {
    id: crypto.randomUUID(),
    ...dto,
    createdAt: new Date().toISOString(),
  };
  items.push(newItem);
  await writeData(items);
  return newItem;
}

async function update(id, dto) {
  const items = await readData();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...dto, updatedAt: new Date().toISOString() };
  await writeData(items);
  return items[idx];
}

async function remove(id) {
  const items = await readData();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  await writeData(items);
  return true;
}

module.exports = { getAll, getById, create, update, remove };
```

## 8. GÜVENLİK KURALLARI

1. 🔴 **ZORUNLU:** CORS middleware — belirli origin'ler, wildcard yok.
2. 🔴 **ZORUNLU:** Input validasyonu — name, description gibi alanlar boş/zorunlu kontrolü.
3. 🔴 **ZORUNLU:** Error response'ları stack trace içermemeli (production'da).
4. 🟠 **YASAK:** `eval()`, `new Function()`, `child_process.exec()` ile kullanıcı girdisi.

## 9. DEPLOYMENT KURALLARI

1. 🔴 **ZORUNLU:** `node src/index.js` ile başlat. PM2 veya Docker container.
2. 🔴 **ZORUNLU:** Health check endpoint: `GET /health → { status: 'ok' }`.
3. 🔴 **ZORUNLU:** `process.env.PORT` varsayılan 3000.
4. 🟡 **ÖNERİLEN:** `Dockerfile` ile containerize et, Azure Container Apps'e deploy.

## 10. YAYGIN HATALAR (AI'NIN KAÇINMASI GEREKENLER)

1. ❌ **Express veya başka framework kullanmak** — saf Node.js http modülü şart.
2. ❌ **Callback pattern kullanmak** — async/await + try-catch kullan.
3. ❌ **req.body'yi bodyParser olmadan okumaya çalışmak** — POST body'si stream'dir, manuel parse gerekir.
4. ❌ **JSON parse hatasını yakalamamak** — bozuk body 400 ile yanıtlanmalı.
5. ❌ **CORS header'larını eklememek** — tarayıcıdan gelen istekler bloke olur.
6. ❌ **fs.readFileSync kullanmak** — event loop'u bloklar, async sürümü kullan.
7. ❌ **Hataları log'lamayı unutmak** — her catch'te console.error.

## 11. DİZİN YAPISI KONTROL LİSTESİ

AI, oluşturduğu Pure Node.js projesinde şunları kontrol etmelidir:

- [ ] `src/index.js` mevcut — `http.createServer` + middleware chain + router
- [ ] `src/config/env.js` mevcut — .env'den ortam değişkenleri
- [ ] `src/router.js` mevcut — method + path → handler eşleştirme
- [ ] `src/handlers/` klasörü mevcut — route handler'lar
- [ ] `src/services/` klasörü mevcut — iş mantığı
- [ ] `src/middleware/auth.js` mevcut — JWT doğrulama
- [ ] `src/middleware/bodyParser.js` mevcut — JSON body parse
- [ ] `src/middleware/cors.js` mevcut — CORS headers
- [ ] `src/utils/response.js` mevcut — `sendJson(res, status, data)`
- [ ] `src/utils/jwt.js` mevcut — JWT sign/verify
- [ ] `data/` klasörü mevcut — JSON veritabanı dosyaları
- [ ] `package.json`'da minimum bağımlılık (sadece jsonwebtoken)
- [ ] `.env.example` mevcut
- [ ] Tüm handler'larda try-catch
- [ ] `GET /health` endpoint'i mevcut
