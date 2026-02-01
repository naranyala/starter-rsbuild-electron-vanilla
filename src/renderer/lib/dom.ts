/**
 * Enhanced DOM utility functions for frontend environments
 * Improved version with better typing and additional functionality
 */

/**
 * Check if running in browser environment
 */
export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Query selector with fallback and better error handling
 * @param selector - CSS selector
 * @param parent - Parent element (optional)
 * @returns Element or null if not found
 */
export const querySelector = <T extends Element = Element>(
  selector: string,
  parent: Element | Document = document
): T | null => {
  if (!isBrowser) {
    console.warn('DOM operations not available outside browser environment');
    return null;
  }

  try {
    return parent.querySelector(selector) as T | null;
  } catch (error) {
    console.warn(`Invalid selector: ${selector}`, error);
    return null;
  }
};

/**
 * Query all elements matching selector with better typing
 * @param selector - CSS selector
 * @param parent - Parent element (optional)
 * @returns NodeList of elements
 */
export const querySelectorAll = <T extends Element = Element>(
  selector: string,
  parent: Element | Document = document
): NodeListOf<T> => {
  if (!isBrowser) {
    console.warn('DOM operations not available outside browser environment');
    return document.querySelectorAll(selector) as NodeListOf<T>;
  }

  try {
    return parent.querySelectorAll(selector) as NodeListOf<T>;
  } catch (error) {
    console.warn(`Invalid selector: ${selector}`, error);
    return document.querySelectorAll(selector) as NodeListOf<T>;
  }
};

/**
 * Add class to element with better error handling
 * @param element - Target element
 * @param className - Class name to add
 */
export const addClass = (element: Element, className: string): void => {
  if (element && className) {
    element.classList.add(className);
  }
};

/**
 * Remove class from element with better error handling
 * @param element - Target element
 * @param className - Class name to remove
 */
export const removeClass = (element: Element, className: string): void => {
  if (element && className) {
    element.classList.remove(className);
  }
};

/**
 * Toggle class on element with better error handling
 * @param element - Target element
 * @param className - Class name to toggle
 * @returns True if class is present after toggle
 */
export const toggleClass = (element: Element, className: string): boolean => {
  if (element && className) {
    return element.classList.toggle(className);
  }
  return false;
};

/**
 * Check if element has class with better error handling
 * @param element - Target element
 * @param className - Class name to check
 * @returns True if element has class
 */
export const hasClass = (element: Element, className: string): boolean => {
  return element && className ? element.classList.contains(className) : false;
};
