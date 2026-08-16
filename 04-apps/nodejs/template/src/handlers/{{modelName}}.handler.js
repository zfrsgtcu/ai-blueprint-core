<!-- PURPOSE OF THIS FILE: {{ModelName}} handler — HTTP isteklerini service katmanına iletir, yanıt formatını standartlaştırır -->
const { sendJson, sendError } = require('../utils/response');
const {{modelName}}Service = require('../services/{{modelName}}.service');

const {{modelName}}Handler = {
  /**
   * GET /api/{{model_names}}
   * Query: ?page=1&limit=10
   */
  async getAll(req, res) {
    try {
      const query = parseQuery(req);
      const page = parseInt(query.page, 10) || 1;
      const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
      const result = await {{modelName}}Service.findAll(page, limit);
      sendJson(res, 200, result);
    } catch (err) {
      sendError(res, 500, 'Liste alınırken hata oluştu');
    }
  },

  /**
   * GET /api/{{model_names}}/:id
   */
  async getById(req, res) {
    try {
      const item = await {{modelName}}Service.findById(req.params[0]);
      if (!item) return sendError(res, 404, 'Kayıt bulunamadı');
      sendJson(res, 200, item);
    } catch (err) {
      sendError(res, 500, 'Kayıt getirilirken hata oluştu');
    }
  },

  /**
   * POST /api/{{model_names}}
   * Body: create DTO
   */
  async create(req, res) {
    try {
      const item = await {{modelName}}Service.create(req.body);
      sendJson(res, 201, item);
    } catch (err) {
      if (err.message.startsWith('VALIDATION:')) {
        return sendError(res, 400, err.message.slice('VALIDATION:'.length).trim());
      }
      sendError(res, 500, 'Kayıt oluşturulurken hata oluştu');
    }
  },

  /**
   * PUT /api/{{model_names}}/:id
   * Body: tam update DTO
   */
  async update(req, res) {
    try {
      const item = await {{modelName}}Service.update(req.params[0], req.body);
      if (!item) return sendError(res, 404, 'Kayıt bulunamadı');
      sendJson(res, 200, item);
    } catch (err) {
      if (err.message.startsWith('VALIDATION:')) {
        return sendError(res, 400, err.message.slice('VALIDATION:'.length).trim());
      }
      sendError(res, 500, 'Kayıt güncellenirken hata oluştu');
    }
  },

  /**
   * PATCH /api/{{model_names}}/:id
   * Body: kısmi update DTO
   */
  async patch(req, res) {
    try {
      const item = await {{modelName}}Service.patch(req.params[0], req.body);
      if (!item) return sendError(res, 404, 'Kayıt bulunamadı');
      sendJson(res, 200, item);
    } catch (err) {
      if (err.message.startsWith('VALIDATION:')) {
        return sendError(res, 400, err.message.slice('VALIDATION:'.length).trim());
      }
      sendError(res, 500, 'Kayıt güncellenirken hata oluştu');
    }
  },

  /**
   * DELETE /api/{{model_names}}/:id
   */
  async remove(req, res) {
    try {
      const deleted = await {{modelName}}Service.remove(req.params[0]);
      if (!deleted) return sendError(res, 404, 'Kayıt bulunamadı');
      sendJson(res, 200, { success: true });
    } catch (err) {
      sendError(res, 500, 'Kayıt silinirken hata oluştu');
    }
  },
};

/**
 * URL query string'ini parse eder.
 * @param {import('http').IncomingMessage} req
 * @returns {Record<string, string>}
 */
function parseQuery(req) {
  const idx = req.url.indexOf('?');
  if (idx === -1) return {};
  const qs = req.url.slice(idx + 1);
  const params = {};
  for (const part of qs.split('&')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    params[decodeURIComponent(part.slice(0, eq))] = decodeURIComponent(part.slice(eq + 1));
  }
  return params;
}

module.exports = {{modelName}}Handler;
