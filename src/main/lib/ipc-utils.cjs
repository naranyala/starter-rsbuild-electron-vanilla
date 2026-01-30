/**
 * IPC utility for Electron main process
 * Provides helper functions for inter-process communication
 */

const { ipcMain } = require('electron');

const IpcUtils = {
  /**
   * Register an IPC handler with error handling
   * @param {string} channel - IPC channel name
   * @param {Function} handler - Handler function
   */
  registerHandler: function(channel, handler) {
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        const result = await handler(event, ...args);
        return { success: true, data: result };
      } catch (error) {
        console.error(`IPC Error on channel '${channel}':`, error);
        return { success: false, error: error.message };
      }
    });
  },

  /**
   * Send a message to a specific window
   * @param {Electron.BrowserWindow} window - Target window
   * @param {string} channel - IPC channel name
   * @param {*} data - Data to send
   */
  sendMessage: function(window, channel, data) {
    if (
      window &&
      !window.isDestroyed() &&
      window.webContents &&
      !window.webContents.isDestroyed()
    ) {
      window.webContents.send(channel, data);
    }
  },

  /**
   * Broadcast a message to all windows
   * @param {Electron.BrowserWindow[]} windows - Array of windows
   * @param {string} channel - IPC channel name
   * @param {*} data - Data to send
   */
  broadcastMessage: function(windows, channel, data) {
    windows.forEach((window) => {
      IpcUtils.sendMessage(window, channel, data);
    });
  },

  /**
   * Register a one-time listener
   * @param {string} channel - IPC channel name
   * @param {Function} handler - Handler function
   */
  once: function(channel, handler) {
    ipcMain.once(channel, handler);
  }
};

module.exports = IpcUtils;
