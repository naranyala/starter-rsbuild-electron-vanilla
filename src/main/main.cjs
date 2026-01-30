// Basic init
const electron = require('electron');
const { app } = electron;
const path = require('node:path');
const url = require('node:url');
const Logger = require('./lib/logger.cjs');
const WindowManager = require('./lib/window-manager.cjs');

// Initialize logger
const logger = new Logger(process.env.LOG_LEVEL || 'info');

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
let mainWindowId = null;

app.on('ready', () => {
  logger.info('App is ready, creating window...');
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

  // Create window with options
  const { window, id } = windowManager.createWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false, // Disable nodeIntegration for security
      contextIsolation: true, // Enable context isolation for security
      webSecurity: true, // Enable web security
      preload: getPreloadPath(), // Preload script for secure API exposure
    },
  });

  mainWindowId = id;

  // Load the appropriate URL based on environment
  const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:1234';
  const startUrl = serve
    ? devUrl
    : url.format({
        pathname: path.join(__dirname, '../../dist/index.html'),
        protocol: 'file:',
        slashes: true,
      });

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
 * @returns {string} - Path to preload script
 */
function getPreloadPath() {
  if (serve) {
    // In development, the preload script is in the dist directory after build
    return path.join(__dirname, '../dist', 'preload.js');
  } else {
    // In production, the preload script should be in the resources directory
    return path.join(__dirname, '../dist', 'preload.js');
  }
}
