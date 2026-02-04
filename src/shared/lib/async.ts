/**
 * Advanced Async Utilities
 * Comprehensive async utilities for both frontend and backend environments
 */

/**
 * Result type for async operations
 */
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

/**
 * Async sleep function
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  options: {
    retries: number;
    delay?: number;
    maxDelay?: number;
    backoff?: 'linear' | 'exponential';
    onRetry?: (attempt: number, error: any) => void;
  } = { retries: 3, delay: 1000 }
): Promise<T> => {
  const { retries, delay = 1000, maxDelay = 30000, backoff = 'exponential', onRetry } = options;
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === retries) {
        throw error;
      }
      
      if (onRetry) {
        onRetry(attempt, error);
      }
      
      // Calculate delay with backoff strategy
      let currentDelay: number;
      if (backoff === 'exponential') {
        currentDelay = Math.min(delay * Math.pow(2, attempt - 1), maxDelay);
      } else {
        currentDelay = delay * attempt;
      }
      
      await sleep(currentDelay);
    }
  }
  
  throw lastError;
};

/**
 * Timeout wrapper for promises
 */
export const withTimeout = <T>(promise: Promise<T>, ms: number, message: string = 'Operation timed out'): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(message)), ms)
    )
  ]);
};

/**
 * Debounce function for async operations
 */
export const debounceAsync = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
  let timeoutId: any;
  let currentPromise: Promise<any> | null = null;

  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (currentPromise) {
      // Cancel previous promise if possible (requires cancellation token pattern)
      // For now, we'll just let it run but return the new one
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
};

/**
 * Throttle function for async operations
 */
export const throttleAsync = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
  let lastCall = 0;
  let currentPromise: Promise<any> | null = null;

  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      currentPromise = fn(...args);
      return currentPromise;
    }

    // If we're within the throttle window, return the last promise
    if (currentPromise) {
      return currentPromise;
    }

    // If no ongoing promise, wait until we can call again
    await sleep(delay - (now - lastCall));
    lastCall = Date.now();
    currentPromise = fn(...args);
    return currentPromise;
  };
};

/**
 * Rate limiter utility
 */
export class RateLimiter {
  private queue: Array<() => void> = [];
  private activeCount = 0;
  private intervalId: any;

  constructor(
    private maxConcurrent: number = 5,
    private interval: number = 1000 // ms
  ) {
    this.startInterval();
  }

  private startInterval(): void {
    this.intervalId = setInterval(() => {
      this.activeCount = 0;
      this.processQueue();
    }, this.interval);
  }

  private processQueue(): void {
    while (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
      const next = this.queue.shift();
      if (next) {
        this.activeCount++;
        next();
      }
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          const result = await fn();
          this.activeCount--;
          this.processQueue();
          resolve(result);
        } catch (error) {
          this.activeCount--;
          this.processQueue();
          reject(error);
        }
      };

      if (this.activeCount < this.maxConcurrent) {
        this.activeCount++;
        task();
      } else {
        this.queue.push(task);
      }
    });
  }

  destroy(): void {
    clearInterval(this.intervalId);
    this.queue = [];
  }
}

/**
 * Concurrent execution with limits
 */
export const concurrent = async <T>(
  tasks: Array<() => Promise<T>>,
  options: {
    concurrency?: number;
    stopOnError?: boolean;
  } = {}
): Promise<T[]> => {
  const { concurrency = 5, stopOnError = false } = options;
  const results: T[] = [];
  const errors: any[] = [];

  if (tasks.length === 0) return [];

  const rateLimiter = new RateLimiter(concurrency);

  const promises = tasks.map(async (task, index) => {
    try {
      const result = await rateLimiter.execute(task);
      results[index] = result;
      return result;
    } catch (error) {
      errors[index] = error;
      if (stopOnError) {
        throw error;
      }
      return undefined as any;
    }
  });

  await Promise.all(promises);

  rateLimiter.destroy();

  if (errors.length > 0 && stopOnError) {
    throw errors[0];
  }

  return results.filter(result => result !== undefined);
};

/**
 * Sequential execution with progress tracking
 */
export const sequential = async <T>(
  tasks: Array<() => Promise<T>>,
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<T[]> => {
  const results: T[] = [];
  const total = tasks.length;

  for (let i = 0; i < total; i++) {
    try {
      const result = await tasks[i]();
      results.push(result);
      
      if (onProgress) {
        onProgress((i + 1) / total, i + 1, total);
      }
    } catch (error) {
      throw error;
    }
  }

  return results;
};

/**
 * Promise pool with configurable concurrency
 */
export class PromisePool<T> {
  private running: number = 0;
  private index: number = 0;
  private results: T[] = [];
  private errors: any[] = [];

  constructor(
    private tasks: Array<() => Promise<T>>,
    private concurrency: number = 3
  ) {}

  async run(): Promise<{ results: T[]; errors: any[] }> {
    while (this.index < this.tasks.length || this.running > 0) {
      if (this.index < this.tasks.length && this.running < this.concurrency) {
        this.startNext();
      }
      await sleep(10);
    }

    return { results: this.results, errors: this.errors };
  }

  private startNext(): void {
    const task = this.tasks[this.index++];
    this.running++;

    task()
      .then(result => {
        this.results.push(result);
      })
      .catch(error => {
        this.errors.push(error);
      })
      .finally(() => {
        this.running--;
      });
  }
}

/**
 * Async map with concurrency control
 */
export const asyncMap = async <T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  options: {
    concurrency?: number;
    stopOnError?: boolean;
  } = {}
): Promise<R[]> => {
  const { concurrency = 5, stopOnError = false } = options;
  const tasks = items.map((item, index) => () => mapper(item, index));
  
  return concurrent(tasks, { concurrency, stopOnError });
};

