module.exports = {
  name: "info",
  react: "ℹ️",
  execute: async (conn, mek, args, { reply }) => {
    const infoText = `👑 *Queen Venus MD Info*

Version: 1.0.3
Platform: WhatsApp Bot
Library: Baileys
Language: Node.js

Features:
• WhatsApp Web API Integration
• Plugin System
• Interactive Buttons
• Anime Search & Info
• Auto-Reconnect
• Session Management

Developer: Hansaka P. Fernando
Contact: +94779912589
GitHub: https://github.com/hansaka-dev

Use .help for command help.`;

    reply(infoText);
  },
};