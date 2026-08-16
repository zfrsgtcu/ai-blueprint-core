<!-- PURPOSE OF THIS FILE: Body parser middleware — gelen istek gövdesini JSON olarak parse eder -->
/**
 * Gelen `req` stream'ini okuyup JSON parse eder ve `req.body`'ye atar.
 * Content-Type: application/json olmayan isteklerde boş nesne atar.
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<void>}
 */
function parseBody(req) {
  return new Promise((resolve) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      req.body = {};
      return resolve();
    }

    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        req.body = raw ? JSON.parse(raw) : {};
      } catch {
        req.body = {};
      }
      resolve();
    });
  });
}

module.exports = { parseBody };
