/**
 * Comprehensive Error Handling Utilities
 * Advanced error handling utilities for both frontend and backend environments
 */

/**
 * Error types enum
 */
export enum ErrorType {
  // System errors
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Business logic errors
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  
  // Application errors
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  INTEGRATION_ERROR = 'INTEGRATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Error context interface
 */
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp: Date;
  stack?: string;
  metadata?: Record<string, any>;
}

/**
 * Extended error interface
 */
export interface ExtendedError extends Error {
  type: ErrorType;
  code?: string;
  statusCode?: number;
  context: ErrorContext;
  originalError?: Error;
  details?: Record<string, any>;
}

/**
 * Base application error class
 */
export class AppError extends Error implements ExtendedError {
  public type: ErrorType;
  public code?: string;
  public statusCode?: number;
  public context: ErrorContext;
  public originalError?: Error;
  public details?: Record<string, any>;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    options: {
      code?: string;
      statusCode?: number;
      context?: Partial<ErrorContext>;
      originalError?: Error;
      details?: Record<string, any>;
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.originalError = options.originalError;
    this.details = options.details;

    // Set context
    this.context = {
      timestamp: new Date(),
      stack: this.stack,
      ...options.context,
    };

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      details: this.details,
      stack: this.context.stack,
    };
  }
}

/**
 * Specific error classes
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorType.VALIDATION_ERROR, {
      code: 'VALIDATION_FAILED',
      statusCode: 400,
      details,
    });
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, ErrorType.AUTHENTICATION_ERROR, {
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Authorization failed') {
    super(message, ErrorType.AUTHORIZATION_ERROR, {
      code: 'FORBIDDEN',
      statusCode: 403,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, ErrorType.NOT_FOUND_ERROR, {
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, ErrorType.CONFLICT_ERROR, {
      code: 'CONFLICT',
      statusCode: 409,
    });
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error', originalError?: Error) {
    super(message, ErrorType.NETWORK_ERROR, {
      code: 'NETWORK_ERROR',
      statusCode: 500,
      originalError,
    });
  }
}

export class StorageError extends AppError {
  constructor(message: string = 'Storage error', originalError?: Error) {
    super(message, ErrorType.STORAGE_ERROR, {
      code: 'STORAGE_ERROR',
      statusCode: 500,
      originalError,
    });
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'Operation timed out') {
    super(message, ErrorType.TIMEOUT_ERROR, {
      code: 'TIMEOUT',
      statusCode: 408,
    });
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, ErrorType.RATE_LIMIT_ERROR, {
      code: 'RATE_LIMITED',
      statusCode: 429,
    });
  }
}

/**
 * Error handler interface
 */
export interface ErrorHandler {
  handle(error: ExtendedError): void | Promise<void>;
}

/**
 * Console error handler
 */
export class ConsoleErrorHandler implements ErrorHandler {
  handle(error: ExtendedError): void {
    console.group(`%c${error.name} [${error.type}]`, 'color: #ff0000; font-weight: bold;');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Status:', error.statusCode);
    console.error('Context:', error.context);
    if (error.details) {
      console.error('Details:', error.details);
    }
    if (error.originalError) {
      console.error('Original Error:', error.originalError);
    }
    console.groupEnd();
  }
}

/**
 * Network error handler
 */
export class NetworkErrorHandler implements ErrorHandler {
  constructor(private endpoint: string) {}

  async handle(error: ExtendedError): Promise<void> {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: error.toJSON(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        }),
      });
    } catch (networkError) {
      console.error('Failed to send error to network handler:', networkError);
    }
  }
}

/**
 * Sentry-like error handler (simplified)
 */
export class SentryErrorHandler implements ErrorHandler {
  constructor(private dsn: string, private environment: string = 'production') {}

