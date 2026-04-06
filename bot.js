// bot.js — Queen Venus MD Bot Engine (Unified Version)
// Exports: startBot, stopBot, getBotStatus, restartBot

const {
  default: makeWAconn,
  useMultiFileAuthState,
  DisconnectReason,
  getContentType,
  downloadContentFromMessage,
  fetchLatestBaileysVersion,
  Browsers,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");

const os = require("os");
const path = require("path");
const fs = require("fs");
const P = require("pino");
const FileType = require("file-type");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const { addLog } = require("./log-store");

const SESSION_DIR = path.join(__dirname, "sessions");
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

// ----- State -----
let conn = null;
let botStatus = {
  running: false,
  connectedAt: null,
  user: null,
  phone: null,
  messagesHandled: 0,
};
let shouldReconnect = true;
const processedMessageIds = new Set();

// ----- Session Setup -----
async function setupSession(config) {
  const sessionId = config.SESSION_ID;
  if (!sessionId || !sessionId.includes("QUEEN VENUS =")) {
    throw new Error("SESSION_ID is missing or invalid. Please generate a session first.");
  }

  const base64Data = sessionId.split("QUEEN VENUS =")[1];
  if (!base64Data) throw new Error("Invalid SESSION_ID format — missing Base64 data.");

  if (await fs.promises.stat(SESSION_DIR).catch(() => false)) {
    await fs.promises.rm(SESSION_DIR, { recursive: true, force: true });
  }
  await fs.promises.mkdir(SESSION_DIR, { recursive: true });

  const credsPath = path.join(SESSION_DIR, "creds.json");
  const decodedData = Buffer.from(base64Data, "base64").toString("utf-8");
  const sessionData = JSON.parse(decodedData);
  await fs.promises.writeFile(credsPath, JSON.stringify(sessionData, null, 2));
  addLog("🔐 Session data decoded and saved successfully.");
}

// ----- Start Bot -----
async function startBot() {
  if (botStatus.running) throw new Error("Bot is already running.");

  const configPath = path.join(__dirname, "config.json");
  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (_) {}

  // Prioritize Railway/Env variables
  const finalSessionId = process.env.SESSION_ID || config.SESSION_ID;
  const finalBotNumber = process.env.BOT_NUMBER || config.BOT_NUMBER || "94779912589";
  const finalPrefix = process.env.PREFIX || config.PREFIX || ".";

  if (!finalSessionId) {
    throw new Error("SESSION_ID is missing. Please set it in Railway Variables or Dashboard.");
  }

  const ownerNumber = [finalBotNumber];
  
  // Use session directly from env or config
  const tempConfig = { ...config, SESSION_ID: finalSessionId };
  await setupSession(tempConfig);

  const { handleCommand, loadCommands } = require("./src/utils/commandHandler");
  const getPrefix = () => config.PREFIX || ".";

  addLog("🚀 Queen Venus MD — System booting up (v1.0.3)...");

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  conn = makeWAconn({
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    syncFullHistory: true,
    auth: state,
    version,
  });

  shouldReconnect = true;

  // ----- Connection Events -----
  conn.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      botStatus.running = false;
      botStatus.connectedAt = null;
      const code = lastDisconnect?.error?.output?.statusCode;
      addLog(`🔴 Connection closed (code: ${code})`);
      if (shouldReconnect && code !== DisconnectReason.loggedOut) {
        addLog("🔄 Reconnecting in 5s...");
        setTimeout(() => startBot(), 5000);
      } else {
        addLog("⚠️ Logged out. Please regenerate your session.");
        botStatus.user = null;
      }
    } else if (connection === "open") {
      botStatus.running = true;
      botStatus.connectedAt = new Date().toISOString();
      botStatus.user = conn.user?.name || "Unknown";
      botStatus.phone = conn.user?.id?.split(":")[0] || "";
      addLog(`✅ Connected to WhatsApp! [${botStatus.user}]`);

      // Send startup message
      const myJid = conn.user.id.split(":")[0] + "@s.whatsapp.net";
      const up = `👑 *Queen Venus MD* connected!\n✅ Version: 1.0.3\n🔧 Prefix: ${config.PREFIX}\n📱 Mode: ${config.MODE}`;
      conn.sendMessage(myJid, { text: up }).catch(() => {});
    }
  });

  conn.ev.on("creds.update", saveCreds);

  // ----- Message Handler -----
  conn.ev.on("messages.upsert", async (mek) => {
    try {
      if (
        config.ALLWAYSONLINE === false &&
        mek.key &&
        mek.key.remoteJid !== "status@broadcast"
      ) {
        await conn.readMessages([mek.key]);
      }

      mek = mek.messages[0];
      if (!mek.message) return;
      if (mek.key?.id) {
        if (processedMessageIds.has(mek.key.id)) return;
        processedMessageIds.add(mek.key.id);
        if (processedMessageIds.size > 1000) {
          const firstKey = processedMessageIds.values().next().value;
          processedMessageIds.delete(firstKey);
        }
      }
      mek.message =
        getContentType(mek.message) === "ephemeralMessage"
          ? mek.message.ephemeralMessage.message
          : mek.message;

      // Auto-read status
      if (
        mek.key?.remoteJid === "status@broadcast" &&
        config.AUTOREADSTATUS === true
      ) {
        const participant = mek.key.participant || mek.key.remoteJid;
        const botId = conn.user?.id
          ? conn.user.id.split(":")[0] + "@s.whatsapp.net"
          : null;
        if (participant && botId) {
          await conn.sendMessage(
            mek.key.remoteJid,
            { react: { key: mek.key, text: config.EMOJI || "👸" } },
            { statusJidList: [participant, botId] }
          );
          await conn.readMessages([mek.key]);
        }
      }

      const prefix = getPrefix();
      const { sms, downloadMediaMessage } = require("./src/utils/msg");
      const {
        getBuffer,
        getGroupAdmins,
        getRandom,
        h2k,
        isUrl,
        Json,
        runtime,
        sleep,
        fetchJson,
      } = require("./src/utils/functions");

      const m = sms(conn, mek);
      const type = getContentType(mek.message);
      const from = mek.key.remoteJid;

      const body =
        type === "conversation"
          ? mek.message.conversation
          : type === "extendedTextMessage"
          ? mek.message.extendedTextMessage.text
          : type === "imageMessage" && mek.message.imageMessage.caption
          ? mek.message.imageMessage.caption
          : type === "videoMessage" && mek.message.videoMessage.caption
          ? mek.message.videoMessage.caption
          : "";

      const isCmd = body.startsWith(prefix);
      const command = isCmd
        ? body.slice(prefix.length).trim().split(" ").shift().toLowerCase()
        : "";
      const args = body.trim().split(/ +/).slice(1);
      const q = args.join(" ");
      const quoted =
        type === "extendedTextMessage" &&
        mek.message.extendedTextMessage.contextInfo != null
          ? mek.message.extendedTextMessage.contextInfo.quotedMessage || null
          : null;

      const isGroup = from.endsWith("@g.us");
      const sender = mek.key.fromMe
        ? conn.user.id.split(":")[0] + "@s.whatsapp.net"
        : mek.key.participant || mek.key.remoteJid;
      const senderNumber = sender.split("@")[0];
      const botNumber = conn.user.id.split(":")[0];
      const pushname = mek.pushName || "User";
      const isMe = botNumber.includes(senderNumber);
      const isOwner =
        ownerNumber.includes(senderNumber) ||
        isMe ||
        (config.SUDO || []).includes(senderNumber);
      const botNumber2 = await jidNormalizedUser(conn.user.id);
      const groupMetadata = isGroup
        ? await conn.groupMetadata(from).catch(() => ({}))
        : {};
      const groupName = isGroup ? groupMetadata.subject : "";
      const participants = isGroup ? groupMetadata.participants || [] : [];
      const groupAdmins = isGroup ? await getGroupAdmins(participants) : [];
      const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
      const isAdmins = isGroup ? groupAdmins.includes(sender) : false;

      const reply = (text) =>
        conn.sendMessage(from, { text }, { quoted: mek });

      const numberMatch = body.trim().match(/^(\d+)$/);
      const selectedNumber = numberMatch ? numberMatch[1] : null;
      const userId = senderNumber;
      const userAnimeState = global.animeState?.[userId] || null;
      const userStage = userAnimeState?.stage || null;

      if (!isCmd && selectedNumber) {
        if (userAnimeState && ['search', 'anime', 'range'].includes(userStage)) {
          await conn
            .sendMessage(from, { react: { text: '🔍', key: mek.key } })
            .catch(() => {});
          const commands = loadCommands();
          const animeCmd = commands.get('anime');
          if (animeCmd) {
            botStatus.messagesHandled++;
            try {
              await animeCmd.execute(conn, mek, [selectedNumber], {
                from,
                prefix,
                quoted,
                body,
                command: 'anime',
                args: [selectedNumber],
                q: selectedNumber,
                isGroup,
                reply,
              });
            } catch (err) {
              console.error('[ERROR] Anime selection execution:', err.message);
              reply('❌ Bot error during anime selection.');
            }
            return;
          }
        }
        if (userAnimeState) {
          reply(
            '❌ තේරුමක් නැහැ. ඔබගේ Anime selection session එක ගැටලුවට පත් වී ඇති අතර, නැවත .anime <search> හරහා ආරම්භ කරන්න.'
          );
          return;
        }
      }

      if (isCmd) {
        botStatus.messagesHandled++;
        handleCommand(conn, mek, m, {
          from,
          prefix,
          quoted,
          body,
          command,
          args,
          q,
          isGroup,
          sender,
          senderNumber,
          botNumber2,
          botNumber,
          pushname,
          isMe,
          isOwner,
          groupMetadata,
          groupName,
          participants,
          groupAdmins,
          isBotAdmins,
          isAdmins,
          reply,
        });
      } else {
        if (selectedNumber) {
          reply(
            '❌ මෙය command එකක් නොවේ.\nඔබ ඇතුළත් කළ අංකය සඳහා, කරුණාකර .anime සෙවීම් ප්‍රතිඵලයකට reply කරන්න.\nexample: .anime naruto'
          );
        } else if (body.trim()) {
          reply(
            '❌ මෙය command එකක් නොවේ.\ncommands: .anime <search>\nඋදාහරණය: .anime naruto'
          );
        }
      }
    } catch (err) {
      addLog(`⚠️ Message handler error: ${err.message}`);
    }
  });
}

// ----- Stop Bot -----
async function stopBot() {
  shouldReconnect = false;
  if (conn) {
    try {
      await conn.ws.close();
    } catch (_) {}
    conn = null;
  }
  botStatus.running = false;
  botStatus.connectedAt = null;
  botStatus.user = null;
  addLog("🛑 Bot stopped by user.");
}

// ----- Restart Bot -----
async function restartBot() {
  addLog("🔁 Restarting bot...");
  await stopBot();
  await new Promise((r) => setTimeout(r, 2000));
  shouldReconnect = true;
  await startBot();
}

// ----- Get Status -----
function getBotStatus() {
  return { ...botStatus };
}

module.exports = { startBot, stopBot, restartBot, getBotStatus };
