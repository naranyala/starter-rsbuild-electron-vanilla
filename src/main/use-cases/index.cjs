// Main process use-cases index
// Each use case can have backend logic and IPC handlers

const { MainUseCase } = require('./base.cjs');
const { ElectronIntroUseCase } = require('./electron-intro.cjs');
const { ElectronArchitectureUseCase } = require('./electron-architecture.cjs');
const { ElectronSecurityUseCase } = require('./electron-security.cjs');
const { ElectronPackagingUseCase } = require('./electron-packaging.cjs');
const { ElectronNativeApisUseCase } = require('./electron-native-apis.cjs');
const { ElectronPerformanceUseCase } = require('./electron-performance.cjs');
const { ElectronDevelopmentUseCase } = require('./electron-development.cjs');
const { ElectronVersionsUseCase } = require('./electron-versions.cjs');

// Registry to manage all main process use cases
class MainUseCaseRegistry {
  constructor() {
    this.useCases = new Map();
    this.registerAll();
  }

  register(useCase) {
    this.useCases.set(useCase.config.id, useCase);
  }

  get(id) {
    return this.useCases.get(id);
  }

  getAll() {
    return Array.from(this.useCases.values());
  }

  registerAll() {
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
  registerIPCHandlers(ipcMain) {
    this.useCases.forEach((useCase) => {
      useCase.registerIPCHandlers(ipcMain);
    });
  }

  // Notify use cases when a window is created
  onWindowCreated(useCaseId, window) {
    const useCase = this.get(useCaseId);
    if (useCase) {
      useCase.onWindowCreated(window);
    }
  }

  // Cleanup all use cases
  cleanup() {
    this.useCases.forEach((useCase) => {
      useCase.cleanup();
    });
  }
}

// Export singleton instance
const mainUseCaseRegistry = new MainUseCaseRegistry();

module.exports = {
  MainUseCase,
  MainUseCaseRegistry,
  mainUseCaseRegistry,
  // Individual use cases
  ElectronIntroUseCase,
  ElectronArchitectureUseCase,
  ElectronSecurityUseCase,
  ElectronPackagingUseCase,
  ElectronNativeApisUseCase,
  ElectronPerformanceUseCase,
  ElectronDevelopmentUseCase,
  ElectronVersionsUseCase,
};
