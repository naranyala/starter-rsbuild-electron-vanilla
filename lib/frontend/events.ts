/**
 * Event utility functions for frontend environments
 * Enhanced event handling and DOM event management
 */

/**
 * Add event listener with automatic cleanup
 * @param element - Target element
 * @param event - Event type
 * @param handler - Event handler
 * @param options - Event listener options
 * @returns Cleanup function
 */
export const addEventListener = <K extends keyof HTMLElementEventMap>(
  element: Element,
  event: K,
  handler: (this: Element, ev: HTMLElementEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): (() => void) => {
  element.addEventListener(event, handler, options);

  return () => {
    element.removeEventListener(event, handler, options);
  };
};

/**
 * Delegate event handling to parent element
 * @param parent - Parent element
 * @param selector - Child selector
 * @param event - Event type
 * @param handler - Event handler
 * @returns Cleanup function
 */
export const delegateEvent = <K extends keyof HTMLElementEventMap>(
  parent: Element,
  selector: string,
  event: K,
  handler: (this: Element, ev: HTMLElementEventMap[K], target: Element) => any
): (() => void) => {
  const delegatedHandler = (e: HTMLElementEventMap[K]) => {
    const target = (e.target as Element)?.closest(selector);
    if (target && parent.contains(target)) {
      handler.call(target, e, target);
    }
  };

  parent.addEventListener(event, delegatedHandler);

  return () => {
    parent.removeEventListener(event, delegatedHandler);
  };
};

/**
 * Trigger custom event
 * @param element - Target element
 * @param eventName - Event name
 * @param detail - Event detail data
 * @param options - Event options
 */
export const triggerEvent = (
  element: Element,
  eventName: string,
  detail?: any,
  options: CustomEventInit = {}
): void => {
  const event = new CustomEvent(eventName, {
    detail,
    ...options,
  });
  element.dispatchEvent(event);
};

/**
 * Wait for DOM content to be loaded
 * @param callback - Callback function
 * @param timeout - Maximum wait time in milliseconds
 */
export const waitForDOMReady = (callback: () => void, timeout = 10000): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.readyState === 'loading') {
      const handler = () => {
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
          callback();
          resolve();
        }
      };

      document.addEventListener('readystatechange', handler);

      setTimeout(() => {
        document.removeEventListener('readystatechange', handler);
        if (document.readyState !== 'complete') {
          callback(); // Fallback if DOM never becomes ready
          resolve();
        }
      }, timeout);
    } else {
      callback();
      resolve();
    }
  });
};

/**
 * Prevent default event behavior
 * @param event - Event object
 */
export const preventDefault = (event: Event): void => {
  event.preventDefault();
};

/**
 * Stop event propagation
 * @param event - Event object
 */
export const stopPropagation = (event: Event): void => {
  event.stopPropagation();
};

/**
 * Check if event is a keyboard event
 * @param event - Event object
 * @returns True if keyboard event
 */
export const isKeyboardEvent = (event: Event): event is KeyboardEvent => {
  return 'key' in event;
};

/**
 * Check if event is a mouse event
 * @param event - Event object
 * @returns True if mouse event
 */
export const isMouseEvent = (event: Event): event is MouseEvent => {
  return 'button' in event;
};

/**
 * Check if event is a touch event
 * @param event - Event object
 * @returns True if touch event
 */
export const isTouchEvent = (event: Event): event is TouchEvent => {
  return 'touches' in event;
};

/**
 * Get event target element safely
 * @param event - Event object
 * @returns Target element or null
 */
export const getTarget = (event: Event): Element | null => {
  return (event.target as Element) || null;
};

/**
 * Get coordinates from mouse/touch event
 * @param event - Event object
 * @returns Coordinates object
 */
export const getCoordinates = (event: Event): { x: number; y: number } => {
  const mouseEvent = event as MouseEvent;
  const touchEvent = event as TouchEvent;

  if (mouseEvent) {
    return {
      x: mouseEvent.clientX,
      y: mouseEvent.clientY,
    };
  } else if (touchEvent && touchEvent.touches.length > 0) {
    return {
      x: touchEvent.touches[0].clientX,
      y: touchEvent.touches[0].clientY,
    };
  }

  return { x: 0, y: 0 };
};
