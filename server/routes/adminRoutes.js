const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const exportController = require('../controllers/exportController');
const attendanceRoutes = require('./attendanceRoutes');
const settingsRoutes = require('./settingsRoutes');

const { requireAuth } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

// --- Authentification ---
router.post('/login', loginLimiter, adminController.login);
router.post('/logout', adminController.logout);

// --- Dashboard & statistiques ---
router.get('/dashboard', requireAuth, adminController.getDashboard);

// --- Participants (CRUD) ---
router.get('/registrations', requireAuth, adminController.listRegistrations);
router.get('/registrations/:id', requireAuth, adminController.getRegistration);
router.put('/registrations/:id', requireAuth, adminController.updateRegistration);
router.delete('/registrations/:id', requireAuth, adminController.deleteRegistration);

// --- Export ---
router.get('/export/csv', requireAuth, exportController.exportCsv);
router.get('/export/excel', requireAuth, exportController.exportExcel);
router.get('/export/pdf', requireAuth, exportController.exportPdf);

// --- Scanner / présence ---
router.use('/', attendanceRoutes);

// --- Paramètres HAPHAK ---
router.use('/', settingsRoutes);

module.exports = router;
