import type { ReadonlySignal } from './reactivity';

export interface TemplateNode {
  type: 'element' | 'text' | 'fragment';
  tag?: string;
  props?: Record<string, unknown>;
  children?: TemplateNode[];
  text?: string;
  ref?: HTMLElement | Text | null;
  key?: string | number;
}

export interface Component {
  (): TemplateNode | null;
  cleanup?: () => void;
}

export type Directive = (element: HTMLElement, value: unknown, prevValue: unknown) => void | (() => void)

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
    el.innerHTML = String(v ?? '');
  },
  textContent: (el, v) => {
    el.textContent = v === null || v === undefined ? '' : String(v);
  },
};

const BOOLEAN_ATTRS = new Set([
  'disabled', 'checked', 'selected', 'readonly', 'multiple',
  'required', 'autofocus', 'autocomplete', 'novalidate', 'formnovalidate'
]);

const setAttribute = (el: HTMLElement, name: string, value: unknown): void => {
  if (name.startsWith('on') && typeof value === 'function') {
    const eventName = name.slice(2).toLowerCase();
    el.addEventListener(eventName, value as EventListener);
    return;
  }

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

  if (name.startsWith('bind:')) {
    const propName = name.slice(5);
    const handler = PROP_HANDLERS[propName];
    if (handler) {
      handler(el, value);
    }
    return;
  }

  if (name.startsWith('on:')) {
    const eventName = name.slice(3).toLowerCase();
    el.addEventListener(eventName, value as EventListener);
    return;
  }

  if (name.startsWith('style:')) {
    const styleProp = name.slice(6);
    if (value !== null && value !== undefined) {
      (el.style as Record<string, string>)[styleProp] = String(value);
    } else {
      el.style.removeProperty(styleProp);
    }
    return;
  }

  if (BOOLEAN_ATTRS.has(name)) {
    if (value) {
      el.setAttribute(name, '');
    } else {
      el.removeAttribute(name);
    }
    return;
  }

  if (value === null || value === undefined) {
    el.removeAttribute(name);
  } else {
    el.setAttribute(name, String(value));
  }
};

const reconcileChildren = (
  oldNode: TemplateNode,
  newNode: TemplateNode
): void => {
  const oldChildren = oldNode.children || [];
  const newChildren = newNode.children || [];
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
};

const updateElement = (oldNode: TemplateNode, newNode: TemplateNode): void => {
  const el = oldNode.ref as HTMLElement;

  if (oldNode.props && newNode.props) {
    const oldKeys = new Set(Object.keys(oldNode.props));
    const newKeys = new Set(Object.keys(newNode.props));

    for (const key of oldKeys) {
      if (!newKeys.has(key)) {
        if (key.startsWith('on')) {
          const eventName = key.slice(2).toLowerCase();
          el.removeEventListener(eventName, oldNode.props[key] as EventListener);
        } else if (!key.startsWith('bind:') && !key.startsWith('prop:')) {
          el.removeAttribute(key);
        }
      }
    }
  }

  for (const [key, value] of Object.entries(newNode.props || {})) {
    setAttribute(el, key, value);
  }

  reconcileChildren(oldNode, newNode);
};

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

  if (oldNode.type !== newNode.type || oldNode.tag !== newNode.tag) {
    unmount(oldNode);
    const el = mount(newNode, null);
    newNode.ref = el;
    return;
  }

  if (oldNode.type === 'text' && newNode.type === 'text') {
    if (oldNode.text !== newNode.text) {
      const textNode = oldNode.ref as Text;
      textNode.textContent = newNode.text || '';
    }
    return;
  }

  newNode.ref = oldNode.ref;
  updateElement(oldNode, newNode);
};

const mount = (node: TemplateNode, parent: HTMLElement | null): HTMLElement | Text => {
  if (node.type === 'text') {
    const textNode = document.createTextNode(node.text || '');
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

  const el = document.createElement(node.tag!);
  node.ref = el;

  for (const [key, value] of Object.entries(node.props || {})) {
    setAttribute(el, key, value);
  }

  const children = node.children || [];
  for (const child of children) {
    const childEl = mount(child, el);
    child.ref = childEl;
  }

  if (parent) parent.appendChild(el);
  return el;
};

const unmount = (node: TemplateNode): void => {
  if (!node.ref) return;

  if (node.type === 'text') {
    const textNode = node.ref as Text;
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

  const children = node.children || [];
  for (const child of children) {
    unmount(child);
  }

  const el = node.ref as HTMLElement;
  el.remove();
};

export const h = (
  tag: string | Component,
  props?: Record<string, unknown> | null,
  ...children: (TemplateNode | string | number | boolean | null | undefined)[]
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

  const normalizedChildren: TemplateNode[] = [];

  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      normalizedChildren.push({
        type: 'text',
        text: String(child),
        ref: null,
      });
    } else if ((child as TemplateNode).type) {
      normalizedChildren.push(child as TemplateNode);
    }
  }

  return {
    type: 'element',
    tag,
    props: props || {},
    children: normalizedChildren,
    ref: null,
  };
};

export const h Fragment(
  ...children: (TemplateNode | string | number | boolean | null | undefined)[]
): TemplateNode => {
  const normalizedChildren: TemplateNode[] = [];

  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      normalizedChildren.push({
        type: 'text',
        text: String(child),
        ref: null,
      });
    } else if ((child as TemplateNode).type) {
      normalizedChildren.push(child as TemplateNode);
    }
  }

  return {
    type: 'fragment',
    children: normalizedChildren,
    ref: null,
  };
};

export const hText = (text: string | number): TemplateNode => ({
  type: 'text',
  text: String(text),
  ref: null,
});

export const render = (
  node: TemplateNode,
  container: HTMLElement
): { cleanup: () => void } => {
  const el = mount(node, null);
  container.innerHTML = '';
  container.appendChild(el);
  node.ref = el as unknown as HTMLElement;

  return {
    cleanup: () => unmount(node),
  };
};

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

export interface ReactiveComponent {
  (): TemplateNode;
  destroy: () => void;
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
    const el = mount(node, null);
    container.innerHTML = '';
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

  return component;
};

export const hydrate = (
  node: TemplateNode,
  container: HTMLElement
): { cleanup: () => void } => {
  node.ref = container;
  const children = node.children || [];
  for (let i = 0; i < container.childNodes.length && i < children.length; i++) {
    children[i].ref = container.childNodes[i] as HTMLElement | Text;
  }

  return {
    cleanup: () => {},
  };
};

export const reconcile: <T extends TemplateNode>(
  oldNode: T,
  newNode: T
) => void = reconcile;

export { mount, unmount, setAttribute, escapeHtml };
