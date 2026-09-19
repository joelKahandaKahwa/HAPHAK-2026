const env = require('../config/env');

// Erreur métier volontaire (ex: validation, ressource introuvable)
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: "Ressource introuvable.",
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  // Logs détaillés uniquement côté serveur (jamais envoyés au client)
  if (!env.isProduction) {
    console.error(err);
  } else {
    console.error(`[${new Date().toISOString()}] ${err.message}`);
  }

  const payload = {
    success: false,
    message: err.isOperational
      ? err.message
      : "Une erreur est survenue. Veuillez réessayer.",
  };

  // Jamais de stack trace, requête SQL ou secret exposé au client, même en dev.
  res.status(statusCode).json(payload);
}

module.exports = { AppError, notFoundHandler, errorHandler };
