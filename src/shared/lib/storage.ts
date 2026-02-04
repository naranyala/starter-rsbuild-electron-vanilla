/**
 * Enhanced Storage Utilities with Encryption
 * Secure storage utilities for both frontend and backend environments
 */

import type { Signal } from '../frontend/lib/reactivity';

/**
 * Storage types
 */
export type StorageType = 'localStorage' | 'sessionStorage' | 'indexedDB' | 'cookie' | 'memory';

/**
 * Storage options interface
 */
export interface StorageOptions {
  encrypt?: boolean;
  ttl?: number; // Time to live in milliseconds
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
  encryptionKey?: string;
  prefix?: string;
}

/**
 * Encrypted storage item interface
 */
export interface EncryptedStorageItem {
  data: string;
  iv: string;
  salt: string;
  createdAt: number;
  ttl?: number;
}

/**
 * Base storage interface
 */
export interface IStorage {
  getItem(key: string): any;
  setItem(key: string, value: any): void;
  removeItem(key: string): void;
  clear(): void;
  keys(): string[];
  length: number;
}

/**
 * Enhanced storage class with encryption capabilities
 */
export class EnhancedStorage implements IStorage {
  private options: Required<StorageOptions>;
  private storage: Storage | Map<string, any>;
  private readonly: boolean;

  constructor(type: StorageType = 'localStorage', options: StorageOptions = {}) {
    this.options = {
      encrypt: options.encrypt ?? false,
      ttl: options.ttl ?? 0,
      serialize: options.serialize ?? JSON.stringify,
      deserialize: options.deserialize ?? JSON.parse,
      encryptionKey: options.encryptionKey ?? 'default-key-change-me',
      prefix: options.prefix ?? 'app:',
    };

    this.readonly = false;

    switch (type) {
      case 'localStorage':
        this.storage = typeof localStorage !== 'undefined' ? localStorage : new Map();
        break;
      case 'sessionStorage':
        this.storage = typeof sessionStorage !== 'undefined' ? sessionStorage : new Map();
        break;
      case 'memory':
        this.storage = new Map();
        break;
      default:
        this.storage = new Map();
        break;
    }
  }

  /**
   * Simple XOR-based encryption (for demonstration - use proper crypto in production)
   */
  private encrypt(data: string, key: string): { encrypted: string; iv: string; salt: string } {
    if (!this.options.encrypt) {
      return { encrypted: data, iv: '', salt: '' };
    }

    // Generate random IV and salt
    const iv = this.generateRandomString(16);
    const salt = this.generateRandomString(16);
    
    // Combine key with salt
    const combinedKey = this.hashKey(key + salt);
    
    // Simple XOR encryption (not cryptographically secure, use proper crypto in production)
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      const code = data.charCodeAt(i) ^ combinedKey.charCodeAt(i % combinedKey.length);
      encrypted += String.fromCharCode(code);
    }
    
