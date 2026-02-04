// Ultra-simple template system that works with reactivity

export interface VNode {
  tag?: string;
  text?: string;
  props?: Record<string, any>;
  children?: (VNode | string)[];
  element?: HTMLElement | Text;
}

// Create a virtual node
export function h(tag: string, props: Record<string, any> = {}, ...children: (VNode | string)[]): VNode {
  return {
    tag,
    props,
    children: children.flat(Infinity) as (VNode | string)[]
  };
}

// Create a text node
export function text(content: string): VNode {
  return { text: content };
}

// Mount the virtual node to a real DOM element
export function mount(vnode: VNode, container: HTMLElement): void {
  const element = createElement(vnode);
  container.appendChild(element);
  vnode.element = element;
}

// Update an existing element
export function updateElement(vnode: VNode): void {
  if (!vnode.element) {
    throw new Error('Cannot update element without reference');
  }

  const element = vnode.element as HTMLElement;
  
  // For now, just recreate the element completely
  // This is simpler and more reliable than complex diffing
  const newElement = createElement(vnode);
  element.parentNode?.replaceChild(newElement, element);
  vnode.element = newElement;
}

function createElement(vnode: VNode): HTMLElement | Text {
  if (vnode.text !== undefined) {
    return document.createTextNode(vnode.text);
  }

  const element = document.createElement(vnode.tag!);
  
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
      } else if (key === 'ref') {
        // Handle ref callback
        if (typeof value === 'function') {
          value(element);
        }
      } else {
        // Handle other attributes
        element.setAttribute(key, value);
      }
    }
  }

  // Append children
  if (vnode.children) {
    for (const child of vnode.children) {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(createElement(child));
      }
    }
  }

  return element;
}

// Fragment helper
export function Fragment(...children: (VNode | string)[]): (VNode | string)[] {
  return children.flat(Infinity);
}

// A reactive component that re-renders when signals change
export function reactiveComponent(renderer: () => VNode, container: HTMLElement): void {
  let currentVNode: VNode | null = null;
  
  // Initial render
  currentVNode = renderer();
  const element = createElement(currentVNode);
  container.innerHTML = '';
  container.appendChild(element);
  currentVNode.element = element;
  
  // Return a function to update the component
  return function update() {
    const newVNode = renderer();
    if (currentVNode) {
      const newElement = createElement(newVNode);
      if (currentVNode.element && currentVNode.element.parentNode) {
        currentVNode.element.parentNode.replaceChild(newElement, currentVNode.element);
        newVNode.element = newElement;
        currentVNode = newVNode;
      }
    }
  };
}