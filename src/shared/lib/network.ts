/**
 * Advanced Networking Utilities
 * Comprehensive networking utilities with caching, retry mechanisms, and more
 */

import { AsyncMemoizer } from './async';

/**
 * HTTP methods enum
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

/**
 * Request options interface
 */
export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: 'no-cache' | 'reload' | 'force-cache' | 'only-if-cached' | 'default';
  cacheTTL?: number; // Cache time-to-live in milliseconds
  retryDelay?: number;
  maxRetryDelay?: number;
  backoff?: 'linear' | 'exponential';
  signal?: AbortSignal;
  baseUrl?: string;
}

/**
 * Response interface
 */
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  url: string;
  ok: boolean;
}

/**
 * Cache entry interface
 */
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

/**
 * Advanced HTTP client with caching and retry mechanisms
 */
export class HttpClient {
  private cache = new Map<string, CacheEntry>();
  private memoizers = new Map<string, AsyncMemoizer<any>>();
  private defaultOptions: RequestOptions;

  constructor(defaultOptions: RequestOptions = {}) {
    this.defaultOptions = {
      timeout: 10000,
      retries: 3,
      cacheTTL: 5 * 60 * 1000, // 5 minutes default
      retryDelay: 1000,
      maxRetryDelay: 30000,
      backoff: 'exponential',
      ...defaultOptions,
    };
  }

  /**
   * Make an HTTP request
   */
  async request<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const finalOptions = { ...this.defaultOptions, ...options };
    const fullUrl = finalOptions.baseUrl ? `${finalOptions.baseUrl}${url}` : url;
    
    // Create cache key
    const cacheKey = this.getCacheKey(fullUrl, finalOptions);
    
    // Check cache if applicable
    if (finalOptions.method === HttpMethod.GET && finalOptions.cache !== 'no-store') {
      const cached = this.getCached(cacheKey);
      if (cached) {
        return {
          data: cached,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          url: fullUrl,
          ok: true,
        };
      }
    }

    // Prepare request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), finalOptions.timeout);
    
    if (finalOptions.signal) {
      finalOptions.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      // Perform request with retry mechanism
      const response = await this.performRequestWithRetry<T>(
        fullUrl,
        { ...finalOptions, signal: controller.signal },
        cacheKey
      );

      // Cache response if applicable
      if (finalOptions.method === HttpMethod.GET && response.ok) {
        this.setCached(cacheKey, response.data, finalOptions.cacheTTL!);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Perform request with retry mechanism
   */
  private async performRequestWithRetry<T>(
    url: string,
    options: RequestOptions,
    cacheKey: string
  ): Promise<ApiResponse<T>> {
    const { retries, retryDelay, maxRetryDelay, backoff } = options;
    let lastError: any;

    for (let attempt = 0; attempt <= retries!; attempt++) {
      try {
        const response = await this.makeRequest<T>(url, options);
        
        // If successful, return immediately
        if (response.ok || attempt === retries) {
          return response;
        }
        
        // If it's a client error (4xx), don't retry
        if (response.status >= 400 && response.status < 500) {
          return response;
        }
        
        // Otherwise, continue to retry
      } catch (error) {
        lastError = error;
        
        if (attempt === retries) {
          throw error;
        }
      }

      // Calculate delay with backoff strategy
      let currentDelay: number;
      if (backoff === 'exponential') {
        currentDelay = Math.min(retryDelay! * Math.pow(2, attempt), maxRetryDelay!);
      } else {
        currentDelay = retryDelay! * (attempt + 1);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }

    throw lastError;
  }

  /**
   * Make a single HTTP request
   */
  private async makeRequest<T>(url: string, options: RequestOptions): Promise<ApiResponse<T>> {
    const { method = HttpMethod.GET, headers = {}, body, signal } = options;

    // Prepare request body
    let requestBody: BodyInit | null = null;
    let requestHeaders = { ...headers };

    if (body !== undefined && body !== null) {
      if (typeof body === 'object') {
        requestBody = JSON.stringify(body);
        requestHeaders = {
          'Content-Type': 'application/json',
          ...requestHeaders,
        };
      } else {
        requestBody = body;
      }
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal,
    });

    const responseData = response.headers.get('content-type')?.includes('application/json')
      ? await response.json()
      : await response.text();

    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      url: response.url,
      ok: response.ok,
    };
  }

  /**
   * Get cache key for request
   */
  private getCacheKey(url: string, options: RequestOptions): string {
    const params = new URLSearchParams();
    if (options.method && options.method !== HttpMethod.GET) {
      params.append('_method', options.method);
    }
    if (options.body) {
      params.append('_body', typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    return `${url}?${params.toString()}`;
  }

  /**
   * Get cached data
   */
  private getCached(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached data
   */
  private setCached(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.memoizers.clear();
  }

  /**
   * Remove specific cache entry
   */
  removeFromCache(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  // Convenience methods
  get<T = any>(url: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: HttpMethod.GET });
  }

  post<T = any>(url: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: HttpMethod.POST, body });
  }

  put<T = any>(url: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: HttpMethod.PUT, body });
  }

  patch<T = any>(url: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: HttpMethod.PATCH, body });
  }

  delete<T = any>(url: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: HttpMethod.DELETE });
  }
}

/**
 * REST API client with resource-based operations
 */
export class RestApiClient {
  private httpClient: HttpClient;

