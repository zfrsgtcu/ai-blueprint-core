<!-- PURPOSE OF THIS FILE: Standart JSON yanıt yardımcıları — sendJson, sendError -->
/**
 * Standart JSON yanıt gönderir.
 * @param {import('http').ServerResponse} res
 * @param {number} statusCode
 * @param {*} data — null ise boş body (204 No Content için)
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  if (data === null || data === undefined) {
    res.end();
  } else {
    res.end(JSON.stringify(data));
  }
}

/**
 * Hata yanıtı gönderir (stack trace içermez).
 * @param {import('http').ServerResponse} res
 * @param {number} statusCode
 * @param {string} message
 */
function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message });
}

module.exports = { sendJson, sendError };
