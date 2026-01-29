// Main process utilities and configurations
// This main folder contains code for the Electron main process

/**
 * Application configuration
 */
export const appConfig = {
  appName: 'Electron React Rsbuild App',
  version: '1.0.0',
  mainWindow: {
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false, // Changed to false for security
      contextIsolation: true, // Changed to true for security
      webSecurity: true, // Changed to true for security
    },
  },
};

/**
 * Menu configuration for the main process
 */
export const mainMenuConfig = {
  fileMenu: {
    label: 'File',
    submenu: [
      { label: 'New Window', accelerator: 'CmdOrCtrl+N' },
      { label: 'Open...', accelerator: 'CmdOrCtrl+O' },
      { type: 'separator' },
      { label: 'Settings', accelerator: 'CmdOrCtrl+,' },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'CmdOrCtrl+Q' },
    ],
  },
  viewMenu: {
    label: 'View',
    submenu: [
      { label: 'Reload', accelerator: 'CmdOrCtrl+R' },
      { label: 'Toggle Developer Tools', accelerator: 'CmdOrCtrl+Shift+I' },
      { type: 'separator' },
      { label: 'Actual Size', accelerator: 'CmdOrCtrl+0' },
      { label: 'Zoom In', accelerator: 'CmdOrCtrl+=' },
      { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-' },
    ],
  },
};
