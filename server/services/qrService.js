const QRCode = require('qrcode');
const crypto = require('crypto');

// Génère un token aléatoire sécurisé (jamais de données personnelles dedans).
// Format: HAPHAK-<uuid-like random hex>
function generateQrToken() {
  const random = crypto.randomBytes(16).toString('hex');
  return `HAPHAK-${random}`;
}

// Génère l'image QR (data URL base64) à partir du token uniquement.
// Le QR ne contient QUE ce token — le serveur retrouve l'inscription via ce token.
async function generateQrCodeDataUrl(qrToken) {
  return QRCode.toDataURL(qrToken, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: {
      dark: '#0B1F3A',
      light: '#FFFFFF',
    },
  });
}

// Génère un buffer PNG (utile pour l'attacher à un e-mail)
async function generateQrCodeBuffer(qrToken) {
  return QRCode.toBuffer(qrToken, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
  });
}

module.exports = { generateQrToken, generateQrCodeDataUrl, generateQrCodeBuffer };
