import { ReadonlySignal, type Signal, createEffect, effect, untrack } from './reactivity';

export interface TemplateNode {
  type: 'element' | 'text' | 'fragment';
  tag?: string;
  props?: Record<string, unknown>;
  children?: TemplateNode[];
  text?: string;
  ref?: HTMLElement | Text | null;
  key?: string | number;
  // Enhanced properties for better performance
  dynamicProps?: Set<string>;
  dynamicChildren?: boolean;
}

export interface Component {
  (): TemplateNode | null;
  cleanup?: () => void;
}

export type Directive = (
  element: HTMLElement,
  value: unknown,
  prevValue: unknown
) => void | (() => void);

// Enhanced cache for better performance with size limits
const elementCache = new Map<string, HTMLElement>();
const textCache = new Map<string, Text>();

// Max cache sizes to prevent memory leaks
const MAX_ELEMENT_CACHE_SIZE = 100;
const MAX_TEXT_CACHE_SIZE = 200;

const isPrimitive = (value: unknown): boolean => {
  return value === null || value === undefined || typeof value !== 'object';
};

const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Enhanced prop handlers with better performance
const PROP_HANDLERS: Record<string, (el: HTMLElement, value: unknown) => void> = {
  value: (el, v) => {
    const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (input.value !== v) input.value = String(v ?? '');
  },
  checked: (el, v) => {
    const input = el as HTMLInputElement;
    input.checked = Boolean(v);
  },
  style: (el, v) => {
    if (typeof v === 'string') {
      el.style.cssText = v;
    } else if (v && typeof v === 'object') {
      Object.assign(el.style, v);
    }
  },
  className: (el, v) => {
    el.className = String(v ?? '');
  },
  innerHTML: (el, v) => {
    // SECURITY WARNING: Only use innerHTML for trusted content
    // For untrusted content, use textContent or proper sanitization
    el.innerHTML = String(v ?? '');
  },
  textContent: (el, v) => {
    el.textContent = v === null || v === undefined ? '' : String(v);
  },
  // Enhanced handlers for better performance
  hidden: (el, v) => {
    el.hidden = Boolean(v);
  },
  disabled: (el, v) => {
    (el as HTMLButtonElement | HTMLInputElement).disabled = Boolean(v);
  },
};

const BOOLEAN_ATTRS = new Set([
  'disabled',
  'checked',
  'selected',
  'readonly',
  'multiple',
  'required',
  'autofocus',
  'autocomplete',
  'novalidate',
  'formnovalidate',
  'hidden',
  'open',
  'disabled',
  'ismap',
  'loop',
  'multiple',
  'readonly',
  'required',
]);

// Enhanced attribute setting with better performance
const setAttribute = (el: HTMLElement, name: string, value: unknown): void => {
  // Handle event listeners
  if (name.startsWith('on') && typeof value === 'function') {
    const eventName = name.slice(2).toLowerCase();
    el.addEventListener(eventName, value as EventListener);
    return;
  }

  // Handle property bindings
  if (name.startsWith('prop:')) {
    const propName = name.slice(5);
    const handler = PROP_HANDLERS[propName];
    if (handler) {
      handler(el, value);
    } else {
      (el as unknown as Record<string, unknown>)[propName] = value;
    }
    return;
  }

  // Handle bind directives
  if (name.startsWith('bind:')) {
    const propName = name.slice(5);
    const handler = PROP_HANDLERS[propName];
    if (handler) {
      handler(el, value);
    }
    return;
  }

  // Handle event binding with colon syntax
  if (name.startsWith('on:')) {
    const eventName = name.slice(3).toLowerCase();
    el.addEventListener(eventName, value as EventListener);
    return;
  }

  // Handle inline style properties
  if (name.startsWith('style:')) {
    const styleProp = name.slice(6);
    if (value !== null && value !== undefined) {
      (el.style as unknown as Record<string, string>)[styleProp] = String(value);
    } else {
      el.style.removeProperty(styleProp);
    }
    return;
  }

  // Handle boolean attributes
  if (BOOLEAN_ATTRS.has(name)) {
    if (value) {
      el.setAttribute(name, '');
    } else {
      el.removeAttribute(name);
    }
    return;
  }

  // Handle regular attributes
  if (value === null || value === undefined) {
    el.removeAttribute(name);
  } else {
    el.setAttribute(name, String(value));
  }
};

