const express = require('express');
const router = express.Router();

const { getRetreatInfo, postRegistration, getConfirmation } = require('../controllers/registrationController');
const { registrationLimiter } = require('../middleware/rateLimiter');

// GET /api/retreat — informations publiques de HAPHAK
router.get('/retreat', getRetreatInfo);

// POST /api/registrations — création d'une inscription
router.post('/registrations', registrationLimiter, postRegistration);

// GET /api/registrations/confirmation/:registrationNumber
router.get('/registrations/confirmation/:registrationNumber', getConfirmation);

module.exports = router;