    return {
      encrypted: btoa(encrypted), // Base64 encode for storage
      iv,
      salt
    };
  }

  /**
   * Simple XOR-based decryption
   */
  private decrypt(encryptedData: string, key: string, iv: string, salt: string): string {
    if (!this.options.encrypt) {
      return encryptedData;
    }

    try {
      // Decode from base64
      const decoded = atob(encryptedData);
      
      // Combine key with salt
      const combinedKey = this.hashKey(key + salt);
      
      // Decrypt using XOR
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        const code = decoded.charCodeAt(i) ^ combinedKey.charCodeAt(i % combinedKey.length);
        decrypted += String.fromCharCode(code);
      }
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return '';
    }
  }

  /**
   * Generate a hash of the key (simple implementation)
   */
  private hashKey(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Generate random string
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Check if item has expired
   */
  private isExpired(item: EncryptedStorageItem): boolean {
    if (!item.ttl) return false;
    return Date.now() - item.createdAt > item.ttl;
  }

  /**
   * Get item from storage
   */
  getItem(key: string): any {
    const prefixedKey = this.options.prefix + key;
    
    try {
      let rawValue: string | null;
      
      if (this.storage instanceof Map) {
        rawValue = this.storage.get(prefixedKey) as string | null;
      } else {
        rawValue = this.storage.getItem(prefixedKey);
      }
      
      if (rawValue === null || rawValue === undefined) {
        return null;
      }

      // Parse the stored value
      const parsedValue: EncryptedStorageItem = this.options.deserialize(rawValue);
      
      // Check if expired
      if (this.isExpired(parsedValue)) {
        this.removeItem(key);
        return null;
      }

      // Decrypt if needed
      const decryptedData = this.decrypt(
        parsedValue.data,
        this.options.encryptionKey,
        parsedValue.iv,
        parsedValue.salt
      );

      return this.options.deserialize(decryptedData);
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  /**
   * Set item in storage
   */
  setItem(key: string, value: any): void {
    if (this.readonly) {
      throw new Error('Storage is read-only');
    }

    const prefixedKey = this.options.prefix + key;
    
    try {
      // Serialize the value
      const serializedValue = this.options.serialize(value);
      
      // Encrypt if needed
      const { encrypted, iv, salt } = this.encrypt(
        serializedValue,
        this.options.encryptionKey
      );

      // Create storage item
      const storageItem: EncryptedStorageItem = {
        data: encrypted,
        iv,
        salt,
        createdAt: Date.now(),
        ttl: this.options.ttl || undefined
      };

      const serializedItem = this.options.serialize(storageItem);

      if (this.storage instanceof Map) {
        this.storage.set(prefixedKey, serializedItem);
      } else {
        this.storage.setItem(prefixedKey, serializedItem);
      }
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    if (this.readonly) return;
    
    const prefixedKey = this.options.prefix + key;
    
    if (this.storage instanceof Map) {
      this.storage.delete(prefixedKey);
    } else {
      this.storage.removeItem(prefixedKey);
    }
  }

  /**
   * Clear all items from storage
   */
  clear(): void {
    if (this.readonly) return;
    
    if (this.storage instanceof Map) {
      // Only clear items with our prefix
      for (const key of this.storage.keys()) {
        if (key.startsWith(this.options.prefix)) {
          this.storage.delete(key);
        }
      }
    } else {
      // For web storage, we need to iterate and remove prefixed items
      const keysToRemove: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.options.prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => this.storage.removeItem(key));
    }
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    if (this.storage instanceof Map) {
      return Array.from(this.storage.keys())
        .filter(key => key.startsWith(this.options.prefix))
        .map(key => key.substring(this.options.prefix.length));
    } else {
      const keys: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.options.prefix)) {
          keys.push(key.substring(this.options.prefix.length));
        }
      }
      return keys;
    }
  }

  /**
   * Get storage length
   */
  get length(): number {
    return this.keys().length;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.getItem(key) !== null;
  }

  /**
   * Get size of storage in bytes
   */
  size(): number {
    if (this.storage instanceof Map) {
      let size = 0;
      for (const [key, value] of this.storage.entries()) {
        if (key.startsWith(this.options.prefix)) {
          size += new Blob([JSON.stringify([key, value])]).size;
        }
      }
      return size;
    } else {
      let size = 0;
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.options.prefix)) {
          const value = this.storage.getItem(key);
          size += new Blob([JSON.stringify([key, value])]).size;
        }
      }
      return size;
    }
  }

  /**
   * Set storage as read-only
   */
  setReadOnly(readonly: boolean): void {
    this.readonly = readonly;
  }

  /**
   * Get storage statistics
   */
  stats(): { length: number; size: number; keys: string[] } {
    return {
      length: this.length,
      size: this.size(),
      keys: this.keys()
    };
  }
}

/**
 * Session storage with encryption
 */
export class SecureSessionStorage extends EnhancedStorage {
  constructor(options: StorageOptions = {}) {
    super('sessionStorage', { ...options, prefix: options.prefix || 'session:' });
  }
}

/**
 * Local storage with encryption
 */
export class SecureLocalStorage extends EnhancedStorage {
  constructor(options: StorageOptions = {}) {
    super('localStorage', { ...options, prefix: options.prefix || 'local:' });
  }
}

/**
 * Memory storage with encryption
 */
export class SecureMemoryStorage extends EnhancedStorage {
  constructor(options: StorageOptions = {}) {
    super('memory', { ...options, prefix: options.prefix || 'memory:' });
  }
}

/**
 * Storage with reactive bindings
 */
export class ReactiveStorage {
  private storage: EnhancedStorage;

  constructor(type: StorageType = 'localStorage', options: StorageOptions = {}) {
    this.storage = new EnhancedStorage(type, options);
  }

