/**
 * Logger utility for Electron main process
 * Provides structured logging with different levels
 */

const { format } = require('node:util');

class Logger {
  constructor(level = 'info') {
    this.level = level;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  log(level, message, ...args) {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const formattedMessage = args.length > 0 ? format(message, ...args) : message;
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${formattedMessage}`;

    switch (level) {
      case 'error':
        console.error(logEntry);
        break;
      case 'warn':
        console.warn(logEntry);
        break;
      default:
        console.log(logEntry);
    }
  }

  error(message, ...args) {
    this.log('error', message, ...args);
  }

  warn(message, ...args) {
    this.log('warn', message, ...args);
  }

  info(message, ...args) {
    this.log('info', message, ...args);
  }

  debug(message, ...args) {
    this.log('debug', message, ...args);
  }
}

module.exports = Logger;