// Enhanced reconciliation with keyed updates
const reconcileChildren = (oldNode: TemplateNode, newNode: TemplateNode): void => {
  const oldChildren = oldNode.children || [];
  const newChildren = newNode.children || [];

  // If both nodes have keyed children, use keyed reconciliation
  const hasOldKeys = oldChildren.some((child) => child.key != null);
  const hasNewKeys = newChildren.some((child) => child.key != null);

  if (hasOldKeys && hasNewKeys) {
    reconcileKeyedChildren(oldNode, newNode);
  } else {
    // Fall back to simple reconciliation
    const oldLength = oldChildren.length;
    const newLength = newChildren.length;
    const minLength = Math.min(oldLength, newLength);

    for (let i = 0; i < minLength; i++) {
      reconcile(oldChildren[i], newChildren[i]);
    }

    if (oldLength > newLength) {
      for (let i = newLength; i < oldLength; i++) {
        unmount(oldChildren[i]);
      }
    } else if (newLength > oldLength) {
      for (let i = oldLength; i < newLength; i++) {
        const child = mount(newChildren[i], oldNode.ref!);
        newChildren[i].ref = child;
      }
    }

    oldNode.children = newChildren;
  }
};

// Keyed reconciliation algorithm for better performance
const reconcileKeyedChildren = (oldNode: TemplateNode, newNode: TemplateNode): void => {
  const oldChildren = oldNode.children || [];
  const newChildren = newNode.children || [];

  // Create maps for keyed lookup
  const oldKeyMap = new Map();
  oldChildren.forEach((child, index) => {
    if (child.key != null) {
      oldKeyMap.set(child.key, { child, index });
    }
  });

  const newKeyMap = new Map();
  newChildren.forEach((child, index) => {
    if (child.key != null) {
      newKeyMap.set(child.key, { child, index });
    }
  });

  // Process new children
  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];

    if (newChild.key != null) {
      const oldEntry = oldKeyMap.get(newChild.key);

      if (oldEntry) {
        // Update existing child
        reconcile(oldEntry.child, newChild);
        newChildren[i].ref = oldEntry.child.ref;
      } else {
        // Mount new child
        const mounted = mount(newChild, oldNode.ref!);
        newChildren[i].ref = mounted;
      }
    } else {
      // Handle non-keyed children
      if (i < oldChildren.length) {
        reconcile(oldChildren[i], newChild);
        newChildren[i].ref = oldChildren[i].ref;
      } else {
        const mounted = mount(newChild, oldNode.ref!);
        newChildren[i].ref = mounted;
      }
    }
  }

  // Remove old children that weren't reused
  for (let i = 0; i < oldChildren.length; i++) {
    const oldChild = oldChildren[i];
    if (oldChild.key != null && !newKeyMap.has(oldChild.key)) {
      unmount(oldChild);
    } else if (oldChild.key == null && i >= newChildren.length) {
      unmount(oldChild);
    }
  }

  oldNode.children = newChildren;
};

