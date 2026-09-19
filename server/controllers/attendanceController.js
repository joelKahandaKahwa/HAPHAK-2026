const { prisma } = require('../config/database');

// POST /api/admin/scanner — reçoit { token } (scanné par caméra ou saisi manuellement)
async function scanQrCode(req, res, next) {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.json({ success: true, result: 'INVALID', message: 'QR CODE INVALIDE' });
    }

    const registration = await prisma.registration.findUnique({
      where: { qrToken: token.trim() },
      include: { attendance: true },
    });

    // Ne jamais révéler d'informations personnelles lorsqu'un QR Code est invalide.
    if (!registration) {
      return res.json({ success: true, result: 'INVALID', message: 'QR CODE INVALIDE' });
    }

    if (registration.attendance) {
      return res.json({
        success: true,
        result: 'ALREADY_SCANNED',
        message: 'PARTICIPANT DÉJÀ ENREGISTRÉ',
        data: {
          scannedAt: registration.attendance.scannedAt,
        },
      });
    }

    const attendance = await prisma.attendance.create({
      data: {
        registrationId: registration.id,
        scannedById: req.session.adminId || null,
        status: 'PRESENT',
      },
    });

    res.json({
      success: true,
      result: 'PRESENT',
      message: 'PRÉSENCE VALIDÉE',
      data: {
        firstName: registration.firstName,
        lastName: registration.lastName,
        registrationNumber: registration.registrationNumber,
        city: registration.city,
        accommodationRequired: registration.accommodationRequired,
        scannedAt: attendance.scannedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/attendance — historique des présences
async function getAttendanceHistory(req, res, next) {
  try {
    const records = await prisma.attendance.findMany({
      orderBy: { scannedAt: 'desc' },
      include: {
        registration: {
          select: { firstName: true, lastName: true, registrationNumber: true, city: true },
        },
        scannedBy: { select: { username: true } },
      },
      take: 200,
    });
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
}

module.exports = { scanQrCode, getAttendanceHistory };
