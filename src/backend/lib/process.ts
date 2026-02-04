/**
 * Process utility functions for Node.js/backend environments
 * Enhanced process handling and system information
 */

/**
 * Get current process information
 * @returns Process information object
 */
export const getProcessInfo = () => {
  return {
    pid: process.pid,
    ppid: process.ppid,
    title: process.title,
    version: process.version,
    versions: process.versions,
    platform: process.platform,
    arch: process.arch,
    env: process.env,
    cwd: process.cwd(),
  };
};

/**
 * Get environment variable with default value
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set
 * @returns Environment variable value or default
 */
export const getEnv = (key: string, defaultValue?: string): string | undefined => {
  return process.env[key] || defaultValue;
};

/**
 * Set environment variable
 * @param key - Environment variable name
 * @param value - Value to set
 */
export const setEnv = (key: string, value: string): void => {
  process.env[key] = value;
};

/**
 * Check if running in development environment
 * @returns True if in development
 */
export const isDevelopment = (): boolean => {
  return getEnv('NODE_ENV') === 'development';
};

/**
 * Check if running in production environment
 * @returns True if in production
 */
export const isProduction = (): boolean => {
  return getEnv('NODE_ENV') === 'production';
};

/**
 * Get command line arguments
 * @returns Array of command line arguments
 */
export const getArguments = (): string[] => {
  return process.argv.slice(2); // Remove node and script path
};

/**
 * Exit process with code
 * @param code - Exit code (default: 0)
 */
export const exit = (code = 0): void => {
  process.exit(code);
};

/**
 * Register cleanup handler
 * @param handler - Cleanup function
 */
export const onExit = (handler: () => void | Promise<void>): void => {
  process.on('exit', handler);
  process.on('SIGINT', handler);
  process.on('SIGTERM', handler);
};

/**
 * Get memory usage information
 * @returns Memory usage object
 */
export const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  return {
    rss: usage.rss,
    heapTotal: usage.heapTotal,
    heapUsed: usage.heapUsed,
    external: usage.external,
    arrayBuffers: usage.arrayBuffers,
  };
};

/**
 * Get CPU usage information
 * @returns CPU usage object
 */
export const getCpuUsage = () => {
  return process.cpuUsage();
};

/**
 * Get system uptime
 * @returns System uptime in seconds
 */
export const getUptime = (): number => {
  return process.uptime();
};

/**
 * Change working directory
 * @param path - New working directory
 */
export const changeDirectory = (path: string): void => {
  process.chdir(path);
};

/**
 * Get user information
 * @returns User information object
 */
export const getUserInfo = () => {
  return {
    uid: process.getuid?.(),
    gid: process.getgid?.(),
    username: getEnv('USER') || getEnv('USERNAME'),
    home: getEnv('HOME') || getEnv('USERPROFILE'),
  };
};

/**
 * Handle uncaught exceptions
 * @param handler - Exception handler
 */
export const onUncaughtException = (handler: (error: Error) => void): void => {
  process.on('uncaughtException', handler);
};

/**
 * Handle unhandled promise rejections
 * @param handler - Rejection handler
 */
export const onUnhandledRejection = (
  handler: (reason: unknown, promise: Promise<unknown>) => void
): void => {
  process.on('unhandledRejection', handler);
};

/**
 * Set process title
 * @param title - Process title
 */
export const setTitle = (title: string): void => {
  process.title = title;
};
