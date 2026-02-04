/**
 * Storage utility functions for browser/frontend environments
 * Enhanced localStorage and sessionStorage operations
 */

/**
 * Check if localStorage is available
 * @returns True if localStorage is available
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Save data to localStorage
 * @param key - Storage key
 * @param value - Value to store
 * @returns Success status
 */
export const setLocalStorage = <T>(key: string, value: T): boolean => {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

/**
 * Get data from localStorage
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns Stored value or default
 */
export const getLocalStorage = <T>(key: string, defaultValue?: T): T | undefined => {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return defaultValue;
  }

  try {
    const value = localStorage.getItem(key);
    return value !== null ? (JSON.parse(value) as T) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

/**
 * Remove item from localStorage
 * @param key - Storage key
 * @returns Success status
 */
export const removeLocalStorage = (key: string): boolean => {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};

/**
 * Clear all localStorage
 * @returns Success status
 */
export const clearLocalStorage = (): boolean => {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }

  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};
