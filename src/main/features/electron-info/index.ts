// Main process use-cases index
// Each use case can have backend logic and IPC handlers

import { type BrowserWindow, ipcMain } from 'electron';
import type { MainUseCase } from './base.js';
import { ElectronArchitectureUseCase } from './electron-architecture.js';
import { ElectronDevelopmentUseCase } from './electron-development.js';
import { ElectronIntroUseCase } from './electron-intro.js';
import { ElectronNativeApisUseCase } from './electron-native-apis.js';
import { ElectronPackagingUseCase } from './electron-packaging.js';
import { ElectronPerformanceUseCase } from './electron-performance.js';
import { ElectronSecurityUseCase } from './electron-security.js';
import { ElectronVersionsUseCase } from './electron-versions.js';

// Registry to manage all main process use cases
export class MainUseCaseRegistry {
  private useCases: Map<string, MainUseCase>;

  constructor() {
    this.useCases = new Map();
    this.registerAll();
  }

  register(useCase: MainUseCase): void {
    this.useCases.set(useCase.getConfig().id, useCase);
  }

  get(id: string): MainUseCase | undefined {
    return this.useCases.get(id);
  }

  getAll(): MainUseCase[] {
    return Array.from(this.useCases.values());
  }

  private registerAll(): void {
    this.register(new ElectronIntroUseCase());
    this.register(new ElectronArchitectureUseCase());
    this.register(new ElectronSecurityUseCase());
    this.register(new ElectronPackagingUseCase());
    this.register(new ElectronNativeApisUseCase());
    this.register(new ElectronPerformanceUseCase());
    this.register(new ElectronDevelopmentUseCase());
    this.register(new ElectronVersionsUseCase());
  }

  // Register IPC handlers for all use cases
  registerIPCHandlers(ipcMainInstance: import('electron').IpcMain): void {
    this.useCases.forEach((useCase) => {
      useCase.registerIPCHandlers(ipcMainInstance);
    });
  }

  // Notify use cases when a window is created
  onWindowCreated(useCaseId: string, window: BrowserWindow): void {
    const useCase = this.get(useCaseId);
    if (useCase) {
      useCase.onWindowCreated(window);
    }
  }

  // Cleanup all use cases
  cleanup(): void {
    this.useCases.forEach((useCase) => {
      useCase.cleanup();
    });
  }
}

// Export singleton instance
export const mainUseCaseRegistry = new MainUseCaseRegistry();

// Individual use cases
export {
  ElectronIntroUseCase,
  ElectronArchitectureUseCase,
  ElectronSecurityUseCase,
  ElectronPackagingUseCase,
  ElectronNativeApisUseCase,
  ElectronPerformanceUseCase,
  ElectronDevelopmentUseCase,
  ElectronVersionsUseCase,
};
