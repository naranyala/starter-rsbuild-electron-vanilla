// Basic DOM utilities for the renderer process
export class DomUtils {
  static querySelector<T = Element>(selector: string, parent?: Element | Document): T | null {
    return (parent || document).querySelector(selector) as T | null;
  }

  static querySelectorAll<T = Element>(
    selector: string,
    parent?: Element | Document
  ): NodeListOf<T> {
    return (parent || document).querySelectorAll(selector) as NodeListOf<T>;
  }

  static createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attributes?: Record<string, any>,
    children?: (string | Node)[]
  ): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);

    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
          element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
          Object.assign(element.style, value);
        } else {
          element.setAttribute(key, value);
        }
      });
    }

    if (children) {
      children.forEach((child) => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(child);
        }
      });
    }

    return element;
  }

  static setStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
    Object.assign(element.style, styles);
  }
}
