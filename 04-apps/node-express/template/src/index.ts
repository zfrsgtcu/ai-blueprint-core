// {{ProjectName}} — Uygulama Giriş Noktası
// Express app oluşturma, middleware kaydı, route bağlama ve sunucu başlatma.
// AI: Yeni route eklendikçe burada app.use() ile kaydet.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Route import'ları
// AI: Her domain entity'si için route import et
// import {{modelName}}Routes from './routes/{{modelName}}s';

const app = express();

// === GÜVENLİK MIDDLEWARE'LERİ ===
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// === BODY PARSING ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// === HEALTH CHECK ===
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === ROUTE'LAR ===
// AI: Domain entity'lerine göre route kayıtlarını buraya ekle
// app.use('/api/{{model_names}}', {{modelName}}Routes);

// === GLOBAL ERROR HANDLER (EN SONDA) ===
app.use(errorHandler);

// === SUNUCU BAŞLATMA ===
app.listen(env.PORT, () => {
  console.log(`🚀 {{ProjectName}} ${env.NODE_ENV} modunda ${env.PORT} portunda çalışıyor`);
});

export default app;
