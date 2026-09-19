const app = require('./app');
const env = require('./config/env');
const { prisma, testConnection } = require('./config/database');

async function start() {
  await testConnection();

  const server = app.listen(env.port, () => {
    console.log(`\n  HAPHAK 2026 — serveur démarré`);
    console.log(`  Environnement : ${env.nodeEnv}`);
    console.log(`  URL           : ${env.appUrl}`);
    console.log(`  Administration: ${env.appUrl}/admin/login\n`);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} reçu — arrêt en cours...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
