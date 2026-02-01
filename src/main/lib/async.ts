/**
 * Async utility functions for Node.js/backend environments
 * Provides helper functions for asynchronous operations
 */

import { setTimeout } from 'timers/promises';

/**
 * Environment detection
 */
export const isNode = typeof process !== 'undefined' && process.versions?.node;
export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Delay execution for specified time using Node.js timers
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export const delay = (ms: number): Promise<void> => {
  return setTimeout(ms);
};

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @returns Result of function call
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 30000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i === maxRetries) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const exponentialDelay = baseDelay * 2 ** i;
      const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
      const finalDelay = Math.min(exponentialDelay + jitter, maxDelay);

      await delay(finalDelay);
    }
  }

  throw lastError!;
};

/**
 * Execute multiple promises with limited concurrency
 * @param tasks - Array of functions returning promises
 * @param concurrency - Number of concurrent tasks
 * @returns Array of results
 */
export const limitConcurrency = async <T>(
  tasks: (() => Promise<T>)[],
  concurrency = 3
): Promise<T[]> => {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const promise = task().then((result) => {
      results.push(result);
      // Remove from executing array when done
      const index = executing.indexOf(promise);
      if (index > -1) {
        executing.splice(index, 1);
      }
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
};

/**
 * Create a timeout for a promise using Node.js AbortController
 * @param promise - Promise to race against timeout
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Error message for timeout
 * @returns Promise result or throws timeout error
 */
export const timeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> => {
  const abortController = new AbortController();

  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    abortController.signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
    });
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    abortController.abort();
    return result;
  } catch (error) {
    abortController.abort();
    throw error;
  }
};

/**
 * Debounce a function using Node.js timers
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @param immediate - Whether to execute immediately on first call
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeoutId = undefined;
      if (!immediate) {
        func(...args);
      }
    };

    const callNow = immediate && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(later, wait);

    if (callNow) {
      func(...args);
    }
  };
};

/**
 * Throttle a function using Node.js timers
 * @param func - Function to throttle
 * @param limit - Limit in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((this: any, ...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return function executedFunction(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Execute function only once
 * @param func - Function to execute once
 * @returns Function that executes only once
 */
export const once = <T extends (...args: any[]) => any>(
  func: T
): ((...args: Parameters<T>) => ReturnType<T>) => {
  let called = false;
  let result: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>): ReturnType<T> {
    if (!called) {
      result = func.apply(this, args);
      called = true;
    }
    return result;
  };
};

/**
 * Sequentially execute an array of async functions
 * @param functions - Array of async functions
 * @returns Array of results
 */
export const sequential = async <T>(functions: (() => Promise<T>)[]): Promise<T[]> => {
  const results: T[] = [];

  for (const fn of functions) {
    const result = await fn();
    results.push(result);
  }

  return results;
};

/**
 * Poll a condition until it's met or timeout occurs
 * @param condition - Function that returns boolean
 * @param interval - Polling interval in milliseconds
 * @param timeout - Maximum time to wait in milliseconds
 * @returns Promise that resolves when condition is met
 */
export const poll = async (
  condition: () => boolean | Promise<boolean>,
  interval = 1000,
  timeout = 30000
): Promise<void> => {
  const startTime = Date.now();

  while (true) {
    if (await condition()) {
      return;
    }

    if (Date.now() - startTime >= timeout) {
      throw new Error(`Polling timed out after ${timeout}ms`);
    }

    await delay(interval);
  }
};

/**
 * Create a cancellable promise using Node.js AbortController
 * @param executor - Promise executor function
 * @returns Object with promise and cancel function
 */
export const cancellable = <T>(
  executor: (
    resolve: (value: T) => void,
    reject: (reason?: unknown) => void,
    signal: AbortSignal
  ) => void
): { promise: Promise<T>; cancel: () => void } => {
  const abortController = new AbortController();

  const promise = new Promise<T>((resolve, reject) => {
    executor(
      (value) => {
        if (!abortController.signal.aborted) {
          resolve(value);
        }
      },
      (reason) => {
        if (!abortController.signal.aborted) {
          reject(reason);
        }
      },
      abortController.signal
    );

    abortController.signal.addEventListener('abort', () => {
      reject(new Error('Promise was cancelled'));
    });
  });

  const cancel = () => {
    abortController.abort();
  };

  return { promise, cancel };
};
