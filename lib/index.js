const { Writable } = require('stream');
const errsole = require('errsole');

class PinoErrsoleTransport extends Writable {
  constructor (opts = {}) {
    super({ ...opts, objectMode: false });
  }

  _write (chunk, encoding, callback) {
    const chunkStr = typeof chunk === 'string' ? chunk : chunk.toString();
    const lines = chunkStr.split(/\r?\n/).filter(line => line.trim() !== '');

    lines.forEach(line => {
      let logEntry;
      try {
        logEntry = JSON.parse(line);
      } catch (err) {
        console.error('Invalid log chunk:', line);
        return;
      }

      const { level, msg, message, ...extraMeta } = logEntry;
      const logMessage = msg || message || '';
      let errsoleLevel = 'info';
      if (level === 60 || level === 50) {
        errsoleLevel = 'error';
      } else if (level === 40) {
        errsoleLevel = 'warn';
      } else if (level === 30 || level === 10) {
        errsoleLevel = 'info';
      } else {
        errsoleLevel = 'debug';
      }

      try {
        if (typeof errsole[errsoleLevel] === 'function') {
          if (Object.keys(extraMeta).length > 0) {
            errsole.meta(extraMeta)[errsoleLevel](logMessage);
          } else {
            errsole[errsoleLevel](logMessage);
          }
        }
      } catch (error) {
        console.error('Error writing to Errsole:', error);
      }
    });

    callback();
  }
}

// ✅ Modern transport (pino.transport)
function createTransport (opts) {
  return new PinoErrsoleTransport(opts);
}

// ✅ Legacy usage (stream style)
createTransport.PinoErrsoleTransport = PinoErrsoleTransport;

module.exports = createTransport;
