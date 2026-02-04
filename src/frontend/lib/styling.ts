// CSS-in-JS solution using goober (1KB)
// https://goober.js.org/

import { css, setup, styled } from 'goober';
import { prefix } from 'goober/prefixer';

// Setup goober with autoprefixer
// This only needs to be called once in your app
export const initGoober = () => {
  // Setup with prefixer for vendor prefixes
  setup(undefined, prefix);
};

// Utility to create scoped styles
export const createStyles = <T extends Record<string, string>>(styles: T): T => styles;

// Re-export goober functions
export { css, styled };

// Utility for dynamic styles based on state
export const dynamicStyles = (baseStyles: string, conditionalStyles: Record<string, boolean>) => {
  const activeStyles = Object.entries(conditionalStyles)
    .filter(([, active]) => active)
    .map(([style]) => style)
    .join(' ');

  return `${baseStyles} ${activeStyles}`;
};

// CSS custom properties (variables) helper
export const setCSSVariables = (variables: Record<string, string>) => {
  const root = document.documentElement;
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
};

// Extract all CSS for SSR (useful for Electron)
export const getAllCSS = (): string => {
  const styles = document.querySelectorAll('style[data-goober]');
  return Array.from(styles)
    .map((style) => style.textContent)
    .join('\n');
};
