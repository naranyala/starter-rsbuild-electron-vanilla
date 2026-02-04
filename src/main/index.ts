import { join } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BrowserWindow, app, ipcMain } from 'electron';
import { mainUseCaseRegistry } from '../backend/use-cases/electron-info/index.js';
import { appConfig } from './config/app-config.js';
import { Logger } from './services/logger.js';
import { WindowManager } from './services/window-manager.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize logger
const logger = new Logger(
  (process.env.LOG_LEVEL as import('./services/logger.js').LogLevel) || 'info'
);

// Parse command line arguments
const args = process.argv.slice(1);
const serve = args.some((val) => val === '--start-dev');

// Initialize window manager
const windowManager = new WindowManager();

// Let electron reloads by itself when rsbuild watches changes in ./app/
// Temporarily disable electron-reload to troubleshoot
/*
if (serve) {
  require('electron-reload')(__dirname, {
    electron: `${__dirname}/node_modules/.bin/electron`,
    hardResetMethod: 'exit'
  })
}
*/

// To avoid being garbage collected
let mainWindowId: number | null = null;

app.on('ready', () => {
  logger.info('App is ready, creating window...');

  // Initialize use cases
  mainUseCaseRegistry.registerIPCHandlers(ipcMain);

  createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  logger.info('All windows closed');
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  logger.info('App is quitting, cleaning up...');
  mainUseCaseRegistry.cleanup();
});

app.on('activate', () => {
  logger.info('App activated');
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindowId === null) {
    createWindow();
  } else {
    windowManager.focusWindow(mainWindowId);
  }
});

/**
 * Creates the main browser window
 */
function createWindow() {
  logger.info('Creating main window...');

  // Create window with options from config (preload disabled for now)
  const { window, id } = windowManager.createWindow({
    ...appConfig.mainWindow,
    webPreferences: {
      ...appConfig.mainWindow.webPreferences,
    },
  });

  mainWindowId = id;

  // Load the appropriate URL based on environment
  const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:1234';
  const startUrl = serve ? devUrl : `file://${join(__dirname, '../..', 'index.html')}`;

  logger.info('Loading URL:', startUrl);
  window.loadURL(startUrl);

  // Log when the page finishes loading
  window.webContents.on('did-finish-load', () => {
    logger.info('Page loaded successfully');
  });

  // Log any errors during loading
  window.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    logger.error('Error loading page:', errorCode, errorDescription);
  });

  // DevTools will NOT open by default - user can open manually if needed
  // To open manually: View -> Toggle Developer Tools or Cmd/Ctrl+Shift+I

  window.on('closed', () => {
    logger.info('Window closed');
    mainWindowId = null;
  });
}

/**
 * Gets the preload script path based on environment
 * @returns Path to preload script
 */
function getPreloadPath(): string {
  // The preload script is now at the root of dist
  const preloadPath = join(__dirname, '../preload.js');
  logger.info('Preload path:', preloadPath);
  return preloadPath;
}
