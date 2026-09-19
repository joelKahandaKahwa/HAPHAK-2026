const { prisma } = require('../config/database');

// GET /api/admin/settings
async function getSettings(req, res, next) {
  try {
    let settings = await prisma.retreatSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.retreatSettings.create({ data: { id: 'default' } });
    }
    const sessions = await prisma.retreatSession.findMany({ orderBy: { order: 'asc' } });
    res.json({ success: true, data: { settings, sessions } });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/settings — met à jour les paramètres, sans jamais toucher au code source
async function updateSettings(req, res, next) {
  try {
    const allowed = [
      'name', 'meaning', 'theme', 'datesLabel', 'startTime', 'location', 'description',
      'contactPhone', 'contactEmail', 'whatsapp', 'registrationOpensAt', 'registrationClosesAt',
    ];
    const data = {};
    for (const key of allowed) {
      if (key in req.body) data[key] = req.body[key];
    }

    const settings = await prisma.retreatSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });

    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/settings/sessions — remplace la liste des sessions du programme
async function updateSessions(req, res, next) {
  try {
    const { sessions } = req.body; // [{ id?, name, description, date, time, active, order }]
    if (!Array.isArray(sessions)) {
      return res.status(400).json({ success: false, message: "Format de sessions invalide." });
    }

    const results = [];
    for (const [index, s] of sessions.entries()) {
      const payload = {
        name: s.name,
        description: s.description || null,
        date: s.date ? new Date(s.date) : null,
        time: s.time || null,
        active: s.active !== false,
        order: s.order ?? index,
      };
      if (s.id) {
        results.push(await prisma.retreatSession.update({ where: { id: s.id }, data: payload }));
      } else {
        results.push(await prisma.retreatSession.create({ data: payload }));
      }
    }

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, updateSettings, updateSessions };
