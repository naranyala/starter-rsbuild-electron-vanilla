import clsx from 'clsx';
import { css, styled } from 'goober';
import type { ReadonlySignal, Signal } from './reactivity';

export type ClassValue =
  | string
  | number
  | bigint
  | boolean
  | ClassArray
  | ClassDictionary
  | null
  | undefined
  | Signal<string>
  | Signal<boolean>
  | (() => string);

export interface ClassDictionary {
  [id: string]: boolean | Signal<boolean> | (() => boolean) | undefined | null;
}

export interface ClassArray extends Array<ClassValue> {}

// Reactive clsx - handles signals and functions
export const rx = (...inputs: ClassValue[]): string => {
  const resolved = inputs.map((input) => {
    // Handle signals
    if (input && typeof input === 'function' && 'subscribe' in input) {
      return (input as Signal<unknown>)();
    }
    // Handle function calls
    if (typeof input === 'function') {
      return input();
    }
    // Handle objects with signal values
    if (input && typeof input === 'object' && !Array.isArray(input)) {
      const resolved: Record<string, boolean> = {};
      for (const [key, value] of Object.entries(input)) {
        if (value && typeof value === 'function' && 'subscribe' in value) {
          resolved[key] = Boolean((value as Signal<unknown>)());
        } else if (typeof value === 'function') {
          resolved[key] = Boolean(value());
        } else {
          resolved[key] = Boolean(value);
        }
      }
      return resolved;
    }
    return input;
  });

  return clsx(resolved);
};

// Create reactive CSS class that updates when signals change
export const createRxClass = (
  styleTemplate: (values: Record<string, unknown>) => string,
  signals: Record<string, Signal<unknown> | (() => unknown)>
): (() => string) => {
  let currentClass: string | null = null;
  let unsubscribeFns: Array<() => void> = [];

  const computeStyles = () => {
    const values: Record<string, unknown> = {};

    for (const [key, signalOrFn] of Object.entries(signals)) {
      if (signalOrFn && typeof signalOrFn === 'function' && 'subscribe' in signalOrFn) {
        values[key] = (signalOrFn as Signal<unknown>)();
      } else if (typeof signalOrFn === 'function') {
        values[key] = signalOrFn();
      } else {
        values[key] = signalOrFn;
      }
    }

    currentClass = css`${styleTemplate(values)}`;
    return currentClass;
  };

  // Subscribe to all signals
  for (const [key, signalOrFn] of Object.entries(signals)) {
    if (signalOrFn && typeof signalOrFn === 'function' && 'subscribe' in signalOrFn) {
      const unsub = (signalOrFn as Signal<unknown>).subscribe(() => {
        computeStyles();
      });
      unsubscribeFns.push(unsub);
    }
  }

  // Return getter function
  const getter = () => currentClass || computeStyles();
  getter.cleanup = () => {
    unsubscribeFns.forEach((unsub) => unsub());
    unsubscribeFns = [];
  };

  return getter;
};

// Combine clsx with goober for conditional styled classes
export const cx = (...inputs: ClassValue[]): string => {
  // First resolve any reactive values
  const resolvedInputs = inputs.map((input) => {
    if (typeof input === 'function' && !('subscribe' in input)) {
      // Regular function
      return input();
    }
    if (input && typeof input === 'function' && 'subscribe' in input) {
      // Signal
      return (input as Signal<unknown>)();
    }
    if (input && typeof input === 'object' && !Array.isArray(input)) {
      // Object with possible signal values
      const resolved: Record<string, boolean> = {};
      for (const [key, value] of Object.entries(input)) {
        if (value && typeof value === 'function' && 'subscribe' in value) {
          resolved[key] = Boolean((value as Signal<unknown>)());
        } else if (typeof value === 'function') {
          resolved[key] = Boolean(value());
        } else {
          resolved[key] = Boolean(value);
        }
      }
      return resolved;
    }
    return input;
  });

  return clsx(resolvedInputs);
};

// Create a styled component with reactive class support
export const createComponent = <P extends Record<string, unknown>>(
  tag: string,
  baseStyles: string,
  variantStyles: Record<string, (props: P) => string>
) => {
  return (props: P & { className?: string | (() => string) }) => {
    const { className, ...rest } = props;

    // Compute base class
    const classes = [baseStyles];

    // Add variant classes
    for (const [variant, styleFn] of Object.entries(variantStyles)) {
      const variantClass = css`${styleFn(rest as P)}`;
      classes.push(variantClass);
    }

    // Add custom className
    if (className) {
      if (typeof className === 'function') {
        classes.push(className());
      } else {
        classes.push(className);
      }
    }

    return clsx(classes);
  };
};

// Utility for responsive styles
export const responsive = (styles: { base: string } & { [breakpoint: string]: string }): string => {
  const { base, ...breakpoints } = styles;

  const breakpointRules = Object.entries(breakpoints)
    .map(([bp, style]) => {
      const minWidth =
        {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1536px',
        }[bp] || bp;

      return `@media (min-width: ${minWidth}) { ${style} }`;
    })
    .join('\n');

  return css`
    ${base}
    ${breakpointRules}
  `;
};

// Theme-aware styles
export const themable = (darkStyles: string, lightStyles: string): string => {
  return css`
    @media (prefers-color-scheme: dark) {
      ${darkStyles}
    }
    
    @media (prefers-color-scheme: light) {
      ${lightStyles}
    }
  `;
};

// Animation helper with clsx support
export const animate = (
  name: string,
  keyframes: string,
  options?: {
    duration?: string;
    timing?: string;
    delay?: string;
    iteration?: string;
    direction?: string;
    fillMode?: string;
    playState?: string;
  }
): string => {
  const {
    duration = '0.3s',
    timing = 'ease',
    delay = '0s',
    iteration = '1',
    direction = 'normal',
    fillMode = 'forwards',
    playState = 'running',
  } = options || {};

  return css`
    @keyframes ${name} {
      ${keyframes}
    }
    
    animation-name: ${name};
    animation-duration: ${duration};
    animation-timing-function: ${timing};
    animation-delay: ${delay};
    animation-iteration-count: ${iteration};
    animation-direction: ${direction};
    animation-fill-mode: ${fillMode};
    animation-play-state: ${playState};
  `;
};

// Utility to create BEM-style classes
export const bem = (block: string, element?: string, modifier?: string | string[]): string => {
  let className = block;

  if (element) {
    className += `__${element}`;
  }

  if (modifier) {
    const modifiers = Array.isArray(modifier) ? modifier : [modifier];
    return modifiers.map((mod) => `${className}--${mod}`).join(' ');
  }

  return className;
};

// Reactive BEM
export const rxBem = (
  block: string | Signal<string>,
  element?: string | Signal<string>,
  modifier?: string | string[] | Signal<string> | Signal<string[]>
): (() => string) => {
  return () => {
    const b =
      typeof block === 'function' && 'subscribe' in block ? (block as Signal<string>)() : block;
    const e =
      element && typeof element === 'function' && 'subscribe' in element
        ? (element as Signal<string>)()
        : element;
    const m =
      modifier && typeof modifier === 'function' && 'subscribe' in modifier
        ? (modifier as Signal<string | string[]>)()
        : modifier;

    return bem(b as string, e as string | undefined, m as string | string[] | undefined);
  };
};

// Export everything
export { clsx, css, styled };
export default clsx;