/**
 * Async filter with concurrency control
 */
export const asyncFilter = async <T>(
  items: T[],
  predicate: (item: T, index: number) => Promise<boolean>,
  options: {
    concurrency?: number;
    stopOnError?: boolean;
  } = {}
): Promise<T[]> => {
  const { concurrency = 5, stopOnError = false } = options;
  const results = await asyncMap(items, async (item, index) => {
    const passes = await predicate(item, index);
    return passes ? item : undefined;
  }, { concurrency, stopOnError });

  return results.filter((item): item is T => item !== undefined);
};

/**
 * Async reduce with concurrency control
 */
export const asyncReduce = async <T, R>(
  items: T[],
  reducer: (acc: R, item: T, index: number) => Promise<R>,
  initialValue: R,
  options: {
    concurrency?: number;
    stopOnError?: boolean;
  } = {}
): Promise<R> => {
  let accumulator = initialValue;
  
  for (let i = 0; i < items.length; i++) {
    accumulator = await reducer(accumulator, items[i], i);
  }
  
  return accumulator;
};

/**
 * Create a cancellable promise
 */
export interface CancellablePromise<T> extends Promise<T> {
  cancel: () => void;
}

export const cancellable = <T>(promiseFactory: () => Promise<T>): CancellablePromise<T> => {
  let cancelled = false;
  
  const wrappedPromise = new Promise<T>((resolve, reject) => {
    const handlePromise = async () => {
      try {
        if (!cancelled) {
          const result = await promiseFactory();
          if (!cancelled) {
            resolve(result);
          }
        }
      } catch (error) {
        if (!cancelled) {
          reject(error);
        }
      }
    };
    
    handlePromise();
  }) as CancellablePromise<T>;
  
  wrappedPromise.cancel = () => {
    cancelled = true;
  };
  
  return wrappedPromise;
};

/**
 * Async memoization with TTL
 */
export class AsyncMemoizer<T> {
  private cache = new Map<string, { value: T; timestamp: number; promise?: Promise<T> }>();
  
  constructor(private ttl: number = 5 * 60 * 1000) {} // 5 minutes default
  
  async get(
    key: string,
    factory: () => Promise<T>
  ): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached) {
      // Check if cache is still valid
      if (Date.now() - cached.timestamp < this.ttl) {
        if (cached.promise) {
          // Return the ongoing promise if it exists
          return cached.promise;
        }
        return cached.value;
      } else {
        // Cache expired, remove it
        this.cache.delete(key);
      }
    }
    
    // Create a new promise and store it temporarily
    const promise = factory();
    this.cache.set(key, { value: undefined as any, timestamp: Date.now(), promise });
    
    try {
      const value = await promise;
      // Update cache with actual value
      this.cache.set(key, { value, timestamp: Date.now() });
      return value;
    } catch (error) {
      // Remove failed promise from cache
      this.cache.delete(key);
      throw error;
    }
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}

/**
 * Async semaphore
 */
export class Semaphore {
  private permits: number;
  private queue: Array<(value: void) => void> = [];

  constructor(count: number) {
    this.permits = count;
  }

  async acquire(): Promise<void> {
    return new Promise<void>(resolve => {
      if (this.permits > 0) {
        this.permits--;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      if (resolve) {
        resolve();
      }
    } else {
      this.permits++;
    }
  }

  availablePermits(): number {
    return this.permits;
  }
}

/**
 * Async mutex
 */
export class Mutex {
  private locked = false;
  private queue: Array<() => void> = [];

  async acquire(): Promise<() => void> {
    return new Promise<void>(resolve => {
      if (!this.locked) {
        this.locked = true;
        resolve(() => {
          this.release();
        });
      } else {
        this.queue.push(() => {
          this.locked = true;
          resolve(() => {
            this.release();
          });
        });
      }
    });
  }

  private release(): void {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      if (resolve) {
        resolve();
      }
    } else {
      this.locked = false;
    }
  }
}

/**
 * Wrap async function to return Result type
 */
export const toResult = async <T, E = Error>(
  promise: Promise<T>
): Promise<Result<T, E>> => {
  try {
    const data = await promise;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as E };
  }
};

/**
 * Async utilities namespace
 */
export const AsyncUtils = {
  sleep,
  retry,
  withTimeout,
  debounce: debounceAsync,
  throttle: throttleAsync,
  RateLimiter,
  concurrent,
  sequential,
  PromisePool,
  asyncMap,
  asyncFilter,
  asyncReduce,
  cancellable,
  AsyncMemoizer,
  Semaphore,
  Mutex,
  toResult,
};

export default AsyncUtils;