// Enhanced reconcile function with better performance
const reconcile = (oldNode: TemplateNode | undefined, newNode: TemplateNode): void => {
  if (!newNode) {
    if (oldNode) unmount(oldNode);
    return;
  }

  if (!oldNode) {
    const el = mount(newNode, null);
    newNode.ref = el;
    return;
  }

  // If node types differ, replace the entire node
  if (oldNode.type !== newNode.type || oldNode.tag !== newNode.tag) {
    unmount(oldNode);
    const el = mount(newNode, null);
    newNode.ref = el;
    return;
  }

  // Handle text nodes
  if (oldNode.type === 'text' && newNode.type === 'text') {
    if (oldNode.text !== newNode.text) {
      const textNode = oldNode.ref as Text;
      textNode.textContent = newNode.text || '';
    }
    return;
  }

  // Update element reference
  newNode.ref = oldNode.ref;

  // Update element properties and children
  updateElement(oldNode, newNode);
};

// Store event listeners to properly clean them up
const elementEventListeners = new WeakMap<HTMLElement, Map<string, { eventName: string, handler: EventListener }>>();

const setAttribute = (el: HTMLElement, name: string, value: unknown): void => {
  // Handle event listeners
  if (name.startsWith('on') && typeof value === 'function') {
    const eventName = name.slice(2).toLowerCase();

    // Get or create the event listeners map for this element
    let eventListeners = elementEventListeners.get(el);
    if (!eventListeners) {
      eventListeners = new Map<string, { eventName: string, handler: EventListener }>();
      elementEventListeners.set(el, eventListeners);
    }

    // Check if there's an existing listener for this event type
    const existingKey = Array.from(eventListeners.keys()).find(key =>
      eventListeners!.get(key)?.eventName === eventName
    );

    if (existingKey) {
      // Remove the existing listener
      const existing = eventListeners.get(existingKey)!;
      el.removeEventListener(existing.eventName, existing.handler);
      eventListeners.delete(existingKey);
    }

    // Store and add the new listener
    const listenerKey = `${name}_${Date.now()}_${Math.random()}`;
    eventListeners.set(listenerKey, { eventName, handler: value as EventListener });
    el.addEventListener(eventName, value as EventListener);
    return;
  }

  // Handle property bindings
  if (name.startsWith('prop:')) {
    const propName = name.slice(5);
    const handler = PROP_HANDLERS[propName];
    if (handler) {
      handler(el, value);
    } else {
      (el as unknown as Record<string, unknown>)[propName] = value;
    }
    return;
  }

  // Handle bind directives
  if (name.startsWith('bind:')) {
    const propName = name.slice(5);
    const handler = PROP_HANDLERS[propName];
    if (handler) {
      handler(el, value);
    }
    return;
  }

  // Handle event binding with colon syntax
  if (name.startsWith('on:')) {
    const eventName = name.slice(3).toLowerCase();

    // Get or create the event listeners map for this element
    let eventListeners = elementEventListeners.get(el);
    if (!eventListeners) {
      eventListeners = new Map<string, { eventName: string, handler: EventListener }>();
      elementEventListeners.set(el, eventListeners);
    }

    // Check if there's an existing listener for this event type
    const existingKey = Array.from(eventListeners.keys()).find(key =>
      eventListeners!.get(key)?.eventName === eventName
    );

    if (existingKey) {
      // Remove the existing listener
      const existing = eventListeners.get(existingKey)!;
      el.removeEventListener(existing.eventName, existing.handler);
      eventListeners.delete(existingKey);
    }

    // Store and add the new listener
    const listenerKey = `${name}_${Date.now()}_${Math.random()}`;
    eventListeners.set(listenerKey, { eventName, handler: value as EventListener });
    el.addEventListener(eventName, value as EventListener);
    return;
  }

  // Handle inline style properties
  if (name.startsWith('style:')) {
    const styleProp = name.slice(6);
    if (value !== null && value !== undefined) {
      (el.style as unknown as Record<string, string>)[styleProp] = String(value);
    } else {
      el.style.removeProperty(styleProp);
    }
    return;
  }

  // Handle boolean attributes
  if (BOOLEAN_ATTRS.has(name)) {
    if (value) {
      el.setAttribute(name, '');
    } else {
      el.removeAttribute(name);
    }
    return;
  }

  // Handle regular attributes
  if (value === null || value === undefined) {
    el.removeAttribute(name);
  } else {
    el.setAttribute(name, String(value));
  }
};

