// Base UseCase handler for main process
// Each use case can have backend logic and IPC handlers

class MainUseCase {
  constructor(config) {
    this.config = config;
  }

  // Override this method to register IPC handlers
  registerIPCHandlers(ipcMain) {
    // Default: no handlers
  }

  // Override this method to handle window creation events
  onWindowCreated(window) {
    // Default: no action
  }

  // Override this method to cleanup when use case is destroyed
  cleanup() {
    // Default: no cleanup
  }
}

module.exports = { MainUseCase };
