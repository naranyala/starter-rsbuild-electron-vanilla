/**
 * Window management utilities for Electron main process
 * Provides helper functions for managing BrowserWindows
 */

import { join } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BrowserWindow, type BrowserWindowConstructorOptions } from 'electron';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface WindowInfo {
  window: BrowserWindow;
  id: number;
}

export class WindowManager {
  private windows: Map<number, BrowserWindow>;
  private nextId: number;

  constructor() {
    this.windows = new Map();
    this.nextId = 1;
  }

  /**
   * Create a new browser window with options
   * @param options - Window options
   * @returns Created window and its ID
   */
  createWindow(options: Partial<BrowserWindowConstructorOptions> = {}): WindowInfo {
    const defaultOptions: Partial<BrowserWindowConstructorOptions> = {
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        preload: this.getPreloadPath(),
      },
    };

    const window = new BrowserWindow({
      ...defaultOptions,
      ...options,
    } as BrowserWindowConstructorOptions);
    const windowId = this.nextId++;

    this.windows.set(windowId, window);

    // Clean up when window is closed
    window.on('closed', () => {
      this.windows.delete(windowId);
    });

    return { window, id: windowId };
  }

  /**
   * Get the preload script path based on environment
   * @returns Path to preload script
   */
  getPreloadPath(): string {
    return join(__dirname, '../preload.js');
  }

  /**
   * Get all managed windows
   * @returns Map of windows
   */
  getAllWindows(): Map<number, BrowserWindow> {
    return this.windows;
  }

  /**
   * Get a specific window by ID
   * @param id - Window ID
   * @returns Window or null if not found
   */
  getWindowById(id: number): BrowserWindow | null {
    return this.windows.get(id) || null;
  }

  /**
   * Close all windows
   */
  closeAllWindows(): void {
    for (const [_id, window] of this.windows) {
      if (!window.isDestroyed()) {
        window.close();
      }
    }
    this.windows.clear();
  }

  /**
   * Focus a specific window
   * @param id - Window ID
   */
  focusWindow(id: number): void {
    const window = this.getWindowById(id);
    if (window && !window.isDestroyed()) {
      if (window.isMinimized()) {
        window.restore();
      }
      window.focus();
    }
  }
}