// Update element function
const updateElement = (oldNode: TemplateNode, newNode: TemplateNode): void => {
  const el = oldNode.ref as HTMLElement;
  if (!el || el.nodeType === Node.TEXT_NODE) return;

  const oldProps = oldNode.props || {};
  const newProps = newNode.props || {};

  // Process all old props to remove those that are no longer present
  for (const [key, oldValue] of Object.entries(oldProps)) {
    if (!(key in newProps)) {
      // Handle event listener removal
      if ((key.startsWith('on') || key.startsWith('on:')) && typeof oldValue === 'function') {
        const eventName = key.startsWith('on:') ? key.slice(3).toLowerCase() : key.slice(2).toLowerCase();

        let eventListeners = elementEventListeners.get(el);
        if (eventListeners) {
          // Find and remove the specific listener
          const listenerKey = Array.from(eventListeners.keys()).find(k =>
            eventListeners!.get(k)?.eventName === eventName &&
            eventListeners!.get(k)?.handler === oldValue
          );

          if (listenerKey) {
            const listenerInfo = eventListeners.get(listenerKey)!;
            el.removeEventListener(listenerInfo.eventName, listenerInfo.handler);
            eventListeners.delete(listenerKey);
          }
        }
      }
      // For other properties, they are typically handled by HTML itself when removed
    }
  }

  // Set/update new properties
  for (const [key, value] of Object.entries(newProps)) {
    const oldValue = oldProps[key];

    // Only update if the value actually changed
    if (oldValue !== value) {
      setAttribute(el, key, value);
    }
  }

  // Reconcile children
  reconcileChildren(oldNode, newNode);
};

// Enhanced mount function with caching and better performance
const mount = (node: TemplateNode, parent: HTMLElement | null): HTMLElement | Text => {
  if (node.type === 'text') {
    // Use cached text nodes when possible
    const textValue = node.text || '';
    let textNode: Text;

    if (textValue.length < 50) {
      // Only cache short texts
      const cached = textCache.get(textValue);
      if (cached && !cached.parentElement) {
        // Only reuse if not attached
        textNode = cached;
        textNode.textContent = textValue;
      } else {
        textNode = document.createTextNode(textValue);
        // Enforce cache size limits
        if (textCache.size >= MAX_TEXT_CACHE_SIZE) {
          // Remove oldest entry (first in map iteration)
          const firstKey = textCache.keys().next().value;
          if (firstKey) textCache.delete(firstKey);
        }
        textCache.set(textValue, textNode);
      }
    } else {
      textNode = document.createTextNode(textValue);
    }

    if (parent) parent.appendChild(textNode);
    return textNode;
  }

  if (node.type === 'fragment') {
    const fragment = document.createDocumentFragment();
    const children = node.children || [];
    for (const child of children) {
      const el = mount(child, fragment);
      child.ref = el;
    }
    if (parent) parent.appendChild(fragment);
    return fragment as unknown as HTMLElement;
  }

  // Use cached elements when possible
  const tagName = node.tag!;
  let el: HTMLElement;

  const cached = elementCache.get(tagName);
  if (cached && !cached.parentElement) {
    // Only reuse if not attached
    el = cached;
    el.removeAttribute('class');
    el.textContent = '';
  } else {
    el = document.createElement(tagName);
  }

  // Enforce cache size limits
  if (elementCache.size >= MAX_ELEMENT_CACHE_SIZE) {
    // Remove oldest entry (first in map iteration)
    const firstKey = elementCache.keys().next().value;
    if (firstKey) elementCache.delete(firstKey);
  }

  node.ref = el;

  // Set initial props
  for (const [key, value] of Object.entries(node.props || {})) {
    setAttribute(el, key, value);
  }

  // Mount children
  const children = node.children || [];
  for (const child of children) {
    const childEl = mount(child, el);
    child.ref = childEl;
  }

  if (parent) parent.appendChild(el);
  return el;
};

