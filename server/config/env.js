// Charge et valide les variables d'environnement.
// Centralise l'accès à process.env pour ne jamais l'utiliser directement ailleurs.

require('dotenv').config();

const required = ['DATABASE_URL', 'SESSION_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    // En développement on avertit seulement, en production on bloque le démarrage.
    const message = `Variable d'environnement manquante: ${key}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    } else {
      console.warn(`⚠️  ${message} (voir .env.example)`);
    }
  }
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  appUrl: process.env.APP_URL || 'http://localhost:3000',

  databaseUrl: process.env.DATABASE_URL,

  sessionSecret: process.env.SESSION_SECRET || 'dev_secret_change_me',

  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || null,
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.MAIL_FROM || 'HAPHAK 2026 <no-reply@example.com>',
  },

  loginMaxAttempts: parseInt(process.env.LOGIN_MAX_ATTEMPTS, 10) || 5,
};
