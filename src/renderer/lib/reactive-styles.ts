import { css, styled } from 'goober';
import type { Computed, Signal } from './reactivity';

// Reactive CSS - automatically updates when signals change
export const reactiveCSS = (template: string, signals: Signal<unknown>[]): string => {
  const className = css`${template}`;

  // Subscribe to signal changes and update styles
  signals.forEach((signal) => {
    signal.subscribe(() => {
      // Force style recalculation by touching the signal
      signal();
    });
  });

  return className;
};

// Create styles that react to signal changes
export const createReactiveStyles = <T extends Record<string, Signal<unknown>>>(
  styleFn: (values: { [K in keyof T]: T[K] extends Signal<infer V> ? V : never }) => string,
  signals: T
): (() => string) => {
  let currentClassName: string | null = null;

  const updateStyles = () => {
    const values = Object.fromEntries(
      Object.entries(signals).map(([key, signal]) => [key, (signal as Signal<unknown>)()])
    ) as { [K in keyof T]: T[K] extends Signal<infer V> ? V : never };

    currentClassName = css`${styleFn(values)}`;
    return currentClassName;
  };

  // Subscribe to all signals
  Object.values(signals).forEach((signal) => {
    (signal as Signal<unknown>).subscribe(() => {
      updateStyles();
    });
  });

  // Return function that gets current class name
  return () => currentClassName || updateStyles();
};

// Styled component that accepts reactive props
export const createStyledComponent = <P extends Record<string, unknown>>(
  tag: string,
  styleFn: (props: P) => string
) => {
  return (props: P) => {
    const styles = styleFn(props);
    return css`${styles}`;
  };
};

// Utility to combine static and reactive styles
export const combineStyles = (
  staticClass: string,
  reactiveClass: string | (() => string)
): string => {
  const reactive = typeof reactiveClass === 'function' ? reactiveClass() : reactiveClass;
  return `${staticClass} ${reactive}`;
};

// Theme-aware styled component
interface Theme {
  bgPrimary: string;
  bgCard: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accent: string;
}

export const createThemedComponent = (tag: string, styleFn: (theme: Theme) => string) => {
  return (theme: Theme) => {
    return css`${styleFn(theme)}`;
  };
};

// Keyframes animation helper
export const createAnimation = (name: string, keyframes: string): string => {
  return css`
    @keyframes ${name} {
      ${keyframes}
    }
  `;
};

// Responsive style helper
export const responsive = (styles: { [breakpoint: string]: string }): string => {
  const breakpoints: Record<string, string> = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  };

  return Object.entries(styles)
    .map(([bp, style]) => {
      if (bp === 'base') return style;
      const minWidth = breakpoints[bp] || bp;
      return `@media (min-width: ${minWidth}) { ${style} }`;
    })
    .join('\n');
};

// CSS variables helper for dynamic theming
export const createCSSVariables = (vars: Record<string, Signal<string> | string>): string => {
  const resolved = Object.entries(vars)
    .map(([key, value]) => {
      const val =
        typeof value === 'function' && 'subscribe' in value ? (value as Signal<string>)() : value;
      return `--${key}: ${val};`;
    })
    .join('\n');

  return css`
    ${resolved}
  `;
};

// Export everything
export { css, styled };
export * from './reactivity';
