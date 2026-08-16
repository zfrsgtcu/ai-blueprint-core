<!-- PURPOSE OF THIS FILE: Ortam değişkenleri — .env dosyasından okuma, varsayılan değerler -->
const path = require('path');
const fs = require('fs');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '..', '.env');
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env dosyası yoksa varsayılan değerleri kullan
  }
}

loadEnv();

module.exports = {
  env: {
    PORT: parseInt(process.env.PORT, 10) || {{PORT}},
    JWT_SECRET: process.env.JWT_SECRET || '{{JWT_SECRET}}',
    NODE_ENV: process.env.NODE_ENV || 'development',
  },
};
