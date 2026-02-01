"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
const get_port_1 = __importDefault(require("get-port"));
const wait_on_1 = __importDefault(require("wait-on"));
const getPort = get_port_1.default;
async function startDevServer() {
    try {
        const port = await getPort();
        console.log(`Using port: ${port}`);
        process.env.PORT = port.toString();
        const rsbuildProcess = (0, node_child_process_1.spawn)('./node_modules/.bin/rsbuild', ['dev', '--port', port], {
            stdio: 'inherit',
            env: { ...process.env },
        });
        const resources = [`http://localhost:${port}`];
        setTimeout(async () => {
            try {
                await (0, wait_on_1.default)({ resources, timeout: 30000 });
                process.env.ELECTRON_START_URL = `http://localhost:${port}`;
                const electronProcess = (0, node_child_process_1.spawn)('./node_modules/.bin/electron', ['src/main/main.ts', '--start-dev'], {
                    stdio: 'inherit',
                    env: { ...process.env, ELECTRON_START_URL: `http://localhost:${port}` },
                });
                electronProcess.on('close', (code) => {
                    console.log(`Electron process exited with code ${code}`);
                    rsbuildProcess.kill();
                });
            }
            catch (waitError) {
                console.error('Timeout waiting for Rsbuild server to start:', waitError);
                rsbuildProcess.kill();
            }
        }, 2000);
        rsbuildProcess.on('close', (code) => {
            console.log(`Rsbuild process exited with code ${code}`);
        });
    }
    catch (error) {
        console.error('Error starting dev server:', error);
    }
}
startDevServer();
