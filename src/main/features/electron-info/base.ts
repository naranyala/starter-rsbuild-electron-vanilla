// Base UseCase handler for main process
// Each use case can have backend logic and IPC handlers

import type { BrowserWindow, ipcMain as IpcMainType } from 'electron';

export interface UseCaseConfig {
  id: string;
  title: string;
  category: string;
  tags: string[];
}

export abstract class MainUseCase {
  protected readonly config: UseCaseConfig;

  constructor(config: UseCaseConfig) {
    this.config = config;
  }

  // Public getter for config
  getConfig(): UseCaseConfig {
    return this.config;
  }

  // Override this method to register IPC handlers
  registerIPCHandlers(ipcMain: typeof IpcMainType): void {
    // Default: no handlers
  }

  // Override this method to handle window creation events
  onWindowCreated(window: BrowserWindow): void {
    // Default: no action
  }

  // Override this method to cleanup when use case is destroyed
  cleanup(): void {
    // Default: no cleanup
  }
}