// Enhanced unmount function
const unmount = (node: TemplateNode): void => {
  if (!node.ref) return;

  if (node.type === 'text') {
    const textNode = node.ref as Text;
    // Cache text nodes for reuse
    if (textNode.textContent && textNode.textContent.length < 50) {
      // Enforce cache size limits
      if (textCache.size >= MAX_TEXT_CACHE_SIZE) {
        // Remove oldest entry (first in map iteration)
        const firstKey = textCache.keys().next().value;
        if (firstKey) textCache.delete(firstKey);
      }
      textCache.set(textNode.textContent, textNode);
    }
    textNode.remove();
    return;
  }

  if (node.type === 'fragment') {
    const children = node.children || [];
    for (const child of children) {
      unmount(child);
    }
    return;
  }

  // Cache elements for reuse
  const el = node.ref as HTMLElement;
  if (el.tagName) {
    // Enforce cache size limits
    if (elementCache.size >= MAX_ELEMENT_CACHE_SIZE) {
      // Remove oldest entry (first in map iteration)
      const firstKey = elementCache.keys().next().value;
      if (firstKey) elementCache.delete(firstKey);
    }
    elementCache.set(el.tagName.toLowerCase(), el);
  }

  // Remove event listeners and children
  const children = node.children || [];
  for (const child of children) {
    unmount(child);
  }

  el.remove();
};

// Enhanced h function
export const h = (
  tag: string | Component,
  props?: Record<string, unknown> | null,
  ...children: (TemplateNode | string | number | boolean | null | undefined | TemplateNode[])[]
): TemplateNode => {
  if (typeof tag === 'function') {
    const component = tag as Component;
    const result = component();
    if (!result) {
      return {
        type: 'fragment',
        children: [],
        ref: null,
      };
    }
    return {
      ...result,
      props: props as Record<string, unknown>,
    };
  }

  // Process children
  const normalizedChildren: TemplateNode[] = [];

  const flattenAndProcess = (items: unknown[]): void => {
    for (const item of items) {
      if (item === null || item === undefined || item === false) continue;

      if (Array.isArray(item)) {
        flattenAndProcess(item);
      } else if (typeof item === 'string' || typeof item === 'number') {
        normalizedChildren.push({
          type: 'text',
          text: String(item),
          ref: null,
        });
      } else if ((item as TemplateNode).type) {
        normalizedChildren.push(item as TemplateNode);
      }
    }
  };

  flattenAndProcess(children);

  return {
    type: 'element',
    tag,
    props: props || {},
    children: normalizedChildren,
    ref: null,
  };
};

// Enhanced Fragment with keyed support
export const Fragment = (
  ...children: (TemplateNode | string | number | boolean | null | undefined | TemplateNode[])[]
): TemplateNode => {
  const normalizedChildren: TemplateNode[] = [];

  const flattenAndProcess = (items: unknown[]): void => {
    for (const item of items) {
      if (item === null || item === undefined || item === false) continue;

      if (Array.isArray(item)) {
        flattenAndProcess(item);
      } else if (typeof item === 'string' || typeof item === 'number') {
        normalizedChildren.push({
          type: 'text',
          text: String(item),
          ref: null,
        });
      } else if ((item as TemplateNode).type) {
        normalizedChildren.push(item as TemplateNode);
      }
    }
  };

  flattenAndProcess(children);

  return {
    type: 'fragment',
    children: normalizedChildren,
    ref: null,
  };
};

export const hText = (text: string | number): TemplateNode => {
  return {
    type: 'text',
    text: String(text),
    ref: null,
  };
};

