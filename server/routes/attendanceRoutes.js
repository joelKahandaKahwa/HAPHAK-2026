const express = require('express');
const router = express.Router();

const { scanQrCode, getAttendanceHistory } = require('../controllers/attendanceController');
const { requireAuth } = require('../middleware/auth');

// Toutes les routes ici sont montées sous /api/admin et déjà protégées
// par requireAuth au niveau du routeur parent (adminRoutes.js), mais on
// le redéclare ici par défense en profondeur.
router.post('/scanner', requireAuth, scanQrCode);
router.get('/attendance', requireAuth, getAttendanceHistory);

module.exports = router;
