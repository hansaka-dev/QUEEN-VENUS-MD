module.exports = {
  name: "help",
  react: "❓",
  execute: async (conn, mek, args, { reply }) => {
    const helpText = `🆘 *Queen Venus MD Help*

Available Commands:
• .ping - Check bot latency
• .hello - Greeting message
• .anime <search> - Search anime on AnimeHeaven
• .anime <url> - Get anime episode info
• .menu - Show interactive menu

For more commands, use .commands

Bot by Hansaka P. Fernando
Contact: +94779912589`;

    reply(helpText);
  },
};