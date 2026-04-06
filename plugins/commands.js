const { loadCommands } = require('../src/utils/commandHandler');
const { runtime } = require('../src/utils/functions');

module.exports = {
  name: 'commands',
  react: '📜',
  execute: async (conn, mek, args, { reply }) => {
    const commands = loadCommands();
    const cmdList = Array.from(commands.keys()).sort();
    const uptimeText = runtime(process.uptime());
    const owner = 'Hansaka Fernando';
    const prefix = '.';
    const venusImage = 'https://files.catbox.moe/2clq4z.jpeg';

    const caption = `╔════════════════════════════════════════╗
║       👑 𝐐𝐔𝐄𝐄𝐍 𝐕𝐄𝐍𝐔𝐒 𝐔𝐋𝐓𝐑𝐀 👑        ║
╠════════════════════════════════════════╣
║ ❖ 𝐎𝐰𝐧𝐞𝐫: ${owner}
║ ❖ 𝐌𝐨𝐝𝐞: Multi-Device (Baileys)
║ ❖ 𝐏𝐫𝐞𝐟𝐢𝐱: [ ${prefix} ]
║ ❖ 𝐔𝐩𝐭𝐢𝐦𝐞: ${uptimeText}
╚════════════════════════════════════════╝

╔══⟪ 🌌 𝐀𝐝𝐯𝐚𝐧𝐜𝐞𝐝 𝐀𝐈 𝐍𝐞𝐱𝐮𝐬 ⟫══❍
╟ ⚡ _.chatgpt [text]_ - GPT-4 AI 
╟ ⚡ _.gemini [text]_ - Google Vision AI
╟ ⚡ _.olya [text]_ - Custom Private AI
╟ ⚡ _.midjourney_ - High-Res Image Generation
╟ ⚡ _.voiceai [text]_ - AI Voice Synthesis
╚════════════════════════════════════════❍

╔══⟪ 🛠️ 𝐄𝐥𝐢𝐭𝐞 𝐈𝐦𝐚𝐠𝐞 𝐏𝐫𝐨𝐜𝐞𝐬𝐬𝐢𝐧𝐠 ⟫══❍
╟ ⚡ _.remini_ - 4K Image Upscaling
╟ ⚡ _.removebg_ - AI Background Remover
╟ ⚡ _.colorize_ - Colorize Old/B&W Photos
╟ ⚡ _.cartoon_ - Turn Portrait to Cartoon
╚════════════════════════════════════════❍

╔══⟪ 🎬 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐌𝐞𝐝𝐢𝐚 𝐇𝐮𝐛 ⟫══❍
╟ ⚡ _.play [song]_ - 320kbps Audio Download
╟ ⚡ _.ytmp4 [link]_ - 1080p/4K Video Download
╟ ⚡ _.igstory [username]_ - IG Story Downloader
╟ ⚡ _.spotify [link]_ - Spotify Track/Playlist
╟ ⚡ _.netflix [movie]_ - Netflix Movie Search
╚════════════════════════════════════════❍

╔══⟪ 🕵️ 𝐎𝐒𝐈𝐍𝐓 & 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 ⟫══❍
╟ ⚡ _.truecaller [number]_ - Global Number Lookup
╟ ⚡ _.githubstalk [user]_ - GitHub Profile Info
╟ ⚡ _.ipinfo [ip]_ - IP Address Tracking
╟ ⚡ _.weather [city]_ - Live Weather Data
╚════════════════════════════════════════❍

╔══⟪ 🛡️ 𝐒𝐮𝐩𝐫𝐞𝐦𝐞 𝐒𝐞𝐜𝐮𝐫𝐢𝐭𝐲 & 𝐀𝐝𝐦𝐢𝐧 ⟫══❍
╟ ⚡ _.antilink [on/off]_ - Auto Kick Link Senders
╟ ⚡ _.antispam [on/off]_ - Prevent Spam Messages
╟ ⚡ _.antibot [on/off]_ - Ban Other Bots
╟ ⚡ _.autosticker [on/off]_ - Auto Convert Image to Sticker
╟ ⚡ _.nsfw [on/off]_ - Adult Content Filter
╚════════════════════════════════════════❍

╔══⟪ ⚙️ 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫 𝐂𝐨𝐫𝐞 ⟫══❍
╟ ⚡ _.eval / >_ - Execute Node.js Code
╟ ⚡ _.exec / $_ - Shell / Terminal Commands
╟ ⚡ _.join [link]_ - Force Bot to Join Group
╟ ⚡ _.restart / .update_ - System Reboot & Sync
╚════════════════════════════════════════❍
> _"Architected for Perfection. Built for Power." ✨

*Total Commands: ${cmdList.length}*
${cmdList.map((cmd) => `• .${cmd}`).join('\n')}`;

    try {
      await conn.sendMessage(mek.key.remoteJid, {
        image: { url: venusImage },
        caption,
      });
    } catch (error) {
      reply(caption);
    }
  },
};