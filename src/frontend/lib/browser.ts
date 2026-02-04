/**
 * Browser utility functions for frontend environments
 * Enhanced browser detection and navigation operations
 */

/**
 * Browser detection utilities
 */
export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
export const isNode = typeof process !== 'undefined' && process.versions?.node;

/**
 * Get browser information
 * @returns Browser information object
 */
export const getBrowserInfo = () => {
  if (!isBrowser) {
    return { name: 'Unknown', version: '0.0.0' };
  }

  const userAgent = navigator.userAgent;
  const vendor = (navigator as any).vendor || '';

  // Browser detection
  let browserName = 'Unknown';
  let browserVersion = '0.0.0';

  if (userAgent.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+\.\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.indexOf('Safari') > -1) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.indexOf('Edge') > -1) {
    browserName = 'Edge';
    const match = userAgent.match(/Edge\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  }

  return {
    name: browserName,
    version: browserVersion,
    userAgent,
    vendor,
    language: navigator.language,
    languages: navigator.languages,
    cookieEnabled: navigator.cookieEnabled,
    onLine: isOnline(),
    platform: navigator.platform,
  };
};

/**
 * Check if browser is online
 * @returns True if online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Check if browser supports localStorage
 * @returns True if localStorage is supported
 */
export const isLocalStorageSupported = (): boolean => {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if browser supports sessionStorage
 * @returns True if sessionStorage is supported
 */
export const isSessionStorageSupported = (): boolean => {
  try {
    const testKey = '__test__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get viewport dimensions
 * @returns Viewport dimensions
 */
export const getViewportSize = () => {
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  };
};

/**
 * Get device pixel ratio
 * @returns Device pixel ratio
 */
export const getDevicePixelRatio = (): number => {
  return window.devicePixelRatio || 1;
};

/**
 * Check if device is mobile
 * @returns True if mobile device
 */
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Check if device is tablet
 * @returns True if tablet device
 */
export const isTablet = (): boolean => {
  return /iPad|Android(?!.*Mobile)|Tablet/i.test(navigator.userAgent);
};

/**
 * Check if device is desktop
 * @returns True if desktop device
 */
export const isDesktop = (): boolean => {
  return !isMobile() && !isTablet();
};

/**
 * Get scrollbar width
 * @returns Scrollbar width
 */
export const getScrollbarWidth = (): number => {
  const outer = document.createElement('div');
  outer.style.overflow = 'scroll';
  document.body.appendChild(outer);

  const inner = document.createElement('div');
  inner.style.overflow = 'scroll';
  outer.appendChild(inner);

  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

  document.body.removeChild(outer);

  return scrollbarWidth;
};

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Success status
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!navigator.clipboard) {
    return false;
  }

  try {
    if (navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else if ((navigator as any).clipboardData && window.clipboardData) {
      (window as any).clipboardData.setData('Text/plain', text);
      return true;
    }
  } catch (error) {
    console.error('Failed to copy text to clipboard:', error);
    return false;
  }
};

/**
 * Read text from clipboard
 * @returns Clipboard text
 */
export const readFromClipboard = async (): Promise<string> => {
  if (!navigator.clipboard) {
    return '';
  }

  try {
    if (navigator.clipboard.readText) {
      return await navigator.clipboard.readText();
    } else if ((navigator as any).clipboardData && window.clipboardData) {
      return (window as any).clipboardData.getData('Text/plain') || '';
    }
  } catch (error) {
    console.error('Failed to read text from clipboard:', error);
    return '';
  }
};

/**
 * Download file
 * @param url - File URL
 * @param filename - Filename
 * @returns Success status
 */
export const downloadFile = (url: string, filename: string): boolean => {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('Failed to download file:', error);
    return false;
  }
};

/**
 * Open URL in new tab
 * @param url - URL to open
 * @returns Success status
 */
export const openInNewTab = (url: string): boolean => {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('Failed to open URL:', error);
    return false;
  }
};

/**
 * Reload current page
 * @param forceReload - Whether to force reload from cache (default: false)
 */
export const reloadPage = (forceReload = false): void => {
  window.location.reload(forceReload);
};

/**
 * Get current URL with parameters
 * @returns Current URL with search parameters
 */
export const getCurrentUrl = (): string => {
  return window.location.href;
};

/**
 * Get URL search parameters
 * @returns URL search parameters as object
 */
export const getUrlParams = (): Record<string, string> => {
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(window.location.search);

  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  return params;
};
