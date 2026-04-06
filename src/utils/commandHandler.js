const fs = require("fs");
const path = require("path");

/**
 * Dynamically loads all command files from given directories.
 */
const loadCommands = () => {
  const commands = new Map();
  // Source commands and exterior plugins
  const searchDirs = [
    path.join(__dirname, "../commands"),    // src/commands
    path.join(__dirname, "../../commands"), // root/commands
    path.join(__dirname, "../../plugins")  // root/plugins
  ];

  for (const resolvedDir of searchDirs) {
    if (!fs.existsSync(resolvedDir)) continue;

    try {
      const commandFiles = fs.readdirSync(resolvedDir).filter((f) => f.endsWith(".js"));

      for (const file of commandFiles) {
        try {
          const commandPath = path.join(resolvedDir, file);
          delete require.cache[require.resolve(commandPath)];
          const commandsFromFile = require(commandPath);

          const register = (cmd) => {
            if (cmd.name && typeof cmd.execute === "function") {
              commands.set(cmd.name, cmd);
            }
          };

          if (Array.isArray(commandsFromFile)) {
            commandsFromFile.forEach(register);
          } else {
            register(commandsFromFile);
          }
        } catch (err) {
          console.error(`[ERROR] Failed to load "${file}":`, err.message);
        }
      }
    } catch (err) {
      console.error(`[ERROR] Failed to read directory "${resolvedDir}":`, err.message);
    }
  }

  return commands;
};

function handleCommand(conn, mek, m, context) {
  const { from, command, reply, isOwner } = context;

  const commands = loadCommands();
  const cmd = commands.get(command);

  if (!cmd) return;

  if (cmd.ownerOnly && !isOwner) {
    reply("❌ Private command. Access denied.");
    return;
  }

  // Common flags for commands (reacting, etc can be added here)
  if (cmd.react && conn) {
    conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } }).catch(() => {});
  }

  try {
    cmd.execute(conn, mek, context.args, context);
  } catch (err) {
    console.error(`[ERROR] Execution error: ${err.message}`);
    reply("❌ An internal error occurred.");
  }
}

module.exports = { loadCommands, handleCommand };
