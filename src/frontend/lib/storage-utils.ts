/**
 * Storage utility functions for Electron renderer process
 * Provides helper functions for localStorage, sessionStorage, and IndexedDB
 */

interface StorageType {
  localStorage: typeof localStorage;
  sessionStorage: typeof sessionStorage;
}

export class StorageUtils {
  /**
   * Save data to localStorage
   * @param key - Storage key
   * @param value - Value to store
   * @returns Success status
   */
  static setLocalStorage(key: string, value: any): boolean {
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
   * @param key - Storage key
   * @param defaultValue - Default value if key doesn't exist
   * @returns Stored value or default
   */
  static getLocalStorage(key: string, defaultValue: any = null): any {
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
   * @param key - Storage key
   * @returns Success status
   */
  static removeLocalStorage(key: string): boolean {
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
   * @param key - Storage key
   * @param value - Value to store
   * @returns Success status
   */
  static setSessionStorage(key: string, value: any): boolean {
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
   * @param key - Storage key
   * @param defaultValue - Default value if key doesn't exist
   * @returns Stored value or default
   */
  static getSessionStorage(key: string, defaultValue: any = null): any {
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
   * @param key - Storage key
   * @returns Success status
   */
  static removeSessionStorage(key: string): boolean {
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
  static clearAll(): void {
    localStorage.clear();
    sessionStorage.clear();
  }

  /**
   * Get storage usage information
   * @returns Storage usage info
   */
  static getUsageInfo(): {
    localStorage: {
      used: number;
      estimatedAvailable: Promise<{ quota: number; usage: number }> | null;
    };
    sessionStorage: {
      used: number;
    };
  } {
    const localStorageUsed = JSON.stringify(localStorage).length;
    const sessionStorageUsed = JSON.stringify(sessionStorage).length;

    return {
      localStorage: {
        used: localStorageUsed,
        estimatedAvailable: navigator.storage?.estimate
          ? navigator.storage.estimate().then((estimate: any) => ({
              quota: estimate.quota,
              usage: estimate.usage,
            }))
          : null,
      },
      sessionStorage: {
        used: sessionStorageUsed,
      },
    };
  }

  /**
   * Check if storage is available
   * @param type - Storage type
   * @returns Availability status
   */
  static isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
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
