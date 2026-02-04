/**
 * File system utility functions for Node.js/backend environments
 * Enhanced file operations with error handling and additional functionality
 */

import { promises as fs } from 'node:fs';
import { createReadStream, createWriteStream } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';

/**
 * Check if a file or directory exists
 * @param path - Path to check
 * @returns True if path exists
 */
export const exists = async (path: string): Promise<boolean> => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get file statistics
 * @param path - File path
 * @returns File stats or null if file doesn't exist
 */
export const getStats = async (path: string): Promise<import('node:fs').Stats | null> => {
  try {
    return await fs.stat(path);
  } catch {
    return null;
  }
};

/**
 * Check if path is a directory
 * @param path - Path to check
 * @returns True if path is a directory
 */
export const isDirectory = async (path: string): Promise<boolean> => {
  const stats = await getStats(path);
  return stats ? stats.isDirectory() : false;
};

/**
 * Check if path is a file
 * @param path - Path to check
 * @returns True if path is a file
 */
export const isFile = async (path: string): Promise<boolean> => {
  const stats = await getStats(path);
  return stats ? stats.isFile() : false;
};

/**
 * Create directory recursively if it doesn't exist
 * @param path - Directory path to create
 * @param options - Directory creation options
 */
export const ensureDirectory = async (
  path: string,
  options: { recursive?: boolean; mode?: number } = { recursive: true }
): Promise<void> => {
  if (!(await exists(path))) {
    await fs.mkdir(path, options);
  }
};

/**
 * Read file as text
 * @param path - File path
 * @param encoding - File encoding (default: 'utf8')
 * @returns File content as string
 */
export const readFile = async (
  path: string,
  encoding: BufferEncoding = 'utf8'
): Promise<string> => {
  return await fs.readFile(path, encoding);
};

/**
 * Write file with directory creation
 * @param path - File path
 * @param data - Data to write
 * @param options - Write options
 */
export const writeFile = async (
  path: string,
  data: string | Buffer,
  options: { encoding?: BufferEncoding; flag?: string } = {}
): Promise<void> => {
  // Ensure directory exists
  await ensureDirectory(dirname(path));
  await fs.writeFile(path, data, options);
};

/**
 * Append to file with directory creation
 * @param path - File path
 * @param data - Data to append
 * @param options - Append options
 */
export const appendFile = async (
  path: string,
  data: string | Buffer,
  options: { encoding?: BufferEncoding; flag?: string } = {}
): Promise<void> => {
  // Ensure directory exists
  await ensureDirectory(dirname(path));
  await fs.appendFile(path, data, options);
};

/**
 * Delete file or directory
 * @param path - Path to delete
 * @param options - Deletion options
 */
export const remove = async (
  path: string,
  options: { recursive?: boolean; force?: boolean } = { recursive: true }
): Promise<void> => {
  try {
    if (await isDirectory(path)) {
      await fs.rm(path, { recursive: options.recursive, force: options.force });
    } else {
      await fs.unlink(path);
    }
  } catch (error) {
    // Ignore errors if path doesn't exist
    if ((error as any).code !== 'ENOENT') {
      throw error;
    }
  }
};

/**
 * Copy file or directory
 * @param source - Source path
 * @param destination - Destination path
 * @param options - Copy options
 */
export const copy = async (
  source: string,
  destination: string,
  options: { recursive?: boolean; overwrite?: boolean } = { recursive: true }
): Promise<void> => {
  const sourceStats = await getStats(source);
  if (!sourceStats) {
    throw new Error(`Source path does not exist: ${source}`);
  }

  // Ensure destination directory exists
  await ensureDirectory(dirname(destination));

  if (sourceStats.isDirectory()) {
    if (options.recursive) {
      await fs.cp(source, destination, { recursive: true });
    } else {
      throw new Error('Cannot copy directory without recursive option');
    }
  } else {
    await fs.copyFile(source, destination);
  }
};

/**
 * Move or rename file or directory
 * @param source - Source path
 * @param destination - Destination path
 */
export const move = async (source: string, destination: string): Promise<void> => {
  // Ensure destination directory exists
  await ensureDirectory(dirname(destination));
  await fs.rename(source, destination);
};

/**
 * List directory contents
 * @param path - Directory path
 * @param options - Listing options
 * @returns Array of directory entries
 */
