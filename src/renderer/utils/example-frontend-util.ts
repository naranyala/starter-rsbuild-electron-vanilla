/**
 * Example frontend utility function
 * This demonstrates the frontend lib folder structure
 */

export function formatTitle(title) {
  return title
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number) {
  let timeout: NodeJS.Timeout | undefined;
  return function executedFunction(...args: Parameters<T>): ReturnType<T> | undefined {
    const later = () => {
      clearTimeout(timeout);
      return func(...args);
    };
    clearTimeout(timeout);
    return setTimeout(later, wait) as unknown as ReturnType<T> | undefined;
  };
}
