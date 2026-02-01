/**
 * Logger utility for Electron main process
 * Provides structured logging with different levels
 */

import { format } from 'node:util';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LoggerLevels {
  error: number;
  warn: number;
  info: number;
  debug: number;
}

export class Logger {
  private level: LogLevel;
  private levels: LoggerLevels;

  constructor(level: LogLevel = 'info') {
    this.level = level;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] <= this.levels[this.level];
  }

  log(level: LogLevel, message: string, ...args: any[]): void {
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

  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }
}
