// routes/api.js — REST API for Dashboard, Settings & Plugins
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const PLUGINS_DIR = path.join(__dirname, '..', 'plugins');

if (!fs.existsSync(PLUGINS_DIR)) fs.mkdirSync(PLUGINS_DIR, { recursive: true });

// Multer setup for plugin uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PLUGINS_DIR),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname) !== '.js') {
      return cb(new Error('Only .js files are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Helper: read config safely
function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

// ─── BOT STATUS ─────────────────────────────────────────
router.get('/status', (req, res) => {
  try {
    const { getBotStatus } = require('../bot');
    res.json({ success: true, data: getBotStatus() });
  } catch (err) {
    res.json({ success: false, data: { running: false } });
  }
});

// ─── BOT CONTROL ────────────────────────────────────────
router.post('/bot/start', async (req, res) => {
  try {
    const { startBot } = require('../bot');
    await startBot();
    res.json({ success: true, message: '🚀 Bot started successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/bot/stop', async (req, res) => {
  try {
    const { stopBot } = require('../bot');
    await stopBot();
    res.json({ success: true, message: '🛑 Bot stopped.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/bot/restart', async (req, res) => {
  try {
    const { restartBot } = require('../bot');
    res.json({ success: true, message: '🔁 Bot is restarting...' });
    setTimeout(() => restartBot(), 500);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── LOGS (Server-Sent Events) ──────────────────────────
router.get('/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const { getLogs, emitter } = require('../log-store');

  // Send history
  getLogs().forEach((log) => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  });

  // Listen for new logs
  const onLog = (entry) => {
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  };
  emitter.on('log', onLog);

  // Keepalive ping every 25s
  const ping = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    emitter.off('log', onLog);
    clearInterval(ping);
  });
});

// ─── SETTINGS ───────────────────────────────────────────
router.get('/settings', (req, res) => {
  res.json({ success: true, data: readConfig() });
});

router.post('/settings', (req, res) => {
  try {
    const current = readConfig();
    const updated = { ...current, ...req.body };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2));
    res.json({ success: true, message: '✅ Settings saved successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PLUGINS ────────────────────────────────────────────
router.get('/plugins', (req, res) => {
  try {
    const files = fs.readdirSync(PLUGINS_DIR).filter((f) => f.endsWith('.js'));
    const plugins = files.map((f) => {
      const stat = fs.statSync(path.join(PLUGINS_DIR, f));
      return {
        name: f,
        size: stat.size,
        modified: stat.mtime,
      };
    });
    res.json({ success: true, data: plugins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/plugins/upload', upload.single('plugin'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  res.json({ success: true, message: `✅ Plugin "${req.file.originalname}" uploaded!`, filename: req.file.originalname });
});

router.delete('/plugins/:name', (req, res) => {
  try {
    const safeName = path.basename(req.params.name); // prevent path traversal
    const filePath = path.join(PLUGINS_DIR, safeName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Plugin not found.' });
    fs.unlinkSync(filePath);
    res.json({ success: true, message: `🗑️ Plugin "${safeName}" deleted.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/plugins/:name/content', (req, res) => {
  try {
    const safeName = path.basename(req.params.name);
    const filePath = path.join(PLUGINS_DIR, safeName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Plugin not found.' });
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ success: true, data: content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
