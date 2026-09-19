// Instance unique de PrismaClient (connexion à PostgreSQL / Neon).
// Ne jamais exposer DATABASE_URL ou ce client au frontend.

const { PrismaClient } = require('@prisma/client');
const env = require('./env');

const prisma = new PrismaClient({
  log: env.isProduction ? ['error', 'warn'] : ['error', 'warn', 'query'],
});

async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connexion PostgreSQL (Neon) établie.');
    return true;
  } catch (err) {
    console.error('❌ Échec de connexion à la base de données:', err.message);
    return false;
  }
}

module.exports = { prisma, testConnection };
