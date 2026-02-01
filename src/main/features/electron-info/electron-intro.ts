import { type BrowserWindow, ipcMain } from 'electron';
import { MainUseCase } from './base.js';

export class ElectronIntroUseCase extends MainUseCase {
  constructor() {
    super({
      id: 'electron-intro',
      title: 'What is Electron?',
      category: 'framework',
      tags: ['electron', 'desktop', 'chromium', 'nodejs', 'cross-platform'],
    });
  }

  registerIPCHandlers(ipcMain: import('electron').IpcMain): void {
    // Register IPC handlers specific to this use case
    // Example: ipcMain.handle('electron-intro:get-info', async () => { ... });
  }

  onWindowCreated(window: BrowserWindow): void {
    // Handle window creation for this use case
    console.log(`[${this.config.id}] Window created`);
  }
}
