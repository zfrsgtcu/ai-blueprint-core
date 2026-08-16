<!-- PURPOSE OF THIS FILE: HTTP sunucu giriş noktası — middleware zinciri, router entegrasyonu -->
const http = require('http');
const { env } = require('./config/env');
const { handleCors } = require('./middleware/cors');
const { parseBody } = require('./middleware/bodyParser');
const { authenticate } = require('./middleware/auth');
const { routeRequest } = require('./router');
const { sendError } = require('./utils/response');

/**
 * Kimlik doğrulama GEREKTİRMEYEN endpoint'lerin path listesi.
 * Bu path'lerde auth middleware atlanır.
 */
const PUBLIC_PATHS = [
  /^\/api\/auth\//,
  /^\/health$/,
];

/**
 * Bir path'in public olup olmadığını kontrol eder.
 * @param {string} path
 * @returns {boolean}
 */
function isPublicPath(path) {
  return PUBLIC_PATHS.some((pattern) => pattern.test(path));
}

const server = http.createServer(async (req, res) => {
  try {
    // 1. CORS — OPTIONS ise burada sonlanır
    if (handleCors(req, res)) return;

    // 2. Body parse — tüm istekler için (GET hariç)
    if (req.method !== 'GET') {
      await parseBody(req);
    }

    // URL'den path'i çıkar
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const path = url.pathname;

    // 3. Auth — public path'ler hariç
    if (!isPublicPath(path)) {
      if (!authenticate(req, res)) return;
    }

    // 4. Router — isteği ilgili handler'a yönlendir
    // path'i req'e ekle ki router kullanabilsin
    req.parsedUrl = { path, query: Object.fromEntries(url.searchParams) };
    await routeRequest(req, res);

  } catch (err) {
    console.error('Sunucu hatası:', err);
    if (!res.headersSent) {
      sendError(res, 500, 'Beklenmeyen sunucu hatası');
    }
  }
});

server.listen(env.PORT, () => {
  console.log(`{{ProjectName}} sunucusu http://localhost:${env.PORT} adresinde çalışıyor`);
  console.log(`Ortam: ${env.NODE_ENV}`);
});
