// Simple, reliable template system

export interface VNode {
  tag?: string;
  text?: string;
  props?: Record<string, any>;
  children?: VNode[];
  element?: HTMLElement | Text;
}

export function h(tag: string, props: Record<string, any> = {}, ...children: (VNode | string)[]): VNode {
  // Process children - convert strings to text nodes
  const processedChildren = children.flatMap(child => {
    if (typeof child === 'string') {
      return [{ text: child }];
    } else if (Array.isArray(child)) {
      return child;
    } else {
      return [child];
    }
  });

  return {
    tag,
    props,
    children: processedChildren
  };
}

export function text(content: string): VNode {
  return { text: content };
}

export function render(vnode: VNode, container: HTMLElement): void {
  const element = createElement(vnode);
  container.innerHTML = '';
  container.appendChild(element);
}

function createElement(vnode: VNode): HTMLElement | Text {
  if (vnode.text !== undefined) {
    return document.createTextNode(vnode.text);
  }

  const element = document.createElement(vnode.tag!);
  vnode.element = element;

  // Set properties and event listeners
  if (vnode.props) {
    for (const [key, value] of Object.entries(vnode.props)) {
      if (key.startsWith('on') && typeof value === 'function') {
        // Handle event listeners
        const eventName = key.substring(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else if (key === 'style' && typeof value === 'object') {
        // Handle style object
        Object.assign(element.style, value);
      } else if (key === 'className') {
        // Handle class names
        element.className = value;
      } else {
        // Handle other attributes
        element.setAttribute(key, value);
      }
    }
  }

  // Append children
  if (vnode.children) {
    for (const child of vnode.children) {
      element.appendChild(createElement(child));
    }
  }

  return element;
}

// Function to update an element (simplified diffing)
export function patchElement(oldVNode: VNode, newVNode: VNode): void {
  if (!oldVNode.element) {
    throw new Error('Cannot patch element without reference');
  }

  const element = oldVNode.element as HTMLElement;

  // If tags are different, replace the entire element
  if (oldVNode.tag !== newVNode.tag || oldVNode.text !== undefined || newVNode.text !== undefined) {
    const newElement = createElement(newVNode);
    element.parentNode?.replaceChild(newElement, element);
    newVNode.element = newElement;
    return;
  }

  // Update properties
  const oldProps = oldVNode.props || {};
  const newProps = newVNode.props || {};

  // Remove old properties
  for (const key in oldProps) {
    if (!(key in newProps)) {
      if (key.startsWith('on') && typeof oldProps[key] === 'function') {
        const eventName = key.substring(2).toLowerCase();
        element.removeEventListener(eventName, oldProps[key]);
      } else {
        element.removeAttribute(key);
      }
    }
  }

  // Set new properties
  for (const [key, value] of Object.entries(newProps)) {
    if (oldProps[key] !== value) {
      if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.substring(2).toLowerCase();
        // Remove old event listener if exists
        if (typeof oldProps[key] === 'function') {
          element.removeEventListener(eventName, oldProps[key]);
        }
        element.addEventListener(eventName, value);
      } else if (key === 'style' && typeof value === 'object') {
        // Clear old styles
        if (typeof oldProps[key] === 'object') {
          for (const styleProp in oldProps[key]) {
            (element.style as any)[styleProp] = '';
          }
        }
        // Apply new styles
        Object.assign(element.style, value);
      } else if (key === 'className') {
        element.className = value;
      } else {
        element.setAttribute(key, value);
      }
    }
  }

  // Update children
  if (newVNode.children) {
    updateChildren(element, oldVNode.children || [], newVNode.children);
  }

  newVNode.element = element;
}

function updateChildren(parent: HTMLElement, oldChildren: VNode[], newChildren: VNode[]): void {
  const maxLength = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < maxLength; i++) {
    const oldChild = oldChildren[i];
    const newChild = newChildren[i];

    if (!oldChild && newChild) {
      // Add new child
      const newElement = createElement(newChild);
      parent.appendChild(newElement);
      newChild.element = newElement;
    } else if (oldChild && !newChild) {
      // Remove old child
      if (oldChild.element) {
        parent.removeChild(oldChild.element);
      }
    } else if (oldChild && newChild) {
      // Update existing child
      if (oldChild.element && oldChild.element.parentNode) {
        patchElement(oldChild, newChild);
      } else {
        // If no parent, create new element
        const newElement = createElement(newChild);
        parent.appendChild(newElement);
        newChild.element = newElement;
      }
    }
  }
}

// Fragment helper
export function Fragment(...children: (VNode | string)[]): VNode[] {
  return children.flatMap(child => {
    if (typeof child === 'string') {
      return [{ text: child }];
    } else {
      return [child];
    }
  });
}