module.exports = {
  name: "hello",
  react: "👋",
  execute: async (conn, mek, args, { reply, pushname }) => {
    const userName = pushname || "there";
    await reply(`Hello ${userName}! 👑\nI am your Queen Venus bot. Type .help for more commands.`);
  },
};
