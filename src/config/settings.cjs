const fs = require('fs');
const path = require('path');

// Dynamically read from the project root config.json
const CONFIG_PATH = path.join(__dirname, '../../config.json');

let config = {
  "PREFIX": ".",
  "MODE": "public",
  "AUTOREADSTATUS": true,
  "ALLWAYSONLINE": true,
  "EMOJI": "👸",
  "SUDO": ["94779912589"]
};

try {
  if (fs.existsSync(CONFIG_PATH)) {
    const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    config = { ...config, ...data };
  }
} catch (e) {
  console.error("Error reading config.json in settings.cjs:", e);
}

module.exports = config;