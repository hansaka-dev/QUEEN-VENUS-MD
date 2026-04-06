// log-store.js — Shared log store with EventEmitter for SSE streaming
const EventEmitter = require('events');

const emitter = new EventEmitter();
emitter.setMaxListeners(100);

const logs = [];

function addLog(message) {
  const entry = { time: new Date().toISOString(), message };
  logs.push(entry);
  if (logs.length > 500) logs.shift();
  console.log(`[Queen Venus] ${message}`);
  emitter.emit('log', entry);
}

function getLogs() {
  return [...logs];
}

module.exports = { addLog, getLogs, emitter };
