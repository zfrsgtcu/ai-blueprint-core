<!-- PURPOSE OF THIS FILE: CORS middleware — OPTIONS preflight, gerekli header'lar -->
/**
 * CORS middleware. OPTIONS preflight'ı yanıtlar, diğer isteklere header ekler.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {boolean} — true ise istek CORS tarafından sonlandırıldı (OPTIONS)
 */
function handleCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  return false;
}

module.exports = { handleCors };
