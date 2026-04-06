const { exec: execCmd } = require('child_process');

module.exports = {
  name: '${cmd}',
  react: '⚡',
  execute: async (conn, mek, args, context) => {
    const { reply, isOwner } = context;

    switch ('${cmd}') {
      case 'eval':
        if (!isOwner) return reply('❌ Access denied.');
        try {
          const result = await eval(args.join(' '));
          return reply(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
        } catch (err) {
          return reply('❌ Eval error: ' + err.message);
        }
      case 'exec':
      case '$_':
        if (!isOwner) return reply('❌ Access denied.');
        if (!args.length) return reply('Usage: .exec <command>');
        execCmd(args.join(' '), { maxBuffer: 1024 * 1000 }, (error, stdout, stderr) => {
          if (error) return reply('❌ Exec error: ' + error.message);
          reply(stdout ? stdout.slice(0, 1500) : stderr.slice(0, 1500) || 'Done.');
        });
        return;
      case 'join':
        if (!args.length) return reply('Usage: .join <group invite link>');
        return reply('✅ Join request received. This feature is not yet active.');
      case 'restart':
      case 'update':
        if (!isOwner) return reply('❌ Access denied.');
        return reply('✅ Restart/update command received. The bot will reboot when this feature is enabled.');
      default:
        if (!args.length) return reply('Usage: .${cmd} <parameters>');
        return reply('✅ ${cmd} plugin is ready. Feature coming soon.');
    }
  },
};
