/**
 * Window management utilities for Electron main process
 * Provides helper functions for managing BrowserWindows
 */

class WindowManager {
  constructor() {
    this.windows = new Map();
    this.nextId = 1;
  }

  /**
   * Create a new browser window with options
   * @param {Electron.BrowserWindowConstructorOptions} options - Window options
   * @returns {Electron.BrowserWindow} - Created window
   */
  createWindow(options = {}) {
    const { BrowserWindow } = require('electron');
    const defaultOptions = {
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        preload: this.getPreloadPath(),
      },
    };

    const window = new BrowserWindow({ ...defaultOptions, ...options });
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
   * @returns {string} - Path to preload script
   */
  getPreloadPath() {
    const path = require('node:path');
    const serve = process.argv.some((val) => val === '--start-dev');

    if (serve) {
      return path.join(__dirname, '../dist', 'preload.js');
    } else {
      return path.join(__dirname, '../dist', 'preload.js');
    }
  }

  /**
   * Get all managed windows
   * @returns {Map<number, Electron.BrowserWindow>} - Map of windows
   */
  getAllWindows() {
    return this.windows;
  }

  /**
   * Get a specific window by ID
   * @param {number} id - Window ID
   * @returns {Electron.BrowserWindow|null} - Window or null if not found
   */
  getWindowById(id) {
    return this.windows.get(id) || null;
  }

  /**
   * Close all windows
   */
  closeAllWindows() {
    for (const [_id, window] of this.windows) {
      if (!window.isDestroyed()) {
        window.close();
      }
    }
    this.windows.clear();
  }

  /**
   * Focus a specific window
   * @param {number} id - Window ID
   */
  focusWindow(id) {
    const window = this.getWindowById(id);
    if (window && !window.isDestroyed()) {
      if (window.isMinimized()) {
        window.restore();
      }
      window.focus();
    }
  }
}

module.exports = WindowManager;
