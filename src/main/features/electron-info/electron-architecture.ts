import { type BrowserWindow, ipcMain } from 'electron';
import { MainUseCase } from './base.js';

export class ElectronArchitectureUseCase extends MainUseCase {
  constructor() {
    super({
      id: 'electron-architecture',
      title: 'Electron Architecture',
      category: 'architecture',
      tags: ['main-process', 'renderer-process', 'ipc', 'architecture'],
    });
  }

  registerIPCHandlers(ipcMain: import('electron').IpcMain): void {
    // Register IPC handlers for architecture-related operations
  }

  onWindowCreated(window: BrowserWindow): void {
    console.log(`[${this.config.id}] Window created`);
  }
}
