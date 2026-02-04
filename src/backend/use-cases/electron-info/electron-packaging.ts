import { type BrowserWindow, ipcMain } from 'electron';
import { MainUseCase } from './base.js';

export class ElectronPackagingUseCase extends MainUseCase {
  constructor() {
    super({
      id: 'electron-packaging',
      title: 'Packaging and Distribution',
      category: 'packaging',
      tags: ['packaging', 'distribution', 'electron-builder', 'installer'],
    });
  }

  registerIPCHandlers(ipcMain: import('electron').IpcMain): void {
    // Register packaging-related IPC handlers
  }

  onWindowCreated(window: BrowserWindow): void {
    console.log(`[${this.config.id}] Window created`);
  }
}