  async handle(error: ExtendedError): Promise<void> {
    try {
      // Simplified Sentry payload
      const payload = {
        event_id: this.generateEventId(),
        message: error.message,
        level: this.getLogLevel(error),
        exception: {
          values: [{
            type: error.name,
            value: error.message,
            stacktrace: {
              frames: this.parseStack(error.context.stack || error.stack || '')
            }
          }]
        },
        contexts: {
          os: this.getOSContext(),
          device: this.getDeviceContext(),
          app: {
            app_version: '1.0.0',
            build_type: 'release',
          },
          runtime: this.getRuntimeContext(),
        },
        environment: this.environment,
        timestamp: error.context.timestamp.toISOString(),
        extra: {
          type: error.type,
          code: error.code,
          statusCode: error.statusCode,
          details: error.details,
        }
      };

      await fetch(this.dsn, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (sendError) {
      console.error('Failed to send error to Sentry handler:', sendError);
    }
  }

  private generateEventId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private getLogLevel(error: ExtendedError): string {
    if (error.statusCode && error.statusCode >= 500) return 'error';
    if (error.statusCode && error.statusCode >= 400) return 'warning';
    return 'error';
  }

  private parseStack(stack: string): any[] {
    // Simplified stack parsing
    if (!stack) return [];
    
    const lines = stack.split('\n');
    const frames: any[] = [];
    
    for (const line of lines) {
      if (line.includes('at ')) {
        const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        if (match) {
          frames.unshift({
            function: match[1],
            filename: match[2],
            lineno: parseInt(match[3]),
            colno: parseInt(match[4]),
          });
        }
      }
    }
    
    return frames;
  }

  private getOSContext(): any {
    if (typeof navigator === 'undefined') return {};
    
    return {
      name: 'Web',
      version: navigator.appVersion,
    };
  }

  private getDeviceContext(): any {
    if (typeof screen === 'undefined') return {};
    
    return {
      screen_resolution: `${screen.width}x${screen.height}`,
      screen_density: window.devicePixelRatio || 1,
    };
  }

  private getRuntimeContext(): any {
    return {
      name: 'Browser',
      version: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };
  }
}

/**
 * Error boundary for React-like components
 */
export class ErrorBoundary {
  private hasError: boolean = false;
  private error: ExtendedError | null = null;
  private errorInfo: any = null;

  constructor(private onError?: (error: ExtendedError, info: any) => void) {}

  /**
   * Check if there's an error
   */
  hasCaughtError(): boolean {
    return this.hasError;
  }

  /**
   * Get caught error
   */
  getError(): ExtendedError | null {
    return this.error;
  }

  /**
   * Get error info
   */
  getErrorInfo(): any {
    return this.errorInfo;
  }

  /**
   * Catch an error
   */
  catchError(error: any, info: any): void {
    this.hasError = true;
    this.error = this.wrapError(error);
    this.errorInfo = info;

    if (this.onError) {
      this.onError(this.error, info);
    }
  }

  /**
   * Reset the error boundary
   */
  reset(): void {
    this.hasError = false;
    this.error = null;
    this.errorInfo = null;
  }

  /**
   * Wrap error in AppError if needed
   */
  private wrapError(error: any): ExtendedError {
    if (error instanceof AppError) {
      return error;
    }

    return new AppError(
      error.message || 'An error occurred',
      ErrorType.UNKNOWN_ERROR,
      { originalError: error instanceof Error ? error : new Error(String(error)) }
    );
  }
}

/**
 * Error handler registry
 */
export class ErrorHandlerRegistry {
  private handlers: ErrorHandler[] = [];

  /**
   * Add an error handler
   */
  addHandler(handler: ErrorHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Remove an error handler
   */
  removeHandler(handler: ErrorHandler): void {
    const index = this.handlers.indexOf(handler);
    if (index !== -1) {
      this.handlers.splice(index, 1);
    }
  }

  /**
   * Handle an error with all registered handlers
   */
  async handleError(error: ExtendedError): Promise<void> {
    // Wrap non-AppError in AppError
    const appError = error instanceof AppError ? error : 
      new AppError(error.message || 'An error occurred', ErrorType.UNKNOWN_ERROR, {
        originalError: error instanceof Error ? error : new Error(String(error))
      });

    // Handle with all registered handlers
    const promises = this.handlers.map(handler => {
      try {
        return Promise.resolve(handler.handle(appError));
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers = [];
  }
}

/**
 * Error recovery strategies
 */
export enum RecoveryStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  CIRCUIT_BREAKER = 'circuit_breaker',
  TIMEOUT = 'timeout',
}

/**
 * Circuit breaker pattern
 */
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: Date | null = null;
  private readonly failureThreshold: number;
  private readonly timeout: number;
  private readonly resetTimeout: number;

  constructor(
    options: {
      failureThreshold?: number;
      timeout?: number;
      resetTimeout?: number;
    } = {}
  ) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.timeout = options.timeout ?? 60000; // 1 minute
    this.resetTimeout = options.resetTimeout ?? 30000; // 30 seconds
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.lastFailureTime && 
          new Date().getTime() - this.lastFailureTime.getTime() > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new AppError('Circuit breaker is OPEN', ErrorType.SYSTEM_ERROR, {
          code: 'CIRCUIT_BREAKER_OPEN',
        });
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = null;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): { state: string; failureCount: number; lastFailureTime: Date | null } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
}

/**
 * Error recovery utilities
 */
export class ErrorRecovery {
  /**
   * Retry with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      baseDelay?: number;
      maxDelay?: number;
      factor?: number;
      predicate?: (error: any) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      factor = 2,
      predicate = () => true,
    } = options;

    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries || !predicate(error)) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(factor, attempt), maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Execute with fallback
   */
  static async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    options: {
      predicate?: (error: any) => boolean;
    } = {}
  ): Promise<T> {
    const { predicate = () => true } = options;

    try {
      return await primary();
    } catch (error) {
      if (predicate(error)) {
        return await fallback();
      }
      throw error;
    }
  }

  /**
   * Execute with timeout
   */
  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    message: string = 'Operation timed out'
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new TimeoutError(message));
        }, timeoutMs);
      })
    ]);
  }
}

