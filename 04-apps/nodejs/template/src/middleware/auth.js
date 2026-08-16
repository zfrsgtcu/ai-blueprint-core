<!-- PURPOSE OF THIS FILE: JWT Auth middleware — Authorization: Bearer <token> kontrolü -->
const { verifyToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');

/**
 * JWT Bearer token doğrulaması yapar.
 * Geçerli token → `req.user` nesnesini doldurur.
 * Geçersiz/eksik token → 401 döner.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {boolean} — true ise kimlik doğrulama geçti (next middleware çağrılır)
 */
function authenticate(req, res) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    sendError(res, 401, 'Yetkilendirme başlığı eksik');
    return false;
  }

  try {
    req.user = verifyToken(token);
    return true;
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Token süresi doldu'
      : 'Geçersiz token';
    sendError(res, 401, message);
    return false;
  }
}

module.exports = { authenticate };
