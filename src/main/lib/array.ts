/**
 * Simple array utility functions
 */

export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const isEmpty = <T>(array: T[]): boolean => {
  return array.length === 0;
};