/**
 * Global error handler
 */
export class GlobalErrorHandler {
  private registry: ErrorHandlerRegistry;
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private unhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;
  private errorHandler: ((event: ErrorEvent) => void) | null = null;

  constructor(registry: ErrorHandlerRegistry) {
    this.registry = registry;
  }

  /**
   * Enable global error handling
   */
  enable(): void {
    // Handle uncaught exceptions
    if (typeof window !== 'undefined') {
      this.errorHandler = (event: ErrorEvent) => {
        const error = event.error instanceof AppError 
          ? event.error 
          : new AppError(event.error?.message || 'Uncaught error', ErrorType.SYSTEM_ERROR, {
              originalError: event.error,
            });
        
        this.registry.handleError(error).catch(console.error);
      };

      window.addEventListener('error', this.errorHandler);

      // Handle unhandled promise rejections
      this.unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
        const error = event.reason instanceof AppError 
          ? event.reason 
          : new AppError(event.reason?.message || 'Unhandled promise rejection', ErrorType.SYSTEM_ERROR, {
              originalError: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
            });
        
        this.registry.handleError(error).catch(console.error);
        event.preventDefault(); // Prevent default browser behavior
      };

      window.addEventListener('unhandledrejection', this.unhandledRejectionHandler);
    }
  }

  /**
   * Disable global error handling
   */
  disable(): void {
    if (typeof window !== 'undefined' && this.errorHandler) {
      window.removeEventListener('error', this.errorHandler);
      this.errorHandler = null;
    }

    if (typeof window !== 'undefined' && this.unhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler);
      this.unhandledRejectionHandler = null;
    }
  }

  /**
   * Get or create a circuit breaker for a specific operation
   */
  getCircuitBreaker(operationName: string, options?: any): CircuitBreaker {
    if (!this.circuitBreakers.has(operationName)) {
      this.circuitBreakers.set(operationName, new CircuitBreaker(options));
    }
    return this.circuitBreakers.get(operationName)!;
  }

  /**
   * Clear all circuit breakers
   */
  clearCircuitBreakers(): void {
    this.circuitBreakers.clear();
  }
}

/**
 * Error handling utilities namespace
 */
export const ErrorUtils = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  NetworkError,
  StorageError,
  TimeoutError,
  RateLimitError,
  ErrorType,
  ConsoleErrorHandler,
  NetworkErrorHandler,
  SentryErrorHandler,
  ErrorBoundary,
  ErrorHandlerRegistry,
  CircuitBreaker,
  ErrorRecovery,
  GlobalErrorHandler,
  RecoveryStrategy,
};

export default ErrorUtils;