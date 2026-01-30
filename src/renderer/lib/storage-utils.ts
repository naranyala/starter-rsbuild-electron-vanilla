/**
 * Storage utility functions for Electron renderer process
 * Provides helper functions for localStorage, sessionStorage, and IndexedDB
 */

const StorageUtils = {
  /**
   * Save data to localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} - Success status
   */
  static setLocalStorage(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  /**
   * Get data from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} - Stored value or default
   */
  static getLocalStorage(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} - Success status
   */
  static removeLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  /**
   * Save data to sessionStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} - Success status
   */
  static setSessionStorage(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      sessionStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
      return false;
    }
  }

  /**
   * Get data from sessionStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} - Stored value or default
   */
  static getSessionStorage(key, defaultValue = null) {
    try {
      const value = sessionStorage.getItem(key);
      return value !== null ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return defaultValue;
    }
  }

  /**
   * Remove item from sessionStorage
   * @param {string} key - Storage key
   * @returns {boolean} - Success status
   */
  static removeSessionStorage(key) {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
      return false;
    }
  }

  /**
   * Clear all storage
   */
  static clearAll() {
    localStorage.clear();
    sessionStorage.clear();
  }

  /**
   * Get storage usage information
   * @returns {Object} - Storage usage info
   */
  static getUsageInfo() {
    const localStorageUsed = JSON.stringify(localStorage).length;
    const sessionStorageUsed = JSON.stringify(sessionStorage).length;

    return {
      localStorage: {
        used: localStorageUsed,
        estimatedAvailable:
          navigator.storage && navigator.storage.estimate
            ? navigator.storage.estimate().then((estimate) => estimate.quota - estimate.usage)
            : null,
      },
      sessionStorage: {
        used: sessionStorageUsed,
      },
    };
  }

  /**
   * Check if storage is available
   * @param {'localStorage'|'sessionStorage'} type - Storage type
   * @returns {boolean} - Availability status
   */
  static isStorageAvailable(type) {
    try {
      const storage = type === 'localStorage' ? localStorage : sessionStorage;
      const testKey = '__storage_test__';
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default StorageUtils;
