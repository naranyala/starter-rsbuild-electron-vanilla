/**
 * DOM utilities for the renderer process
 */

export class DomUtils {
  /**
   * Query selector with type assertion
   */
  static querySelector(selector: string): Element | null {
    return document.querySelector(selector);
  }

  /**
   * Query selector all with type assertion
   */
  static querySelectorAll(selector: string): NodeListOf<Element> {
    return document.querySelectorAll(selector);
  }

  /**
   * Set multiple styles at once
   */
  static setStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
    Object.assign(element.style, styles);
  }

  /**
   * Add class to element
   */
  static addClass(element: Element, className: string): void {
    element.classList.add(className);
  }

  /**
   * Remove class from element
   */
  static removeClass(element: Element, className: string): void {
    element.classList.remove(className);
  }

  /**
   * Toggle class on element
   */
  static toggleClass(element: Element, className: string): boolean {
    return element.classList.toggle(className);
  }

  /**
   * Check if element has class
   */
  static hasClass(element: Element, className: string): boolean {
    return element.classList.contains(className);
  }

  /**
   * Set attribute on element
   */
  static setAttribute(element: Element, name: string, value: string): void {
    element.setAttribute(name, value);
  }

  /**
   * Get attribute from element
   */
  static getAttribute(element: Element, name: string): string | null {
    return element.getAttribute(name);
  }

  /**
   * Remove attribute from element
   */
  static removeAttribute(element: Element, name: string): void {
    element.removeAttribute(name);
  }

  /**
   * Set text content
   */
  static setTextContent(element: HTMLElement, text: string): void {
    element.textContent = text;
  }

  /**
   * Set HTML content
   */
  static setHTML(element: HTMLElement, html: string): void {
    element.innerHTML = html;
  }

  /**
   * Add event listener
   */
  static addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    event: K,
    handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any
  ): () => void {
    element.addEventListener(event, handler);
    return () => element.removeEventListener(event, handler);
  }

  /**
   * Wait for element to exist
   */
  static waitForElement(selector: string, timeout: number = 5000): Promise<Element | null> {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      if (timeout > 0) {
        setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, timeout);
      }
    });
  }
}