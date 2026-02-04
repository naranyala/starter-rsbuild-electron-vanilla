import { type BrowserWindow, ipcMain } from 'electron';
import { MainUseCase } from './base.js';

export class ElectronDevelopmentUseCase extends MainUseCase {
  constructor() {
    super({
      id: 'electron-development',
      title: 'Development Workflow',
      category: 'development',
      tags: ['development', 'workflow', 'debugging', 'hmr'],
    });
  }

  registerIPCHandlers(ipcMain: import('electron').IpcMain): void {
    // Register development workflow IPC handlers
  }

  onWindowCreated(window: BrowserWindow): void {
    console.log(`[${this.config.id}] Window created`);
  }
}