  /**
   * Create a reactive signal backed by storage
   */
  createSignal<T>(key: string, initialValue: T): Signal<T> {
    // Import signal from reactivity - this is a simplified version
    // In a real implementation, we'd properly integrate with the reactivity system
    let value = this.storage.getItem(key) ?? initialValue;
    
    // For now, we'll return a simple object that mimics a signal
    // In a real implementation, this would integrate with the actual signal system
    const signalObj: any = () => value;
    signalObj.set = (newValue: T) => {
      value = newValue;
      this.storage.setItem(key, newValue);
    };
    signalObj.update = (fn: (prev: T) => T) => {
      signalObj.set(fn(signalObj()));
    };
    signalObj.subscribe = (fn: (value: T) => void) => {
      // In a real implementation, this would properly subscribe to changes
      // For now, we'll just call the function with the current value
      fn(signalObj());
      return () => {}; // Return unsubscribe function
    };
    
    return signalObj;
  }

  /**
   * Get item
   */
  get<T>(key: string): T | null {
    return this.storage.getItem(key);
  }

  /**
   * Set item
   */
  set<T>(key: string, value: T): void {
    this.storage.setItem(key, value);
  }

  /**
   * Remove item
   */
  remove(key: string): void {
    this.storage.removeItem(key);
  }

  /**
   * Clear storage
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.storage.has(key);
  }
}

/**
 * Cookie utilities
 */
export class CookieUtils {
  /**
   * Set cookie with options
   */
  static set(
    name: string,
    value: string,
    options: {
      expires?: Date;
      maxAge?: number;
      domain?: string;
      path?: string;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: 'Strict' | 'Lax' | 'None';
    } = {}
  ): void {
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    
    if (options.expires) {
      cookie += `; Expires=${options.expires.toUTCString()}`;
    }
    
    if (options.maxAge) {
      cookie += `; Max-Age=${options.maxAge}`;
    }
    
    if (options.domain) {
      cookie += `; Domain=${options.domain}`;
    }
    
    if (options.path) {
      cookie += `; Path=${options.path}`;
    }
    
    if (options.secure) {
      cookie += '; Secure';
    }
    
    if (options.httpOnly) {
      cookie += '; HttpOnly';
    }
    
    if (options.sameSite) {
      cookie += `; SameSite=${options.sameSite}`;
    }
    
    document.cookie = cookie;
  }

  /**
   * Get cookie value
   */
  static get(name: string): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (decodeURIComponent(cookieName) === name) {
        return decodeURIComponent(cookieValue || '');
      }
    }
    return null;
  }

  /**
   * Remove cookie
   */
  static remove(name: string, path: string = '/', domain?: string): void {
    const expires = new Date(0);
    this.set(name, '', { expires, path, domain });
  }

  /**
   * Get all cookies
   */
  static getAll(): Record<string, string> {
    const cookies: Record<string, string> = {};
    const cookiePairs = document.cookie.split(';');
    
    for (const pair of cookiePairs) {
      const [name, value] = pair.trim().split('=');
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value);
      }
    }
    
    return cookies;
  }
}

/**
 * IndexedDB utilities
 */
export class IndexedDBUtils {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private version: number;

  constructor(dbName: string = 'AppDB', version: number = 1) {
    this.dbName = dbName;
    this.version = version;
  }

  /**
   * Initialize IndexedDB
   */
  async init(storeNames: string[] = ['default']): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        for (const storeName of storeNames) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
          }
        }
      };
    });
  }

  /**
   * Get item from store
   */
  async getItem<T>(storeName: string, key: string | number): Promise<T | null> {
    if (!this.db) {
      await this.init([storeName]);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Set item in store
   */
  async setItem<T>(storeName: string, key: string | number, value: T): Promise<void> {
    if (!this.db) {
      await this.init([storeName]);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({ ...value, id: key });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove item from store
   */
  async removeItem(storeName: string, key: string | number): Promise<void> {
    if (!this.db) {
      await this.init([storeName]);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear store
   */
  async clear(storeName: string): Promise<void> {
    if (!this.db) {
      await this.init([storeName]);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Close database
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * Storage utilities namespace
 */
export const StorageUtils = {
  EnhancedStorage,
  SecureLocalStorage,
  SecureSessionStorage,
  SecureMemoryStorage,
  ReactiveStorage,
  CookieUtils,
  IndexedDBUtils,
};

export default StorageUtils;