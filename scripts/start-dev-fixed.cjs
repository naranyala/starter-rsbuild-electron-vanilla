import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import getPortModule from 'get-port';

// Handle both CommonJS and ES module formats for get-port
const getPort = typeof getPortModule === 'function' ? getPortModule : getPortModule.default;

/**
 * Starts the development server with rsbuild and electron
 */
async function startDevServer() {
  try {
    // Get a random available port
    const port = await getPort();
    console.log(`Using port: ${port}`);

    // Set the PORT environment variable for rsbuild
    process.env.PORT = port.toString();

    // Spawn rsbuild dev server with the random port
    const rsbuildProcess = spawn('./node_modules/.bin/rsbuild', ['dev', '--port', port], {
      stdio: 'inherit',
      env: { ...process.env },
    });

    // Wait for the Rsbuild server to be ready
    console.log('Rsbuild server starting...');

    setTimeout(async () => {
      try {
        // Try to start Electron with current setup
        const electronProcess = spawn('./node_modules/.bin/electron', ['--no-sandbox', 'dist/main/index.js'], {
          stdio: 'inherit',
          env: {
            ...process.env,
            ELECTRON_START_URL: `http://localhost:${port}`
          },
        });

        electronProcess.on('error', (error) => {
          console.error('Electron process error:', error);
        });

        electronProcess.on('close', (code) => {
          console.log(`Electron process exited with code ${code}`);
          rsbuildProcess.kill();
        });

        console.log('Electron started successfully');
      } catch (electronError) {
        console.error('Failed to start Electron:', electronError);
        console.log('Continuing without Electron - Rsbuild server still running...');
      }
    }, 2000); // Give Rsbuild time to start

    rsbuildProcess.on('close', (code) => {
      console.log(`Rsbuild process exited with code ${code}`);
    });

  } catch (error) {
    console.error('Failed to start development server:', error);
    process.exit(1);
  }
}

startDevServer();