// Enhanced render - simple container clear and mount
export const render = (node: TemplateNode, container: HTMLElement): { cleanup: () => void } => {
  // Clear everything in container
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const el = mount(node, null);
  container.appendChild(el);

  return {
    cleanup: () => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    },
  };
};

// Enhanced reactive rendering
let currentRoot: TemplateNode | null = null;
let currentContainer: HTMLElement | null = null;

export const reRender = (newNode: TemplateNode): void => {
  if (!currentRoot || !currentContainer) return;

  reconcile(currentRoot, newNode);
  currentRoot = newNode;
};

export const startReactiveRender = (node: TemplateNode, container: HTMLElement): (() => void) => {
  currentRoot = node;
  currentContainer = container;

  const { cleanup } = render(node, container);

  return () => {
    currentRoot = null;
    currentContainer = null;
    cleanup();
  };
};

// Enhanced reactive component with lifecycle
export interface ReactiveComponent {
  (): TemplateNode;
  destroy: () => void;
  update: (newNode: TemplateNode) => void;
}

export const createReactiveComponent = (
  renderFn: () => TemplateNode,
  container: HTMLElement
): ReactiveComponent => {
  let currentNode: TemplateNode | null = null;
  let cleanupFn: (() => void) | null = null;

  const render = () => {
    const newNode = renderFn();
    if (!currentNode) {
      cleanupFn = mountComponent(newNode, container);
      currentNode = newNode;
    } else {
      reconcile(currentNode, newNode);
      currentNode = newNode;
    }
  };

  const mountComponent = (node: TemplateNode, container: HTMLElement): (() => void) => {
    container.replaceChildren();
    const el = mount(node, null);
    container.appendChild(el);
    node.ref = el as unknown as HTMLElement;
    return () => unmount(node);
  };

  const component = () => {
    render();
    return currentNode!;
  };

  component.destroy = () => {
    if (cleanupFn) cleanupFn();
    currentNode = null;
    cleanupFn = null;
  };

  component.update = (newNode: TemplateNode) => {
    if (currentNode) {
      reconcile(currentNode, newNode);
      currentNode = newNode;
    }
  };

  return component;
};

// Enhanced hydration for SSR
export const hydrate = (node: TemplateNode, container: HTMLElement): { cleanup: () => void } => {
  node.ref = container;
  const children = node.children || [];
  for (let i = 0; i < container.childNodes.length && i < children.length; i++) {
    children[i].ref = container.childNodes[i] as HTMLElement | Text;
  }

  return {
    cleanup: () => {},
  };
};

// Enhanced reconciliation function
export const reconcileNodes = <T extends TemplateNode>(oldNode: T, newNode: T) => {
  reconcile(oldNode, newNode);
};

// Utility for creating keyed lists for better performance
export const keyed =
  <T>(keyFn: (item: T) => string | number, renderItem: (item: T) => TemplateNode) =>
  (items: T[]): TemplateNode[] => {
    return items.map((item) => {
      const node = renderItem(item);
      node.key = keyFn(item);
      return node;
    });
  };

// Utility for conditional rendering
export const show = (
  condition: boolean | Signal<boolean>,
  template: () => TemplateNode
): TemplateNode => {
  if (typeof condition === 'object' && 'subscribe' in condition) {
    // Handle reactive condition
    const signal = condition as Signal<boolean>;
    let currentTemplate: TemplateNode | null = null;

    effect(() => {
      const show = signal();
      if (show) {
        if (!currentTemplate) {
          currentTemplate = template();
        }
      } else {
        if (currentTemplate) {
          unmount(currentTemplate);
          currentTemplate = null;
        }
      }
    });

    return (
      currentTemplate || {
        type: 'fragment',
        children: [],
        ref: null,
      }
    );
  }

  return condition
    ? template()
    : {
        type: 'fragment',
        children: [],
        ref: null,
      };
};

export { mount, unmount, setAttribute, escapeHtml, reconcileNodes as reconcile };
