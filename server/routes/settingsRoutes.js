const express = require('express');
const router = express.Router();

const { getSettings, updateSettings, updateSessions } = require('../controllers/settingsController');
const { requireAuth } = require('../middleware/auth');

router.get('/settings', requireAuth, getSettings);
router.put('/settings', requireAuth, updateSettings);
router.put('/settings/sessions', requireAuth, updateSessions);

module.exports = router;
