const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const pool = require('./db');
const { publicApiLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { requireAuth } = require('./middleware/auth');

const registrationRoutes = require('./routes/registrationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Derrière un proxy (Render, Railway, Fly...) pour que les cookies Secure fonctionnent
app.set('trust proxy', 1);

// --- Sécurité HTTP ---
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'", 'blob:'],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// --- CORS : même origine par défaut ---
app.use(
  cors({
    origin: env.appUrl,
    credentials: true,
  })
);

// --- Parsing ---
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// --- Sessions sécurisées ---
app.use(
  session({
    name: 'haphak.sid',
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8, // 8 heures
    },
  })
);

// --- Fichiers statiques publics ---
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- Pages d'administration ---
const adminDir = path.join(__dirname, '..', 'admin');

// /admin/login est public ; toutes les autres pages exigent une session valide.
app.get('/admin/login', (req, res) => res.sendFile(path.join(adminDir, 'login.html')));
app.get('/admin/login.html', (req, res) => res.sendFile(path.join(adminDir, 'login.html')));

app.get('/admin', (req, res) => {
  if (!req.session.adminId) return res.redirect('/admin/login');
  res.sendFile(path.join(adminDir, 'dashboard.html'));
});

app.get('/admin/dashboard.html', (req, res) => {
  if (!req.session.adminId) return res.redirect('/admin/login');
  res.sendFile(path.join(adminDir, 'dashboard.html'));
});

const protectedPages = {
  '/admin/registrations': 'registrations.html',
  '/admin/participant': 'participant.html',
  '/admin/scanner': 'scanner.html',
  '/admin/settings': 'settings.html',
  '/admin/attendance': 'attendance.html',
};

Object.entries(protectedPages).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    if (!req.session.adminId) return res.redirect('/admin/login');
    res.sendFile(path.join(adminDir, file));
  });

  app.get(`${route}.html`, (req, res) => {
    if (!req.session.adminId) return res.redirect('/admin/login');
    res.sendFile(path.join(adminDir, file));
  });
});

// --- API ---
app.use('/api', publicApiLimiter, registrationRoutes);
app.use('/api/admin', adminRoutes);

// Santé de l'application
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));

app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as now');

    res.json({
      connected: true,
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error('Erreur de connexion Neon:', error.message);

    res.status(500).json({
      connected: false,
      error: error.message,
    });
  }
});

// --- Erreurs ---
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
