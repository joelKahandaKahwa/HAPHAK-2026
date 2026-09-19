// Protège toutes les routes /api/admin/* : aucune n'est accessible sans session valide.

function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: "Session expirée ou inexistante. Veuillez vous reconnecter.",
  });
}

module.exports = { requireAuth };
