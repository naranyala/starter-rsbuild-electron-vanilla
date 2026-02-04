/**
 * Enhanced Logging and Monitoring Utilities
 * Comprehensive logging and monitoring utilities for both frontend and backend
 */

import type { Signal } from '../frontend/lib/reactivity';

/**
 * Log levels enum
 */
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Log entry interface
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
  meta?: Record<string, any>;
}

/**
 * Logger configuration interface
 */
export interface LoggerConfig {
  level?: LogLevel;
  format?: 'json' | 'text';
  transports?: Transport[];
  enableConsole?: boolean;
  enableFile?: boolean;
  enableNetwork?: boolean;
  maxFileSize?: number;
  retentionDays?: number;
  redact?: string[];
}

/**
 * Transport interface
 */
export interface Transport {
  log(entry: LogEntry): void | Promise<void>;
}

/**
 * Console transport
 */
export class ConsoleTransport implements Transport {
  log(entry: LogEntry): void {
    const message = this.formatLog(entry);
    switch (entry.level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message);
        break;
    }
  }

  private formatLog(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(7);
    const message = entry.message;
    
    let formatted = `[${timestamp}] ${level} ${message}`;
    
    if (entry.context) {
      formatted += ` | Context: ${JSON.stringify(entry.context)}`;
    }
    
    if (entry.error) {
      formatted += ` | Error: ${entry.error.stack || entry.error.message}`;
    }
    
    return formatted;
  }
}

/**
 * File transport (stub for browser compatibility)
 */
export class FileTransport implements Transport {
  private buffer: LogEntry[] = [];
  private flushInterval: any;

  constructor(private filename: string, private maxSize: number = 10 * 1024 * 1024) {
    // Set up periodic flushing
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000); // Flush every 5 seconds
  }

  log(entry: LogEntry): void {
    this.buffer.push(entry);
    
    // If buffer is getting large, flush immediately
    if (this.buffer.length > 100) {
      this.flush();
    }
  }

  private flush(): void {
    if (this.buffer.length === 0) return;

    // In a real implementation, this would write to a file
    // For browser compatibility, we'll just log to console
    console.log(`[FILE LOG] Flushing ${this.buffer.length} entries to ${this.filename}`);
    
    // Clear buffer
    this.buffer = [];
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush(); // Flush remaining entries
  }
}

/**
 * Network transport
 */
export class NetworkTransport implements Transport {
  constructor(
    private endpoint: string,
    private options: { 
      batchSize?: number; 
      flushInterval?: number; 
      headers?: Record<string, string> 
    } = {}
  ) {
    const batchSize = options.batchSize || 10;
    const flushInterval = options.flushInterval || 10000;
    
    // Set up periodic flushing
    setInterval(() => {
      this.flush();
    }, flushInterval);
  }

  private batch: LogEntry[] = [];

  log(entry: LogEntry): void {
    this.batch.push(entry);
    
    if (this.batch.length >= (this.options.batchSize || 10)) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    try {
      const entries = [...this.batch];
      this.batch = [];

      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.options.headers,
        },
        body: JSON.stringify(entries),
      });
    } catch (error) {
      console.error('Failed to send logs to network:', error);
      // Add entries back to batch for retry
      this.batch.push(...this.batch);
    }
  }
}

/**
 * Main logger class
 */
export class Logger {
  private level: LogLevel;
  private transports: Transport[];
  private enableConsole: boolean;
  private enableFile: boolean;
  private enableNetwork: boolean;
  private redactFields: string[];

  constructor(config: LoggerConfig = {}) {
    this.level = config.level || LogLevel.INFO;
    this.redactFields = config.redact || [];
    this.enableConsole = config.enableConsole ?? true;
    this.enableFile = config.enableFile ?? false;
    this.enableNetwork = config.enableNetwork ?? false;

    this.transports = config.transports || [];

    if (this.enableConsole) {
      this.transports.push(new ConsoleTransport());
    }

    if (this.enableFile) {
      this.transports.push(new FileTransport('app.log', config.maxFileSize));
    }

    if (this.enableNetwork) {
      this.transports.push(new NetworkTransport('/api/logs'));
    }
  }

  /**
   * Log a message
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (this.shouldLog(level)) {
      const entry: LogEntry = {
        level,
        message,
        timestamp: new Date(),
        context: this.redactSensitiveData(context),
        error,
        meta: {
          pid: typeof process !== 'undefined' ? process.pid : 'browser',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        },
      };

      // Send to all transports
      for (const transport of this.transports) {
        try {
          transport.log(entry);
        } catch (transportError) {
          console.error('Transport error:', transportError);
        }
      }
    }
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = [
      LogLevel.TRACE,
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.FATAL,
    ];

    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  /**
   * Redact sensitive data
   */
  private redactSensitiveData(obj: Record<string, any> | undefined): Record<string, any> | undefined {
    if (!obj) return obj;

    const redacted = { ...obj };
    for (const field of this.redactFields) {
      if (field in redacted) {
        redacted[field] = '[REDACTED]';
      }
    }
    return redacted;
  }

