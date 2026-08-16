<!-- PURPOSE OF THIS FILE: Router — HTTP method + URL path'i handler fonksiyonuna eşleştirir -->
const { sendError } = require('../utils/response');
const {{modelName}}Handler = require('../handlers/{{modelName}}.handler');

/**
 * Basit regex tabanlı URL router.
 * Her route `{ method, pattern, handler }` yapısındadır.
 * Dinamik segmentler `:param` formatında path'te tanımlanır, `req.params` ile erişilir.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
async function routeRequest(req, res) {
  const { method, url } = req;

  // URL'den query string'i ayır
  const questionIndex = url.indexOf('?');
  const path = questionIndex === -1 ? url : url.slice(0, questionIndex);

  // Route tanımları — sıralı eşleştirme, ilk eşleşen kazanır
  const routes = [
    // {{ModelName}} CRUD
    { method: 'GET',    pattern: /^\/api\/{{model_names}}$/,                handler: {{modelName}}Handler.getAll },
    { method: 'GET',    pattern: /^\/api\/{{model_names}}\/([^/]+)$/,        handler: {{modelName}}Handler.getById },
    { method: 'POST',   pattern: /^\/api\/{{model_names}}$/,                handler: {{modelName}}Handler.create },
    { method: 'PUT',    pattern: /^\/api\/{{model_names}}\/([^/]+)$/,        handler: {{modelName}}Handler.update },
    { method: 'PATCH',  pattern: /^\/api\/{{model_names}}\/([^/]+)$/,        handler: {{modelName}}Handler.patch },
    { method: 'DELETE', pattern: /^\/api\/{{model_names}}\/([^/]+)$/,        handler: {{modelName}}Handler.remove },
  ];

  for (const route of routes) {
    if (route.method !== method) continue;

    const match = path.match(route.pattern);
    if (match) {
      req.params = match.slice(1);
      await route.handler(req, res);
      return;
    }
  }

  // Hiçbir route eşleşmedi
  sendError(res, 404, 'Bulunamadı');
}

module.exports = { routeRequest };
