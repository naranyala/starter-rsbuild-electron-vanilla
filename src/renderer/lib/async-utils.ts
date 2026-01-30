/**
 * Async utility functions for Electron renderer process
 * Provides helper functions for asynchronous operations
 */

class AsyncUtils {
  /**
   * Delay execution for specified time
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>} - Promise that resolves after delay
   */
  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retry a function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {*} - Result of function call
   */
  static async retry(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (i === maxRetries) {
          throw error;
        }

        // Exponential backoff: wait longer after each failure
        const delay = baseDelay * Math.pow(2, i);
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  /**
   * Execute multiple promises with limited concurrency
   * @param {Function[]} tasks - Array of functions returning promises
   * @param {number} concurrency - Number of concurrent tasks
   * @returns {Array} - Array of results
   */
  static async limitConcurrency(tasks, concurrency = 3) {
    const results = [];

    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(batch.map((task) => task()));

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push(Promise.reject(result.reason));
        }
      }
    }

    return results;
  }

  /**
   * Create a timeout for a promise
   * @param {Promise} promise - Promise to race against timeout
   * @param {number} timeoutMs - Timeout in milliseconds
   * @param {string} errorMessage - Error message for timeout
   * @returns {*} - Promise result or throws timeout error
   */
  static async timeout(promise, timeoutMs, errorMessage = 'Operation timed out') {
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Debounce a function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} - Debounced function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle a function
   * @param {Function} func - Function to throttle
   * @param {number} limit - Limit in milliseconds
   * @returns {Function} - Throttled function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Execute function only once
   * @param {Function} func - Function to execute once
   * @returns {Function} - Function that executes only once
   */
  static once(func) {
    let called = false;
    let result;

    return function (...args) {
      if (!called) {
        result = func.apply(this, args);
        called = true;
      }
      return result;
    };
  }

  /**
   * Sequentially execute an array of async functions
   * @param {Function[]} functions - Array of async functions
   * @returns {Array} - Array of results
   */
  static async sequential(functions) {
    const results = [];

    for (const fn of functions) {
      const result = await fn();
      results.push(result);
    }

    return results;
  }
}

export default AsyncUtils;
