// {{ProjectName}} — Environment Variable Doğrulama
// Tüm env değişkenleri Zod ile doğrulanır. process.env direkt kullanılmaz.
// AI: Projeye özel env değişkenlerini buraya ekle.
// Örnek: SMTP_HOST, REDIS_URL, AZURE_STORAGE_CONNECTION vb.

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Veritabanı
  DATABASE_URL: z.string().min(1),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret en az 32 karakter olmalı'),
  JWT_EXPIRES_IN: z.string().default('15m'),

  // Frontend (CORS)
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Geçersiz environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
