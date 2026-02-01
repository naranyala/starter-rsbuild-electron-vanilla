/**
 * Crypto utility functions for Node.js/backend environments
 */

import { randomBytes } from 'node:crypto';

/**
 * Generate random string
 * @param length - Length of string to generate
 * @returns Random string
 */
export const randomString = (length = 32): string => {
  return randomBytes(length).toString('base64').replace(/[+/=]/g, '').slice(0, length);
};

/**
 * Generate UUID v4
 * @returns UUID v4 string
 */
export const generateUuid = (): string => {
  const crypto = require('crypto');
  return crypto.randomUUID();
};
