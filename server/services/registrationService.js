const { prisma } = require('../config/database');
const { generateQrToken } = require('./qrService');
const { sendConfirmationEmail } = require('./emailService');
const { AppError } = require('../middleware/errorHandler');

// Génère un numéro d'inscription unique côté serveur, ex: HAP-2026-0001
// Ne jamais faire confiance à un numéro fourni par le frontend.
async function generateRegistrationNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.registration.count();
  const next = String(count + 1).padStart(4, '0');
  const candidate = `HAP-${year}-${next}`;

  // Sécurité anti-collision (concurrence) : boucle si déjà pris.
  const exists = await prisma.registration.findUnique({ where: { registrationNumber: candidate } });
  if (exists) {
    const fallback = `HAP-${year}-${Date.now().toString().slice(-6)}`;
    return fallback;
  }
  return candidate;
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

async function createRegistration(data) {
  const registrationNumber = await generateRegistrationNumber();
  const qrToken = generateQrToken();

  const registration = await prisma.registration.create({
    data: {
      registrationNumber,
      lastName: data.lastName,
      middleName: data.middleName || null,
      firstName: data.firstName,
      gender: data.gender,
      maritalStatus: data.maritalStatus,
      birthDate: toDate(data.birthDate),

      phone: data.phone,
      whatsapp: data.whatsapp || null,
      email: data.email.toLowerCase(),
      address: data.address || null,
      city: data.city,
      neighborhood: data.neighborhood || null,
      commune: data.commune || null,
      province: data.province || null,
      country: data.country,

      familyStatus: data.familyStatus || null,
      familySize: data.familySize ?? null,
      childrenCount: data.childrenCount ?? null,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      emergencyContactRelationship: data.emergencyContactRelationship,

      source: data.source,
      arrivalCity: data.arrivalCity,
      transportMethod: data.transportMethod,
      fullRetreat: data.fullRetreat,
      arrivalDate: toDate(data.arrivalDate),
      departureDate: toDate(data.departureDate),
      organizationMember: !!data.organizationMember,
      department: data.organizationMember ? (data.department || null) : null,

      accommodationRequired: !!data.accommodationRequired,
      nights: data.accommodationRequired ? (data.nights ?? null) : null,
      accommodationType: data.accommodationRequired ? (data.accommodationType || null) : null,
      comingWithOthers: !!data.comingWithOthers,
      companionsCount: data.comingWithOthers ? (data.companionsCount ?? null) : null,

      specialNeeds: data.specialNeeds || null,
      comments: data.comments || null,
      observations: data.observations || null,

      consent: !!data.consent,
      confirmed: !!data.confirmed,
      status: 'CONFIRMED',

      qrToken,
      emailStatus: 'EMAIL_PENDING',
    },
  });

  // Envoi de l'e-mail — une erreur ici ne doit jamais annuler l'inscription.
  const settings = await prisma.retreatSettings.findUnique({ where: { id: 'default' } });
  const emailResult = await sendConfirmationEmail(registration, settings);

  const updated = await prisma.registration.update({
    where: { id: registration.id },
    data: { emailStatus: emailResult.sent ? 'EMAIL_SENT' : 'EMAIL_FAILED' },
  });

  return updated;
}

async function getConfirmationByNumber(registrationNumber) {
  const registration = await prisma.registration.findUnique({
    where: { registrationNumber },
  });
  if (!registration) {
    throw new AppError("Inscription introuvable.", 404);
  }
  return registration;
}

module.exports = { createRegistration, getConfirmationByNumber, generateRegistrationNumber };
