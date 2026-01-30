/**
 * DOM utility functions for Electron renderer process
 * Provides helper functions for DOM manipulation and querying
 */

class DomUtils {
  /**
   * Query selector with fallback
   * @param {string} selector - CSS selector
   * @param {Element} parent - Parent element (optional)
   * @returns {Element|null} - Element or null if not found
   */
  static querySelector(selector, parent = document) {
    try {
      return parent.querySelector(selector);
    } catch (error) {
      console.warn(`Invalid selector: ${selector}`, error);
      return null;
    }
  }

  /**
   * Query all elements matching selector
   * @param {string} selector - CSS selector
   * @param {Element} parent - Parent element (optional)
   * @returns {NodeList} - NodeList of elements
   */
  static querySelectorAll(selector, parent = document) {
    try {
      return parent.querySelectorAll(selector);
    } catch (error) {
      console.warn(`Invalid selector: ${selector}`, error);
      return [];
    }
  }

  /**
   * Create an element with attributes and children
   * @param {string} tagName - Tag name
   * @param {Object} attributes - Attributes to set
   * @param {Array} children - Child elements or text nodes
   * @returns {HTMLElement} - Created element
   */
  static createElement(tagName, attributes = {}, children = []) {
    const element = document.createElement(tagName);

    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key.startsWith('on')) {
        // Event handler
        const eventType = key.slice(2).toLowerCase();
        element.addEventListener(eventType, value);
      } else if (key === 'className') {
        element.className = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else {
        element.setAttribute(key, value);
      }
    });

    // Append children
    children.forEach((child) => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Element) {
        element.appendChild(child);
      }
    });

    return element;
  }

  /**
   * Add class to element
   * @param {Element} element - Target element
   * @param {string} className - Class name to add
   */
  static addClass(element, className) {
    if (element && className) {
      element.classList.add(className);
    }
  }

  /**
   * Remove class from element
   * @param {Element} element - Target element
   * @param {string} className - Class name to remove
   */
  static removeClass(element, className) {
    if (element && className) {
      element.classList.remove(className);
    }
  }

  /**
   * Toggle class on element
   * @param {Element} element - Target element
   * @param {string} className - Class name to toggle
   * @returns {boolean} - True if class is present after toggle
   */
  static toggleClass(element, className) {
    if (element && className) {
      return element.classList.toggle(className);
    }
    return false;
  }

  /**
   * Check if element has class
   * @param {Element} element - Target element
   * @param {string} className - Class name to check
   * @returns {boolean} - True if element has class
   */
  static hasClass(element, className) {
    return element && className ? element.classList.contains(className) : false;
  }

  /**
   * Set multiple styles on element
   * @param {Element} element - Target element
   * @param {Object} styles - Styles to set
   */
  static setStyles(element, styles) {
    if (element && styles) {
      Object.entries(styles).forEach(([property, value]) => {
        element.style[property] = value;
      });
    }
  }

  /**
   * Show element (remove hidden/display-none classes)
   * @param {Element} element - Target element
   */
  static show(element) {
    if (element) {
      element.style.display = '';
      this.removeClass(element, 'hidden');
    }
  }

  /**
   * Hide element
   * @param {Element} element - Target element
   */
  static hide(element) {
    if (element) {
      element.style.display = 'none';
      this.addClass(element, 'hidden');
    }
  }

  /**
   * Wait for element to be available in DOM
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Element>} - Promise resolving to element
   */
  static waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = this.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = this.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element with selector "${selector}" not found within ${timeout}ms`));
      }, timeout);
    });
  }
}

export default DomUtils;
