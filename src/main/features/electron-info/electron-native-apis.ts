import { type BrowserWindow, ipcMain } from 'electron';
import { MainUseCase } from './base.js';

export class ElectronNativeApisUseCase extends MainUseCase {
  constructor() {
    super({
      id: 'electron-native-apis',
      title: 'Native Operating System APIs',
      category: 'api',
      tags: ['native-api', 'file-system', 'notifications', 'dialogs'],
    });
  }

  registerIPCHandlers(ipcMain: import('electron').IpcMain): void {
    // Register native API IPC handlers
    // Example: file system operations, dialog boxes, etc.
  }

  onWindowCreated(window: BrowserWindow): void {
    console.log(`[${this.config.id}] Window created`);
  }
}
