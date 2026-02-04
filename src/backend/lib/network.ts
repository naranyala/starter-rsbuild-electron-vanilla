/**
 * Network utility functions for Node.js/backend environments
 * Enhanced HTTP and network operations
 */

import { http, https } from 'node:https';

/**
 * Make HTTP GET request
 * @param url - URL to request
 * @param options - Request options
 * @returns Response data
 */
export const httpGet = async (
  url: string,
  options: {
    timeout?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<{
  data: string;
  statusCode: number;
  headers: Record<string, string>;
}> => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          data,
          statusCode: res.statusCode || 0,
          headers: res.headers || {},
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', reject);
  });
};

/**
 * Make HTTP POST request with JSON data
 * @param url - URL to request
 * @param data - Data to send
 * @param options - Request options
 * @returns Response data
 */
export const httpPost = async (
  url: string,
  data: Record<string, any>,
  options: {
    timeout?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<{
  data: string;
  statusCode: number;
  headers: Record<string, string>;
}> => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const jsonData = JSON.stringify(data);

    const req = client.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(jsonData),
          ...options.headers,
        },
        ...options,
      },
      (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          resolve({
            data: responseData,
            statusCode: res.statusCode || 0,
            headers: res.headers || {},
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', reject);
    req.write(jsonData);
    req.end();
  });
};