export const listDirectory = async (
  path: string,
  options: { withFileTypes?: boolean; recursive?: boolean } = {}
): Promise<string[] | import('node:fs').Dirent[]> => {
  if (!await isDirectory(path)) {
    throw new Error(`Path is not a directory: ${path}`);
  }

  if (options.recursive) {
    const entries: import('node:fs').Dirent[] = [];
    const walk = async (dir: string) => {
      const items = await fs.readdir(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = join(dir, item.name);
        entries.push(item);
        if (item.isDirectory()) {
          await walk(fullPath);
        }
      }
    };
    await walk(path);
    return entries;
  } else {
    return await fs.readdir(path, { withFileTypes: options.withFileTypes || false });
  }
};

/**
 * Get directory size recursively
 * @param path - Directory path
 * @returns Total size in bytes
 */
export const getDirectorySize = async (path: string): Promise<number> => {
  let totalSize = 0;
  const entries = await listDirectory(path, { recursive: true, withFileTypes: true }) as import('node:fs').Dirent[];

  for (const entry of entries) {
    if (entry.isFile()) {
      const fullPath = join(path, entry.name);
      const stats = await getStats(fullPath);
      if (stats) {
        totalSize += stats.size;
      }
    }
  }

  return totalSize;
};

/**
 * Create temporary file
 * @param prefix - Filename prefix
 * @param suffix - Filename suffix
 * @param directory - Temporary directory (default: system temp)
 * @returns Path to created temporary file
 */
export const createTempFile = async (
  prefix = 'tmp',
  suffix = '',
  directory?: string
): Promise<string> => {
  const tmpDir = directory || (await import('node:os')).tmpdir();
  const { path: tmpPath } = await import('node:tmp');
  
  return new Promise((resolve, reject) => {
    tmpFile({ 
      prefix, 
      suffix, 
      dir: directory ? directory : undefined 
    }, (err, path) => {
      if (err) {
        reject(err);
      } else {
        resolve(path);
      }
    });
  });
};

/**
 * Watch file or directory for changes
 * @param path - Path to watch
 * @param callback - Change callback
 * @param options - Watch options
 * @returns File system watcher
 */
export const watch = (
  path: string,
  callback: (eventType: string, filename: string | null) => void,
  options: { recursive?: boolean } = {}
): import('node:fs').FSWatcher => {
  return fs.watch(path, options, callback);
};

/**
 * Get file extension
 * @param path - File path
 * @returns File extension (with dot)
 */
export const getFileExtension = (path: string): string => {
  return extname(path);
};

/**
 * Get filename without extension
 * @param path - File path
 * @returns Filename without extension
 */
export const getFileName = (path: string): string => {
  return basename(path, extname(path));
};

/**
 * Join path segments safely
 * @param paths - Path segments to join
 * @returns Joined path
 */
export const joinPath = (...paths: string[]): string => {
  return join(...paths);
};

/**
 * Resolve path to absolute
 * @param paths - Path segments to resolve
 * @returns Resolved absolute path
 */
export const resolvePath = (...paths: string[]): string => {
  return resolve(...paths);
};

/**
 * Clean path (normalize and remove . and ..)
 * @param path - Path to clean
 * @returns Cleaned path
 */
export const cleanPath = (path: string): string => {
  const { normalize } = await import('node:path');
  return normalize(path);
};

/**
 * Calculate file hash
 * @param path - File path
 * @param algorithm - Hash algorithm (default: 'sha256')
 * @returns File hash as hex string
 */
export const getFileHash = async (
  path: string,
  algorithm: 'sha1' | 'sha256' | 'md5' = 'sha256'
): Promise<string> => {
  const crypto = await import('node:crypto');
  const hash = crypto.createHash(algorithm);
  const stream = createReadStream(path);
  
  return new Promise((resolve, reject) => {
    stream.on('data', (data) => {
      hash.update(data);
    });
    
    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
    
    stream.on('error', reject);
  });
};

/**
 * Compress file
 * @param sourcePath - Source file path
 * @param destinationPath - Destination archive path
 * @param format - Compression format ('zip' or 'gzip')
 */
export const compressFile = async (
  sourcePath: string,
  destinationPath: string,
  format: 'zip' | 'gzip' = 'zip'
): Promise<void> => {
  if (format === 'zip') {
    const archiver = await import('archiver');
    const output = createWriteStream(destinationPath);
    const archive = archiver('zip');

    return new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      
      archive.pipe(output);
      archive.file(sourcePath, { name: getFileName(sourcePath) });
      archive.finalize();
    });
  } else if (format === 'gzip') {
    const zlib = await import('node:zlib');
    const input = createReadStream(sourcePath);
    const output = createWriteStream(destinationPath);
    
    return new Promise((resolve, reject) => {
      const gzip = zlib.createGzip();
      
      input.on('error', reject);
      gzip.on('error', reject);
      output.on('error', reject);
      output.on('finish', resolve);
      
      input.pipe(gzip).pipe(output);
    });
  }
};