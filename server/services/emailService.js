const nodemailer = require('nodemailer');
const env = require('../config/env');
const { generateQrCodeBuffer } = require('./qrService');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!env.smtp.host || !env.smtp.user) {
    // Pas de config SMTP fournie : on ne plante pas l'app, on log seulement.
    console.warn('⚠️  SMTP non configuré (.env). Les e-mails ne seront pas envoyés.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.password,
    },
  });

  return transporter;
}

function buildConfirmationHtml(registration, settings) {
  const location = settings?.location || 'À CONFIGURER';
  return `
  <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; background:#FAF8F4; padding: 32px; color:#0B1F3A;">
    <div style="text-align:center; margin-bottom: 24px;">
      <p style="letter-spacing: 4px; color:#C9A24B; font-size: 13px; margin:0 0 4px;">${settings?.name || 'HAPHAK 2026'}</p>
      <h1 style="font-size: 26px; margin: 0 0 4px;">« ${settings?.meaning || 'Transforme'} »</h1>
      <p style="font-style: italic; color:#4A5568; margin:0;">${settings?.theme || 'Marche devant ma face'}</p>
    </div>
    <hr style="border:none; border-top:1px solid #E4DFD3; margin: 24px 0;" />
    <p>Bonjour ${registration.firstName} ${registration.lastName},</p>
    <p>Votre inscription à HAPHAK 2026 est confirmée. Voici votre récapitulatif :</p>
    <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding:6px 0; color:#4A5568;">Numéro d'inscription</td><td style="padding:6px 0; text-align:right; font-weight:bold;">${registration.registrationNumber}</td></tr>
      <tr><td style="padding:6px 0; color:#4A5568;">Dates</td><td style="padding:6px 0; text-align:right;">${settings?.datesLabel || 'À CONFIGURER'}</td></tr>
      <tr><td style="padding:6px 0; color:#4A5568;">Rassemblement</td><td style="padding:6px 0; text-align:right;">${settings?.startTime || 'À CONFIGURER'}</td></tr>
      <tr><td style="padding:6px 0; color:#4A5568;">Lieu</td><td style="padding:6px 0; text-align:right;">${location}</td></tr>
      ${settings?.contactPhone ? `<tr><td style="padding:6px 0; color:#4A5568;">Assistance</td><td style="padding:6px 0; text-align:right;">${settings.contactPhone}</td></tr>` : ''}
    </table>
    <div style="text-align:center; margin: 24px 0;">
      <img src="cid:qrcode" alt="QR Code personnel" style="width:220px; height:220px; border:1px solid #E4DFD3; padding:8px;" />
      <p style="font-size: 13px; color:#4A5568; margin-top: 8px;">Veuillez conserver cet e-mail et présenter votre QR Code à l'entrée.</p>
    </div>
    <p style="font-size: 13px; color:#4A5568;">À très bientôt.</p>
  </div>`;
}

async function sendConfirmationEmail(registration, settings) {
  const t = getTransporter();
  if (!t) return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };

  try {
    const qrBuffer = await generateQrCodeBuffer(registration.qrToken);

    await t.sendMail({
      from: env.smtp.from,
      to: registration.email,
      subject: `Confirmation d'inscription — ${settings?.name || 'HAPHAK 2026'}`,
      html: buildConfirmationHtml(registration, settings),
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrBuffer,
          cid: 'qrcode',
        },
      ],
    });

    return { sent: true };
  } catch (err) {
    console.error("Erreur d'envoi d'e-mail:", err.message);
    // Une erreur d'e-mail ne doit jamais corrompre l'inscription déjà enregistrée.
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendConfirmationEmail };
