/**
 * Enhanced DOM Manipulation Utilities
 * Advanced DOM manipulation functions for 10x development
 */

import type { Signal } from '../frontend/lib/reactivity';

/**
 * DOM query selector types
 */
export type QuerySelector = string | Element | Document | Window;
export type SelectorOrElement = string | Element;

/**
 * Enhanced DOM element interface
 */
export interface EnhancedElement extends HTMLElement {
  dataset: DOMStringMap;
  animate: (animation: Keyframe[] | PropertyIndexedKeyframes, options?: number | KeyframeAnimationOptions) => Animation;
}

/**
 * DOM ready promise
 */
export const domReady = (): Promise<Document> => {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => resolve(document), { once: true });
    } else {
      resolve(document);
    }
  });
};

/**
 * Wait for element to exist in DOM
 */
export const waitForElement = (selector: string, timeout: number = 5000): Promise<Element | null> => {
  return new Promise((resolve, reject) => {
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
};

/**
 * Query selector with enhanced functionality
 */
export const query = (selector: QuerySelector): EnhancedElement | null => {
  if (typeof selector === 'string') {
    return document.querySelector(selector) as EnhancedElement;
  }
  return selector as EnhancedElement;
};

/**
 * Query all elements with selector
 */
export const queryAll = (selector: string): NodeListOf<EnhancedElement> => {
  return document.querySelectorAll(selector) as NodeListOf<EnhancedElement>;
};

/**
 * Create element with attributes and children
 */
export const createElement = <T extends keyof HTMLElementTagNameMap>(
  tag: T,
  attrs?: Partial<HTMLElementTagNameMap[T]>,
  ...children: (Node | string | null | undefined)[]
): HTMLElementTagNameMap[T] => {
  const element = document.createElement(tag);
  
  if (attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className' || key === 'class') {
        element.className = value as string;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        const event = key.slice(2).toLowerCase() as keyof HTMLElementEventMap;
        element.addEventListener(event, value as EventListener);
      } else if (value !== null && value !== undefined) {
        (element as any)[key] = value;
      }
    });
  }

  children.forEach(child => {
    if (child != null) {
      element.appendChild(
        typeof child === 'string' ? document.createTextNode(child) : child
      );
    }
  });

  return element;
};

/**
 * Append child to parent
 */
export const append = (parent: SelectorOrElement, child: Node | string): void => {
  const parentEl = typeof parent === 'string' ? query(parent) : parent;
  if (!parentEl) return;
  
  parentEl.appendChild(
    typeof child === 'string' ? document.createTextNode(child) : child
  );
};

/**
 * Prepend child to parent
 */
export const prepend = (parent: SelectorOrElement, child: Node | string): void => {
  const parentEl = typeof parent === 'string' ? query(parent) : parent;
  if (!parentEl) return;
  
  parentEl.insertBefore(
    typeof child === 'string' ? document.createTextNode(child) : child,
    parentEl.firstChild
  );
};

/**
 * Insert element before reference
 */
export const insertBefore = (reference: SelectorOrElement, element: Node | string): void => {
  const refEl = typeof reference === 'string' ? query(reference) : reference;
  if (!refEl || !refEl.parentNode) return;
  
  refEl.parentNode.insertBefore(
    typeof element === 'string' ? document.createTextNode(element) : element,
    refEl
  );
};

/**
 * Insert element after reference
 */
export const insertAfter = (reference: SelectorOrElement, element: Node | string): void => {
  const refEl = typeof reference === 'string' ? query(reference) : reference;
  if (!refEl || !refEl.parentNode) return;
  
  refEl.parentNode.insertBefore(
    typeof element === 'string' ? document.createTextNode(element) : element,
    refEl.nextSibling
  );
};

/**
 * Remove element from DOM
 */
export const remove = (element: SelectorOrElement): void => {
  const el = typeof element === 'string' ? query(element) : element;
  el?.remove();
};

/**
 * Add class to element
 */
export const addClass = (element: SelectorOrElement, ...classes: string[]): void => {
  const el = typeof element === 'string' ? query(element) : element;
  if (el) el.classList.add(...classes);
};

/**
 * Remove class from element
 */
export const removeClass = (element: SelectorOrElement, ...classes: string[]): void => {
  const el = typeof element === 'string' ? query(element) : element;
  if (el) el.classList.remove(...classes);
};

/**
 * Toggle class on element
 */
export const toggleClass = (element: SelectorOrElement, className: string, force?: boolean): boolean => {
  const el = typeof element === 'string' ? query(element) : element;
  if (!el) return false;
  
  return el.classList.toggle(className, force);
};

/**
 * Check if element has class
 */
export const hasClass = (element: SelectorOrElement, className: string): boolean => {
  const el = typeof element === 'string' ? query(element) : element;
  return el?.classList.contains(className) || false;
};

/**
 * Set attribute on element
 */
export const setAttribute = (element: SelectorOrElement, name: string, value: string): void => {
  const el = typeof element === 'string' ? query(element) : element;
  if (el) el.setAttribute(name, value);
};

/**
 * Get attribute from element
 */
export const getAttribute = (element: SelectorOrElement, name: string): string | null => {
  const el = typeof element === 'string' ? query(element) : element;
  return el?.getAttribute(name) || null;
};

/**
 * Remove attribute from element
 */
export const removeAttribute = (element: SelectorOrElement, name: string): void => {
  const el = typeof element === 'string' ? query(element) : element;
  if (el) el.removeAttribute(name);
};

/**
 * Set data attribute
 */
export const setData = (element: SelectorOrElement, name: string, value: string): void => {
  const el = typeof element === 'string' ? query(element) : element;
  if (el) el.dataset[name] = value;
};

/**
 * Get data attribute
 */
export const getData = (element: SelectorOrElement, name: string): string | undefined => {
  const el = typeof element === 'string' ? query(element) : element;
  return el?.dataset[name];
};

/**
 * Set style property
 */
export const setStyle = (element: SelectorOrElement, property: string, value: string | number): void => {
  const el = typeof element === 'string' ? query(element) : element;
  if (el) {
    if (typeof value === 'number' && ['width', 'height', 'top', 'left', 'right', 'bottom'].includes(property)) {
      el.style.setProperty(property, `${value}px`);
    } else {
      el.style.setProperty(property, String(value));
    }
  }
};

/**
 * Get computed style
 */
export const getStyle = (element: SelectorOrElement, property: string): string => {
  const el = typeof element === 'string' ? query(element) : element;
  return el ? getComputedStyle(el).getPropertyValue(property) : '';
};

/**
 * Set multiple styles at once
 */
export const setStyles = (element: SelectorOrElement, styles: Partial<CSSStyleDeclaration>): void => {
  const el = typeof element === 'string' ? query(element) : element;
  if (el) Object.assign(el.style, styles);
};

/**
 * Show element (remove hidden attribute/display none)
 */
export const show = (element: SelectorOrElement): void => {
  const el = typeof element === 'string' ? query(element) : element;
  if (el) {
    el.hidden = false;
    el.style.display = '';
  }
};

/**
 * Hide element (set hidden attribute/display none)
 */
export const hide = (element: SelectorOrElement): void => {
  const el = typeof element === 'string' ? query(element) : element;
  if (el) {
    el.hidden = true;
    el.style.display = 'none';
  }
};

/**
 * Toggle visibility of element
 */
export const toggleVisibility = (element: SelectorOrElement): boolean => {
  const el = typeof element === 'string' ? query(element) : element;
  if (!el) return false;
  
  const isVisible = !el.hidden && el.style.display !== 'none';
  if (isVisible) {
    hide(el);
  } else {
    show(el);
  }
  return !isVisible;
};

/**
 * Check if element is visible
 */
export const isVisible = (element: SelectorOrElement): boolean => {
  const el = typeof element === 'string' ? query(element) : element;
  if (!el) return false;
  
  return !el.hidden && el.style.display !== 'none' && el.offsetParent !== null;
};

/**
 * Set element text content
 */
export const setText = (element: SelectorOrElement, text: string): void => {
  const el = typeof element === 'string' ? query(element) : element;
  if (el) el.textContent = text;
};

/**
 * Get element text content
 */
export const getText = (element: SelectorOrElement): string => {
  const el = typeof element === 'string' ? query(element) : element;
  return el?.textContent || '';
};

/**
 * Set element HTML content
 */
export const setHTML = (element: SelectorOrElement, html: string): void => {
  const el = typeof element === 'string' ? query(element) : element;
  if (el) el.innerHTML = html;
};

/**
 * Get element HTML content
 */
export const getHTML = (element: SelectorOrElement): string => {
  const el = typeof element === 'string' ? query(element) : element;
  return el?.innerHTML || '';
};

/**
 * Focus element
 */
export const focus = (element: SelectorOrElement): void => {
  const el = typeof element === 'string' ? query(element) : element;
  if (el) (el as HTMLElement).focus();
};

/**
 * Blur element
 */
export const blur = (element: SelectorOrElement): void => {
  const el = typeof element === 'string' ? query(element) : element;
  if (el) (el as HTMLElement).blur();
};

/**
 * Scroll element into view
 */
export const scrollIntoView = (element: SelectorOrElement, options?: ScrollIntoViewOptions): void => {
  const el = typeof element === 'string' ? query(element) : element;
  if (el) el.scrollIntoView(options);
};

/**
 * Get element dimensions and position
 */
export const getRect = (element: SelectorOrElement): DOMRect | null => {
  const el = typeof element === 'string' ? query(element) : element;
  return el?.getBoundingClientRect() || null;
};

/**
 * Check if element is in viewport
 */
export const isInViewport = (element: SelectorOrElement): boolean => {
  const rect = getRect(element);
  if (!rect) return false;
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

/**
 * Add event listener with automatic cleanup
 */
export const on = <K extends keyof HTMLElementEventMap>(
  element: SelectorOrElement,
  event: K,
  handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): (() => void) => {
  const el = typeof element === 'string' ? query(element) : element;
  if (!el) return () => {};
  
  el.addEventListener(event, handler as EventListener, options);
  return () => el.removeEventListener(event, handler as EventListener, options);
};

/**
 * Add delegated event listener
 */
export const delegate = <K extends keyof HTMLElementEventMap>(
  parent: SelectorOrElement,
  selector: string,
  event: K,
  handler: (this: HTMLElement, ev: HTMLElementEventMap[K], target: Element) => any
): (() => void) => {
  const parentEl = typeof parent === 'string' ? query(parent) : parent;
  if (!parentEl) return () => {};
  
  const listener = (e: Event) => {
    const target = e.target as Element;
    if (target && target.matches(selector)) {
      handler.call(target, e as HTMLElementEventMap[K], target);
    }
  };
  
  parentEl.addEventListener(event, listener as EventListener);
  return () => parentEl.removeEventListener(event, listener as EventListener);
};

/**
 * Create a reactive DOM binding
 */
export const bind = <T>(
  element: SelectorOrElement,
  property: 'value' | 'textContent' | 'innerHTML' | 'checked' | 'className',
  signal: Signal<T>
): void => {
  const el = typeof element === 'string' ? query(element) : element;
  if (!el) return;
  
  // Update element when signal changes
  const unsubscribe = signal.subscribe((value) => {
    switch (property) {
      case 'value':
        (el as HTMLInputElement).value = String(value);
        break;
      case 'textContent':
        el.textContent = String(value);
        break;
      case 'innerHTML':
        el.innerHTML = String(value);
        break;
      case 'checked':
        (el as HTMLInputElement).checked = Boolean(value);
        break;
      case 'className':
        el.className = String(value);
        break;
    }
  });
  
  // Update signal when element changes (for input elements)
  if (property === 'value' && el instanceof HTMLInputElement) {
    el.addEventListener('input', () => {
      signal.set(el.value as unknown as T);
    });
  } else if (property === 'checked' && el instanceof HTMLInputElement) {
    el.addEventListener('change', () => {
      signal.set(el.checked as unknown as T);
    });
  }
  
  // Return unsubscribe function for cleanup
  return unsubscribe;
};

/**
 * Animate element with Web Animations API
 */
export const animate = (
  element: SelectorOrElement,
  keyframes: Keyframe[],
  options?: KeyframeAnimationOptions
): Promise<Animation> => {
  return new Promise((resolve, reject) => {
    const el = typeof element === 'string' ? query(element) : element;
    if (!el) {
      reject(new Error('Element not found'));
      return;
    }
    
    const animation = el.animate(keyframes, options);
    animation.onfinish = () => resolve(animation);
    animation.onerror = (err) => reject(err);
  });
};

/**
 * Fade in element
 */
export const fadeIn = (element: SelectorOrElement, duration: number = 300): Promise<void> => {
  return animate(element, [
    { opacity: 0 },
    { opacity: 1 }
  ], { duration }).then(() => {
    const el = typeof element === 'string' ? query(element) : element;
    if (el) el.style.opacity = '';
  });
};

/**
 * Fade out element
 */
export const fadeOut = (element: SelectorOrElement, duration: number = 300): Promise<void> => {
  return animate(element, [
    { opacity: 1 },
    { opacity: 0 }
  ], { duration }).then(() => {
    const el = typeof element === 'string' ? query(element) : element;
    if (el) hide(el);
  });
};

/**
 * Slide down element
 */
export const slideDown = (element: SelectorOrElement, duration: number = 300): Promise<void> => {
  return new Promise((resolve) => {
    const el = typeof element === 'string' ? query(element) : element;
    if (!el) {
      resolve();
      return;
    }
    
    el.style.height = '0';
    el.style.overflow = 'hidden';
    show(el);
    
    const height = el.scrollHeight;
    animate(el, [
      { height: '0' },
      { height: `${height}px` }
    ], { duration }).then(() => {
      el.style.height = '';
      el.style.overflow = '';
      resolve();
    });
  });
};

/**
 * Slide up element
 */
export const slideUp = (element: SelectorOrElement, duration: number = 300): Promise<void> => {
  return new Promise((resolve) => {
    const el = typeof element === 'string' ? query(element) : element;
    if (!el) {
      resolve();
      return;
    }
    
    const height = el.scrollHeight;
    el.style.height = `${height}px`;
    el.style.overflow = 'hidden';
    
    animate(el, [
      { height: `${height}px` },
      { height: '0' }
    ], { duration }).then(() => {
      hide(el);
      el.style.height = '';
      el.style.overflow = '';
      resolve();
    });
  });
};

/**
 * DOM utilities namespace
 */
export const DOM = {
  ready: domReady,
  waitFor: waitForElement,
  query,
  queryAll,
  create: createElement,
  append,
  prepend,
  insertBefore,
  insertAfter,
  remove,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  setAttr: setAttribute,
  getAttr: getAttribute,
  removeAttr: removeAttribute,
  setData,
  getData,
  setStyle,
  getStyle,
  setStyles,
  show,
  hide,
  toggleVis: toggleVisibility,
  visible: isVisible,
  setText,
  getText,
  setHTML,
  getHTML,
  focus,
  blur,
  scrollTo: scrollIntoView,
  rect: getRect,
  inViewport: isInViewport,
  on,
  delegate,
  bind,
  animate,
  fadeIn,
  fadeOut,
  slideDown,
  slideUp,
};

export default DOM;