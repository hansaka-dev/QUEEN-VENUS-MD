module.exports = {
  name: "ping",
  react: "🏓",
  execute: async (conn, mek, args, { reply }) => {
    const start = new Date().getTime();
    await reply("Pinging... ⚡");
    const end = new Date().getTime();
    const ping = end - start;
    await reply(`🏓 *Pong!*\nLatency: \`${ping}ms\`\nStatus: \`Online ✅\``);
  }
};