  constructor(baseURL: string, defaultOptions: RequestOptions = {}) {
    this.httpClient = new HttpClient({
      baseUrl: baseURL,
      ...defaultOptions,
    });
  }

  /**
   * Get all resources
   */
  async getAll<T = any>(resource: string, params?: Record<string, any>): Promise<ApiResponse<T[]>> {
    const url = params ? `${resource}?${new URLSearchParams(params)}` : resource;
    return this.httpClient.get<T[]>(url);
  }

  /**
   * Get single resource by ID
   */
  async get<T = any>(resource: string, id: string | number): Promise<ApiResponse<T>> {
    return this.httpClient.get<T>(`${resource}/${id}`);
  }

  /**
   * Create new resource
   */
  async create<T = any>(resource: string, data: any): Promise<ApiResponse<T>> {
    return this.httpClient.post<T>(resource, data);
  }

  /**
   * Update resource by ID
   */
  async update<T = any>(resource: string, id: string | number, data: any): Promise<ApiResponse<T>> {
    return this.httpClient.put<T>(`${resource}/${id}`, data);
  }

  /**
   * Partially update resource by ID
   */
  async patch<T = any>(resource: string, id: string | number, data: any): Promise<ApiResponse<T>> {
    return this.httpClient.patch<T>(`${resource}/${id}`, data);
  }

  /**
   * Delete resource by ID
   */
  async delete(resource: string, id: string | number): Promise<ApiResponse<any>> {
    return this.httpClient.delete(`${resource}/${id}`);
  }

  /**
   * Get resource with query parameters
   */
  async find<T = any>(resource: string, query: Record<string, any>): Promise<ApiResponse<T[]>> {
    return this.httpClient.get<T[]>(`${resource}?${new URLSearchParams(query)}`);
  }
}

/**
 * GraphQL client
 */
export class GraphQLClient {
  private httpClient: HttpClient;

  constructor(endpoint: string, defaultOptions: RequestOptions = {}) {
    this.httpClient = new HttpClient({
      baseUrl: endpoint,
      ...defaultOptions,
    });
  }

  /**
   * Execute GraphQL query
   */
  async query<T = any>(query: string, variables?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.httpClient.post<T>('', {
      query,
      variables: variables || {},
    });
  }

  /**
   * Execute GraphQL mutation
   */
  async mutate<T = any>(mutation: string, variables?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.httpClient.post<T>('', {
      query: mutation,
      variables: variables || {},
    });
  }
}

/**
 * WebSocket client with auto-reconnect
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private reconnectTimer: any;
  private messageQueue: any[] = [];
  private isOpen = false;

  constructor(url: string, private options: { protocols?: string | string[] } = {}) {
    this.url = url;
  }

  /**
   * Connect to WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url, this.options.protocols);

        this.ws.onopen = () => {
          this.isOpen = true;
          this.reconnectAttempts = 0;
          // Send queued messages
          while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.send(message);
          }
          resolve();
        };

        this.ws.onclose = (event) => {
          this.isOpen = false;
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(() => {
        this.scheduleReconnect();
      });
    }, this.reconnectInterval);
  }

  /**
   * Send message
   */
  send(data: any): void {
    if (this.isOpen && this.ws) {
      this.ws.send(JSON.stringify(data));
    } else {
      // Queue message if not connected
      this.messageQueue.push(data);
    }
  }

  /**
   * Listen for messages
   */
  onMessage(handler: (data: any) => void): void {
    if (this.ws) {
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          handler(data);
        } catch {
          handler(event.data);
        }
      };
    }
  }

  /**
   * Close connection
   */
  close(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isOpen = false;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.isOpen;
  }
}

/**
 * Network status utilities
 */
export class NetworkStatus {
  /**
   * Check if online
   */
  static isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Get connection type
   */
  static getConnectionType(): string {
    if (typeof navigator !== 'undefined' && (navigator as any).connection) {
      return (navigator as any).connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Get downlink speed
   */
  static getDownlink(): number {
    if (typeof navigator !== 'undefined' && (navigator as any).connection) {
      return (navigator as any).connection.downlink || 0;
    }
    return 0;
  }

  /**
   * Listen for online/offline events
   */
  static onStatusChange(callback: (online: boolean) => void): () => void {
    const onlineHandler = () => callback(true);
    const offlineHandler = () => callback(false);

    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    return () => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  }
}

/**
 * Request interceptor interface
 */
export interface RequestInterceptor {
  (request: Request): Request | Promise<Request>;
}

/**
 * Response interceptor interface
 */
export interface ResponseInterceptor {
  (response: Response): Response | Promise<Response>;
}

/**
 * HTTP client with interceptors
 */
export class InterceptableHttpClient extends HttpClient {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Override request method to include interceptors
   */
  override async request<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    // Apply request interceptors
    let modifiedOptions = { ...options };
    for (const interceptor of this.requestInterceptors) {
      // Note: In a real implementation, we'd need to properly handle Request objects
      // This is a simplified version
    }

    const response = await super.request<T>(url, modifiedOptions);

    // Apply response interceptors
    let modifiedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      // Note: In a real implementation, we'd need to properly handle Response objects
      // This is a simplified version
    }

    return modifiedResponse;
  }
}

/**
 * Networking utilities namespace
 */
export const NetworkUtils = {
  HttpClient,
  RestApiClient,
  GraphQLClient,
  WebSocketClient,
  NetworkStatus,
  HttpMethod,
};

export default NetworkUtils;