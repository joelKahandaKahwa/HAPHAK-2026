// Crée (ou met à jour) le compte administrateur à partir de ADMIN_USERNAME / ADMIN_PASSWORD.
// Usage : npm run create-admin

const bcrypt = require('bcrypt');
const env = require('../config/env');
const { prisma } = require('../config/database');

async function main() {
  const { username, password } = env.admin;

  if (!password || password === 'CHANGE_ME') {
    console.error("❌ Définissez ADMIN_PASSWORD dans .env avec un mot de passe réel avant de lancer ce script.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { username },
    update: { passwordHash, active: true },
    create: { username, passwordHash, fullName: 'Administrateur HAPHAK' },
  });

  // On s'assure aussi que la ligne de paramètres existe.
  await prisma.retreatSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });

  // Sessions quotidiennes (créées une seule fois, modifiables ensuite dans /admin/settings).
  const sessions = [
    { name: 'Matin', time: '09h00 – 11h30', description: 'Enseignement et adoration', order: 0 },
    { name: 'Midi', time: '14h00 – 16h00', description: 'Étude biblique approfondie (Centre Bérée)', order: 1 },
    { name: 'Soir', time: '20h30 – 01h00', description: 'Intercession, adoration et ateliers', order: 2 },
  ];

  for (const s of sessions) {
    const existing = await prisma.retreatSession.findFirst({ where: { name: s.name } });
    if (!existing) {
      await prisma.retreatSession.create({ data: { ...s, active: true } });
    }
  }

  console.log(`✅ Administrateur prêt : ${admin.username}`);
  console.log("   Le mot de passe est stocké haché (bcrypt), jamais en clair.");
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
