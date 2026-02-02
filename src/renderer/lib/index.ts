/**
 * Frontend utility library
 * Utilities that work specifically in browser/frontend environments
 */

// Re-export all shared utilities
export * from '../shared';

// Re-export frontend-specific utilities
export * from './dom';
export * from './storage';
export * from './browser';
export * from './events';

// Reactivity and template system
export * from './reactivity';
export * from './template';

// Styling utilities
export * from './styling';

// Class name utilities (clsx + reactivity)
export * from './class-utils';
