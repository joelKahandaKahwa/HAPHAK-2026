// Données de test — TOUTES clairement identifiées par le préfixe [TEST].
// Ne jamais confondre ces lignes avec de vraies inscriptions.
// Usage : npm run seed

const { prisma } = require('../config/database');
const { generateQrToken } = require('../services/qrService');

const TEST_PREFIX = '[TEST]';

async function main() {
  // 1. Paramètres par défaut — uniquement les informations réellement fournies.
  await prisma.retreatSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'HAPHAK 2026',
      meaning: 'Transforme',
      theme: 'Marche devant ma face',
      datesLabel: 'Du 27 au 30 septembre 2026',
      startTime: 'Dimanche 27 septembre à 17h00',
      location: 'Q. Kyeshero, Av. Topographe N°1, réf. Entrée Tshengerero',
      description: null,
      contactPhone: '+243 816 366 894',
      contactEmail: null,
      whatsapp: null,
    },
  });

  // 2. Sessions quotidiennes — horaires confirmés.
  const sessions = [
    {
      name: 'Matin',
      time: '09h00 – 11h30',
      description: 'Enseignement et adoration',
      order: 0,
    },
    {
      name: 'Midi',
      time: '14h00 – 16h00',
      description: 'Étude biblique approfondie (Centre Bérée)',
      order: 1,
    },
    {
      name: 'Soir',
      time: '20h30 – 01h00',
      description: 'Intercession, adoration et ateliers',
      order: 2,
    },
  ];

  for (const s of sessions) {
    const existing = await prisma.retreatSession.findFirst({ where: { name: s.name } });
    if (existing) {
      await prisma.retreatSession.update({ where: { id: existing.id }, data: s });
    } else {
      await prisma.retreatSession.create({ data: { ...s, date: null, active: true } });
    }
  }

  // 3. Inscriptions de test
  const samples = [
    {
      lastName: `${TEST_PREFIX} Kabila`, firstName: 'Jean', gender: 'HOMME',
      maritalStatus: 'CELIBATAIRE', city: 'Goma', country: 'RD Congo',
      phone: '+243900000001', email: 'test.jean@example.test',
      accommodationRequired: true, accommodationType: 'DORTOIR', nights: 2,
      organizationMember: true, department: 'Accueil',
    },
    {
      lastName: `${TEST_PREFIX} Mwamba`, firstName: 'Grâce', gender: 'FEMME',
      maritalStatus: 'MARIE', city: 'Bukavu', country: 'RD Congo',
      phone: '+243900000002', email: 'test.grace@example.test',
      accommodationRequired: false, organizationMember: false,
    },
  ];

  let index = 9000;
  for (const s of samples) {
    index += 1;
    const registrationNumber = `HAP-TEST-${index}`;
    const exists = await prisma.registration.findUnique({ where: { registrationNumber } });
    if (exists) continue;

    await prisma.registration.create({
      data: {
        registrationNumber,
        lastName: s.lastName,
        firstName: s.firstName,
        gender: s.gender,
        maritalStatus: s.maritalStatus,
        phone: s.phone,
        email: s.email,
        city: s.city,
        country: s.country,
        emergencyContactName: `${TEST_PREFIX} Contact urgence`,
        emergencyContactPhone: '+243900000009',
        emergencyContactRelationship: 'AUTRE',
        source: 'EGLISE',
        arrivalCity: s.city,
        transportMethod: 'COMMUN',
        fullRetreat: 'OUI',
        organizationMember: s.organizationMember,
        department: s.department || null,
        accommodationRequired: s.accommodationRequired,
        accommodationType: s.accommodationType || null,
        nights: s.nights || null,
        comingWithOthers: false,
        observations: `${TEST_PREFIX} Inscription générée par le script de seed.`,
        consent: true,
        confirmed: true,
        status: 'CONFIRMED',
        qrToken: generateQrToken(),
        emailStatus: 'EMAIL_PENDING',
      },
    });
  }

  console.log('✅ Données de test créées (toutes marquées [TEST]).');
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