  // Level-specific methods
  trace(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Add transport
   */
  addTransport(transport: Transport): void {
    this.transports.push(transport);
  }

  /**
   * Remove transport
   */
  removeTransport(transport: Transport): void {
    const index = this.transports.indexOf(transport);
    if (index !== -1) {
      this.transports.splice(index, 1);
    }
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures = new Map<string, { start: string; end: string; duration: number }>();

  /**
   * Start a performance measurement
   */
  startMark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * End a performance measurement
   */
  endMark(name: string, startMark?: string): number {
    const end = performance.now();
    const start = startMark ? this.marks.get(startMark) : this.marks.get(name);
    
    if (start === undefined) {
      throw new Error(`Start mark "${startMark || name}" not found`);
    }

    const duration = end - start;
    this.measures.set(name, { 
      start: startMark || name, 
      end: name, 
      duration 
    });

    return duration;
  }

  /**
   * Measure a function execution
   */
  async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    this.startMark(name);
    try {
      const result = await Promise.resolve(fn());
      this.endMark(name);
      return result;
    } catch (error) {
      this.endMark(name);
      throw error;
    }
  }

  /**
   * Get measurement
   */
  getMeasure(name: string): { start: string; end: string; duration: number } | undefined {
    return this.measures.get(name);
  }

  /**
   * Get all measurements
   */
  getAllMeasures(): Map<string, { start: string; end: string; duration: number }> {
    return new Map(this.measures);
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }

  /**
   * Get memory usage (where available)
   */
  getMemoryUsage(): { used: number; total: number; limit?: number } | null {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      return {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
        limit: mem.jsHeapSizeLimit,
      };
    }
    return null;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): {
    navigation: any;
    paint: any;
    resources: any;
    memory?: { used: number; total: number; limit?: number };
  } {
    const metrics: any = {
      navigation: performance.getEntriesByType('navigation')[0],
      paint: performance.getEntriesByType('paint'),
      resources: performance.getEntriesByType('resource'),
    };

    const memory = this.getMemoryUsage();
    if (memory) {
      metrics.memory = memory;
    }

    return metrics;
  }
}

/**
 * Error tracking utilities
 */
export class ErrorTracker {
  private logger: Logger;
  private errorHandler: ((error: Error, info?: any) => void) | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Track an error
   */
  track(error: Error, context?: Record<string, any>): void {
    this.logger.error(error.message, context, error);
  }

  /**
   * Track an async error
   */
  async trackAsync(promise: Promise<any>): Promise<void> {
    try {
      await promise;
    } catch (error) {
      this.track(error as Error);
      throw error;
    }
  }

  /**
   * Set global error handler
   */
  setGlobalHandler(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.track(event.error, { 
          message: event.message, 
          filename: event.filename, 
          lineno: event.lineno, 
          colno: event.colno 
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.track(event.reason as Error, { 
          promise: event.promise,
          reason: event.reason 
        });
      });
    }
  }

  /**
   * Wrap a function with error tracking
   */
  wrap<T extends (...args: any[]) => any>(fn: T): T {
    const self = this;
    return function (...args: any[]) {
      try {
        const result = fn.apply(this, args);
        if (result instanceof Promise) {
          return self.trackAsync(result);
        }
        return result;
      } catch (error) {
        self.track(error as Error);
        throw error;
      }
    } as T;
  }
}

/**
 * Metrics collector
 */
export class MetricsCollector {
  private counters = new Map<string, number>();
  private timers = new Map<string, number[]>();
  private gauges = new Map<string, number>();

  /**
   * Increment a counter
   */
  increment(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  /**
   * Decrement a counter
   */
  decrement(name: string, value: number = 1): void {
    this.increment(name, -value);
  }

  /**
   * Record a timing
   */
  recordTiming(name: string, duration: number): void {
    if (!this.timers.has(name)) {
      this.timers.set(name, []);
    }
    this.timers.get(name)!.push(duration);
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  /**
   * Get metrics snapshot
   */
  getSnapshot(): {
    counters: Map<string, number>;
    timers: Map<string, { count: number; avg: number; min: number; max: number }>;
    gauges: Map<string, number>;
  } {
    const timerStats = new Map();
    
    for (const [name, values] of this.timers) {
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        timerStats.set(name, {
          count: values.length,
          avg: sum / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
        });
      }
    }

    return {
      counters: new Map(this.counters),
      timers: timerStats,
      gauges: new Map(this.gauges),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.counters.clear();
    this.timers.clear();
    this.gauges.clear();
  }
}

/**
 * Application monitor that combines logging, performance, and metrics
 */
export class AppMonitor {
  public logger: Logger;
  public performance: PerformanceMonitor;
  public errorTracker: ErrorTracker;
  public metrics: MetricsCollector;

  constructor(config: LoggerConfig = {}) {
    this.logger = new Logger(config);
    this.performance = new PerformanceMonitor();
    this.metrics = new MetricsCollector();
    this.errorTracker = new ErrorTracker(this.logger);
  }

  /**
   * Start monitoring
   */
  start(): void {
    this.errorTracker.setGlobalHandler();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    // Cleanup operations
    this.performance.clear();
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, { status: boolean; message?: string }>;
    timestamp: Date;
  } {
    const checks: Record<string, { status: boolean; message?: string }> = {};

    // Check memory usage
    const memory = this.performance.getMemoryUsage();
    if (memory && memory.limit) {
      const usagePercent = (memory.used / memory.limit) * 100;
      checks.memory = {
        status: usagePercent < 80,
        message: `Memory usage: ${usagePercent.toFixed(2)}%`
      };
    }

    // Check metrics
    const metrics = this.metrics.getSnapshot();
    checks.metrics = {
      status: true,
      message: `Counters: ${metrics.counters.size}, Timers: ${metrics.timers.size}`
    };

    // Overall status
    const allHealthy = Object.values(checks).every(check => check.status);
    const status = allHealthy ? 'healthy' : 'degraded';

    return {
      status,
      checks,
      timestamp: new Date()
    };
  }
}

/**
 * Monitoring utilities namespace
 */
export const MonitoringUtils = {
  Logger,
  LogLevel,
  ConsoleTransport,
  FileTransport,
  NetworkTransport,
  PerformanceMonitor,
  ErrorTracker,
  MetricsCollector,
  AppMonitor,
};

export default MonitoringUtils;