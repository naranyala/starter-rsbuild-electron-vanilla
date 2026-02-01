// Main process application configuration
import type { BrowserWindowConstructorOptions } from 'electron';

export interface AppConfig {
  appName: string;
  version: string;
  mainWindow: BrowserWindowConstructorOptions;
}

export const appConfig: AppConfig = {
  appName: 'Electron Rsbuild Starter',
  version: '1.0.0',
  mainWindow: {
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      webSecurity: true,
      // preload disabled for now
    },
  },
};
