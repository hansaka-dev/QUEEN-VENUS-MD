// routes/qr.js — QR Code Session Generator
const { makeid } = require('../gen-id');
const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
let router = express.Router();
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  makeCacheableSignalKeyStore,
  Browsers,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
} = require('@whiskeysockets/baileys');
const axios = require('axios');

const TEMP_DIR = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

function removeFile(FilePath) {
  if (!fs.existsSync(FilePath)) return false;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

const grandCaption = `
👑 𝙌𝙐𝙀𝙀𝙉 𝙑𝙀𝙉𝙐𝙎 𝙈𝘿 👑
━━━━━━━✧━━━━━━━

You have successfully connected to Queen Venus MD!

🌟 *DEVELOPER:* Hansaka P. Fernando
📞 *CONTACT:* +94779912589

🔒 *DO NOT SHARE THIS SESSION ID WITH ANYONE!*

✨ *Let the Royal Supremacy Begin!* ✨
━━━━━━━✧━━━━━━━
`;

router.get('/', async (req, res) => {
  const id = makeid();
  const sessionPath = path.join(TEMP_DIR, id);

  async function VENUS_QR_CODE() {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    try {
      const { version } = await fetchLatestBaileysVersion();
      let sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Desktop'),
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
      });

      sock.ev.on('creds.update', saveCreds);
      sock.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect, qr } = s;
        if (qr) await res.end(await QRCode.toBuffer(qr));

        if (connection === 'open') {
          await delay(5000);
          const credsFilePath = path.join(sessionPath, 'creds.json');
          const imgUrl = "https://i.ibb.co/0V2BdtpJ/Whats-App-Image-2026-03-28-at-12-07-53-AM.jpg";

          // Update Bio
          try {
            await sock.updateProfileStatus("👑 𝓠𝓮𝓮𝓷 𝓥𝓮𝓷𝓾𝓼 𝓜𝓓 𝓥1.0.3 Official");
          } catch (_) {}

          // Update DP
          try {
            const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
            const imgBuffer = Buffer.from(response.data, 'binary');
            await sock.updateProfilePicture(sock.user.id, imgBuffer);
          } catch (_) {}

          try {
            const data = fs.readFileSync(credsFilePath);
            const base64Session = Buffer.from(data.toString()).toString('base64');
            const sessionId = "QUEEN VENUS =" + base64Session;
            let code = await sock.sendMessage(sock.user.id, { text: sessionId });

            await sock.sendMessage(sock.user.id, {
              image: { url: imgUrl },
              caption: grandCaption,
              contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                forwardedNewsletterMessageInfo: {
                  newsletterName: "Hansaka P. Fernando ☑️",
                  newsletterJid: "120363222395675670@newsletter",
                },
                externalAdReply: {
                  title: "Hansaka P. Fernando ☑️",
                  body: "Queen Venus MD Premium",
                  thumbnailUrl: imgUrl,
                  sourceUrl: "https://wa.me/94779912589",
                  mediaType: 1,
                  renderLargerThumbnail: true,
                },
              },
            }, { quoted: code });

            await sock.sendMessage(sock.user.id, {
              text: "✅ *Royal Setup Complete!*\n➔ Session ID sent above!\n➔ Paste it in the Dashboard to start your bot! 🚀",
            }, { quoted: code });
          } catch (e) {
            await sock.sendMessage(sock.user.id, { text: e.toString() });
          }

          await delay(10);
          await sock.ws.close();
          removeFile(sessionPath);
        } else if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          if (statusCode !== 401 && statusCode !== 403) {
            await delay(10000);
            VENUS_QR_CODE();
          } else {
            removeFile(sessionPath);
          }
        }
      });
    } catch (err) {
      console.error('QR service error:', err);
      removeFile(sessionPath);
      if (!res.headersSent) res.send({ code: '❗ Service Unavailable' });
    }
  }

  await VENUS_QR_CODE();
});

setInterval(() => {
  console.log('☘️ 24h checkpoint — Server still alive ✅');
}, 86400000);

module.exports = router;
