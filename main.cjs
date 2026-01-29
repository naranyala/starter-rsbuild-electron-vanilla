// Basic init
const electron = require('electron')
const {app, BrowserWindow} = electron
const path = require('path');
const url = require('url');
const args = process.argv.slice(1)
const serve = args.some(val => val === '--start-dev')

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
let mainWindow

app.on('ready', () => {
    createWindow()
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});

/**
 * Creates the main browser window
 */
function createWindow() {
    console.log('Creating window...');

    // Determine the correct path for the preload script based on environment
    let preloadPath;
    if (serve) {
        // In development, the preload script is in the dist directory after build
        preloadPath = path.join(__dirname, 'dist', 'preload.js');
    } else {
        // In production, the preload script should be in the resources directory
        preloadPath = path.join(__dirname, 'preload.js');
    }

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,        // Disable nodeIntegration for security
            contextIsolation: true,        // Enable context isolation for security
            webSecurity: true,             // Enable web security
            preload: preloadPath           // Preload script for secure API exposure
        }
    })

    // Use dynamic port from environment variable if available, otherwise default
    const devUrl = process.env.ELECTRON_START_URL || "http://localhost:1234";
    console.log('Loading URL:', devUrl);
    const startUrl = serve ? devUrl : url.format({
          pathname: path.join(__dirname, 'dist/index.html'),
          protocol: 'file:',
          slashes: true
        });

    mainWindow.loadURL(startUrl);

    // Log when the page finishes loading
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Page loaded successfully');
    });

    // Log any errors during loading
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Error loading page:', errorCode, errorDescription);
    });

    // DevTools will NOT open by default - user can open manually if needed
    // To open manually: View -> Toggle Developer Tools or Cmd/Ctrl+Shift+I

    mainWindow.on('closed', function () {
        console.log('Window closed');
        mainWindow = null
    })
}
