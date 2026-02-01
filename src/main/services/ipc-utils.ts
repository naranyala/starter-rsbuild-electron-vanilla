/**
 * IPC utility for Electron main process
 * Provides helper functions for inter-process communication
 */

import { type BrowserWindow, type IpcMainEvent, ipcMain } from 'electron';

export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export type IpcHandler = (event: import('electron').IpcMainInvokeEvent, ...args: any[]) => Promise<any> | any;

export interface IpcUtilsInterface {
  registerHandler: (channel: string, handler: IpcHandler) => void;
  sendMessage: (window: BrowserWindow, channel: string, data: any) => void;
  broadcastMessage: (windows: BrowserWindow[], channel: string, data: any) => void;
  once: (channel: string, handler: (event: import('electron').IpcMainEvent, ...args: any[]) => void) => void;
}

export const IpcUtils: IpcUtilsInterface = {
  /**
   * Register an IPC handler with error handling
   * @param channel - IPC channel name
   * @param handler - Handler function
   */
  registerHandler: (channel: string, handler: IpcHandler): void => {
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        const result = await handler(event, ...args);
        return { success: true, data: result } as IpcResponse;
      } catch (error: any) {
        console.error(`IPC Error on channel '${channel}':`, error);
        return { success: false, error: error.message } as IpcResponse;
      }
    });
  },

  /**
   * Send a message to a specific window
   * @param window - Target window
   * @param channel - IPC channel name
   * @param data - Data to send
   */
  sendMessage: (window: BrowserWindow, channel: string, data: any): void => {
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
   * @param windows - Array of windows
   * @param channel - IPC channel name
   * @param data - Data to send
   */
  broadcastMessage: (windows: BrowserWindow[], channel: string, data: any): void => {
    for (const window of windows) {
      IpcUtils.sendMessage(window, channel, data);
    }
  },

  /**
   * Register a one-time listener
   * @param channel - IPC channel name
   * @param handler - Handler function
   */
  once: (channel: string, handler: (event: IpcMainEvent, ...args: any[]) => void): void => {
    ipcMain.once(channel, handler);
  },
};
