const bcrypt = require('bcrypt');
const { prisma } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

// POST /api/admin/login
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Identifiant et mot de passe requis." });
    }

    const admin = await prisma.admin.findUnique({ where: { username } });

    // Réponse volontairement générique pour ne pas révéler si le compte existe.
    const genericError = { success: false, message: "Identifiants incorrects." };

    if (!admin || !admin.active) {
      return res.status(401).json(genericError);
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return res.status(401).json(genericError);
    }

    req.session.adminId = admin.id;
    req.session.username = admin.username;

    res.json({
      success: true,
      data: { username: admin.username, fullName: admin.fullName },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/logout
function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('haphak.sid');
    res.json({ success: true });
  });
}

// GET /api/admin/dashboard
async function getDashboard(req, res, next) {
  try {
    const [
      total,
      hommes,
      femmes,
      membres,
      hebergement,
      present,
      todayCount,
      weekCount,
      byCity,
    ] = await Promise.all([
      prisma.registration.count(),
      prisma.registration.count({ where: { gender: 'HOMME' } }),
      prisma.registration.count({ where: { gender: 'FEMME' } }),
      prisma.registration.count({ where: { organizationMember: true } }),
      prisma.registration.count({ where: { accommodationRequired: true } }),
      prisma.attendance.count({ where: { status: 'PRESENT' } }),
      prisma.registration.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.registration.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.registration.groupBy({
        by: ['city'],
        _count: { city: true },
        orderBy: { _count: { city: 'desc' } },
        take: 10,
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalRegistered: total,
        men: hommes,
        women: femmes,
        members: membres,
        nonMembers: total - membres,
        accommodationRequests: hebergement,
        present,
        absent: total - present,
        registrationsToday: todayCount,
        registrationsThisWeek: weekCount,
        byCity: byCity.map((c) => ({ city: c.city, count: c._count.city })),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/registrations — liste avec recherche/filtres/pagination
async function listRegistrations(req, res, next) {
  try {
    const {
      search, city, gender, memberOnly, accommodation, present,
      dateFrom, dateTo, page = 1, pageSize = 20, sortBy = 'createdAt', sortDir = 'desc',
    } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { registrationNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (city) where.city = { equals: city, mode: 'insensitive' };
    if (gender) where.gender = gender;
    if (memberOnly === 'true') where.organizationMember = true;
    if (memberOnly === 'false') where.organizationMember = false;
    if (accommodation === 'true') where.accommodationRequired = true;
    if (accommodation === 'false') where.accommodationRequired = false;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    if (present === 'true') where.attendance = { is: { status: 'PRESENT' } };
    if (present === 'false') where.attendance = { is: null };

    const take = Math.min(parseInt(pageSize, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const [items, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        orderBy: { [sortBy]: sortDir === 'asc' ? 'asc' : 'desc' },
        skip,
        take,
        include: { attendance: true },
      }),
      prisma.registration.count({ where }),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { page: Number(page), pageSize: take, total, totalPages: Math.ceil(total / take) },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/registrations/:id
async function getRegistration(req, res, next) {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: req.params.id },
      include: { attendance: true },
    });
    if (!registration) throw new AppError("Participant introuvable.", 404);
    res.json({ success: true, data: registration });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/registrations/:id
async function updateRegistration(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.registration.findUnique({ where: { id } });
    if (!existing) throw new AppError("Participant introuvable.", 404);

    // Champs modifiables par l'admin (on exclut volontairement id, registrationNumber, qrToken)
    const allowed = [
      'lastName', 'middleName', 'firstName', 'gender', 'maritalStatus',
      'phone', 'whatsapp', 'email', 'address', 'city', 'neighborhood', 'commune', 'province', 'country',
      'familyStatus', 'familySize', 'childrenCount', 'emergencyContactName', 'emergencyContactPhone',
      'emergencyContactRelationship', 'source', 'arrivalCity', 'transportMethod', 'fullRetreat',
      'organizationMember', 'department', 'accommodationRequired', 'nights', 'accommodationType',
      'comingWithOthers', 'companionsCount', 'specialNeeds', 'comments', 'observations', 'status',
    ];

    const data = {};
    for (const key of allowed) {
      if (key in req.body) data[key] = req.body[key];
    }

    const updated = await prisma.registration.update({ where: { id }, data });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/registrations/:id
async function deleteRegistration(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.registration.findUnique({ where: { id } });
    if (!existing) throw new AppError("Participant introuvable.", 404);

    await prisma.registration.delete({ where: { id } });
    res.json({ success: true, message: "Inscription supprimée." });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  logout,
  getDashboard,
  listRegistrations,
  getRegistration,
  updateRegistration,
  deleteRegistration,
};
