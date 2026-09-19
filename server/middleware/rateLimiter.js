const rateLimit = require('express-rate-limit');

// Limite générique pour l'API publique
const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Trop de requêtes. Veuillez réessayer dans quelques minutes.",
  },
});

// Limite stricte sur la création d'inscriptions (anti-spam / bots)
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Trop de tentatives d'inscription depuis cette adresse. Réessayez plus tard.",
  },
});

// Limite très stricte sur la connexion admin (anti brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
  },
});

module.exports = { publicApiLimiter, registrationLimiter, loginLimiter };
