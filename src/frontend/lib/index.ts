/**
 * Frontend utility library
 * Utilities that work specifically in browser/frontend environments
 */

// Re-export all shared utilities
export * from '../shared';

// Re-export frontend-specific utilities
export * from './browser';
export * from './events';

// Reactivity system
export * from './reactivity';

// Template system (needs to be imported separately to avoid conflicts)
export { h, Fragment, render, startReactiveRender, reRender, createReactiveComponent, hydrate, reconcile, hText, keyed, show, each } from './template';

// DOM utilities (needs to be imported separately to avoid conflicts)
export { DOM } from './dom';

// Styling utilities
export * from './styling';

// Class name utilities (clsx + reactivity)
export * from './class-utils';

// Storage utilities
export * from './storage';
