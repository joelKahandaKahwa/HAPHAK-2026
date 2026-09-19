const { prisma } = require('../config/database');
const { validateRegistration, formatZodErrors } = require('../validators/registrationValidator');
const { createRegistration, getConfirmationByNumber } = require('../services/registrationService');
const { generateQrCodeDataUrl } = require('../services/qrService');
const { AppError } = require('../middleware/errorHandler');

// GET /api/retreat — infos publiques (nom, thème, dates, lieu, sessions...)
async function getRetreatInfo(req, res, next) {
  try {
    const settings = await prisma.retreatSettings.findUnique({ where: { id: 'default' } });
    const sessions = await prisma.retreatSession.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });

    res.json({
      success: true,
      data: {
        settings: settings || null,
        sessions,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/registrations — création d'une inscription
async function postRegistration(req, res, next) {
  try {
    const result = validateRegistration(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Veuillez corriger les champs indiqués.",
        errors: formatZodErrors(result.error),
      });
    }

    const registration = await createRegistration(result.data);

    res.status(201).json({
      success: true,
      registrationId: registration.registrationNumber,
      data: {
        registrationNumber: registration.registrationNumber,
        firstName: registration.firstName,
        lastName: registration.lastName,
        emailStatus: registration.emailStatus,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/registrations/confirmation/:registrationNumber
async function getConfirmation(req, res, next) {
  try {
    const { registrationNumber } = req.params;
    if (!registrationNumber) throw new AppError("Numéro d'inscription requis.", 400);

    const registration = await getConfirmationByNumber(registrationNumber);
    const qrCodeDataUrl = await generateQrCodeDataUrl(registration.qrToken);

    res.json({
      success: true,
      data: {
        registrationNumber: registration.registrationNumber,
        firstName: registration.firstName,
        lastName: registration.lastName,
        city: registration.city,
        createdAt: registration.createdAt,
        accommodationRequired: registration.accommodationRequired,
        qrCodeDataUrl,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRetreatInfo, postRegistration, getConfirmation };
