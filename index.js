// index.js — Queen Venus MD Unified Entry Point
require('events').EventEmitter.defaultMaxListeners = 500;

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8')).PORT || 8000;

// ─── Middleware ──────────────────────────────────────────
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Routes ─────────────────────────────────────────────
const pairRouter = require('./routes/pair');
const qrRouter = require('./routes/qr');
const apiRouter = require('./routes/api');

app.use('/code', pairRouter);      // Pair code API
app.use('/server', qrRouter);      // QR code API
app.use('/api', apiRouter);        // Dashboard API

// ─── Page Routes ────────────────────────────────────────
const PUBLIC = (page) => path.join(__dirname, 'public', page);

app.get('/',          (req, res) => res.sendFile(PUBLIC('index.html')));
app.get('/pair',      (req, res) => res.sendFile(PUBLIC('pair.html')));
app.get('/qr',        (req, res) => res.sendFile(PUBLIC('qr.html')));
app.get('/dashboard', (req, res) => res.sendFile(PUBLIC('dashboard.html')));
app.get('/settings',  (req, res) => res.sendFile(PUBLIC('settings.html')));
app.get('/plugins',   (req, res) => res.sendFile(PUBLIC('plugins.html')));

// ─── 404 Handler ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).sendFile(PUBLIC('index.html'));
});

// ─── Start Server ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║     👑  QUEEN VENUS MD  👑           ║
  ║   Unified Bot Dashboard Server       ║
  ║                                      ║
  ║  🌐 http://localhost:${PORT}            ║
  ║  📋 Dashboard  → /dashboard          ║
  ║  ⚙️  Settings   → /settings           ║
  ║  🔌 Plugins    → /plugins            ║
  ║  📱 Session    → /pair or /qr        ║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = app;
