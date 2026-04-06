// routes/pair.js — Pair Code Session Generator
const { makeid } = require('../gen-id');
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const pino = require('pino');
const logger = pino({ level: 'info' });
const {
  makeWASocket,
  useMultiFileAuthState,
  delay,
  Browsers,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = require('@whiskeysockets/baileys');
const axios = require('axios');

const TEMP_DIR = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

function removeFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  fs.rmSync(filePath, { recursive: true, force: true });
}

const grandCaption = `
👑 𝙌𝙐𝙀𝙀𝙉 𝙑𝙀𝙉𝙐𝙎 𝙈𝘿 👑
━━━━━━━✧━━━━━━━

🔥 𝑾𝒆𝒍𝒄𝒐𝒎𝒆 𝒕𝒐 𝒕𝒉𝒆 𝑹𝒐𝒚𝒂𝒍 𝑫𝒐𝒎𝒊𝒏𝒊𝒐𝒏 🔥

You have successfully connected to the most advanced WhatsApp Bot.

🌟 *DEVELOPER:* Hansaka P. Fernando
📞 *CONTACT:* +94779912589
🚀 *VERSION:* V1 - Premium Edition

🔒 *SECURITY WARNING:*
  "DO NOT SHARE THIS SESSION ID WITH ANYONE!"

✨ *Let the Royal Supremacy Begin!* ✨
━━━━━━━✧━━━━━━━
`;

async function VENUS_PAIR_CODE(id, num, res) {
  const sessionPath = path.join(TEMP_DIR, id);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();
  try {
    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      printQRInTerminal: false,
      generateHighQualityLinkPreview: true,
      logger: pino({ level: 'silent' }),
      syncFullHistory: false,
      browser: Browsers.ubuntu('Chrome'),
      markOnlineOnConnect: false,
    });

    if (!sock.authState.creds.registered) {
      await delay(5000);
      num = num.replace(/[^0-9]/g, '');
      const code = await sock.requestPairingCode(num);
      if (!res.headersSent) res.send({ code });
    }

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'open') {
        await delay(5000);
        const myJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const credsFilePath = path.join(sessionPath, 'creds.json');
        try {
          // Update Bio
          try {
            await sock.updateProfileStatus("👑 𝓠𝓮𝓮𝓷 𝓥𝓮𝓷𝓾𝓼 𝓜𝓓 𝓥1.0.3 Official");
          } catch (_) {}

          // Update DP
          const imgUrl = "https://i.ibb.co/0V2BdtpJ/Whats-App-Image-2026-03-28-at-12-07-53-AM.jpg";
          try {
            const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
            const imgBuffer = Buffer.from(response.data, 'binary');
            await sock.updateProfilePicture(myJid, imgBuffer);
          } catch (_) {}

          // Send session ID
          const credsData = fs.readFileSync(credsFilePath, 'utf-8');
          const base64Session = Buffer.from(credsData).toString('base64');
          const sessionId = "QUEEN VENUS =" + base64Session;
          const codeMessage = await sock.sendMessage(myJid, { text: sessionId });

          await sock.sendMessage(myJid, {
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
          }, { quoted: codeMessage });

          await sock.sendMessage(myJid, {
            text: "✅ *Royal Setup Complete!*\n➔ Profile Picture updated!\n➔ Status updated!\n➔ Ready to rule! 🚀",
          }, { quoted: codeMessage });

          await sock.ws.close();
          removeFile(sessionPath);
        } catch (error) {
          logger.error(`Error: ${error.message}`);
          removeFile(sessionPath);
        }
      } else if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        if (statusCode !== 401 && statusCode !== 403) {
          await delay(10000);
          VENUS_PAIR_CODE(id, num, res);
        } else {
          removeFile(sessionPath);
        }
      }
    });
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    removeFile(sessionPath);
    if (!res.headersSent) res.send({ code: "❗ Service Unavailable" });
  }
}

router.get('/', async (req, res) => {
  const id = makeid();
  const num = req.query.number;
  if (!num) return res.status(400).send({ error: 'Number is required' });
  await VENUS_PAIR_CODE(id, num, res);
});

setInterval(() => {
  console.log('☘️ 24h checkpoint — Server still alive ✅');
}, 86400000);

module.exports = router;
