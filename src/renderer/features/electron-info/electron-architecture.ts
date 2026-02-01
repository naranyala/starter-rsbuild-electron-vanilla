import { UseCase } from './types';

export class ElectronArchitectureUseCase extends UseCase {
  config = {
    id: 'electron-architecture',
    title: 'Electron Architecture',
    category: 'architecture',
    tags: ['main-process', 'renderer-process', 'ipc', 'architecture'],
  };

  theme = {
    name: 'purple',
    bg: '#a78bfa',
    color: 'white',
  };

  generateContent(): string {
    return `
      <p><strong>About "${this.config.title}":</strong> Electron applications follow a multi-process architecture that ensures security and performance while maintaining flexibility.</p>
      
      <p><strong>Main Process:</strong> Controls the application lifecycle, creates and manages browser windows, and handles system events. This is the entry point of your application.</p>
      
      <p><strong>Renderer Process:</strong> Each BrowserWindow runs in its own renderer process. This process renders the UI using Chromium and executes the frontend code.</p>
      
      <p><strong>IPC Communication:</strong> Communication between processes happens via Inter-Process Communication. Use ipcMain in the main process and ipcRenderer in the renderer process to exchange messages securely.</p>
      
      <h4>Architecture Patterns</h4>
      <ul>
        <li>Preload scripts for secure API exposure</li>
        <li>Context isolation for security</li>
        <li>Separate concerns between processes</li>
        <li>Event-driven communication model</li>
        <li>Modular code organization</li>
      </ul>
      
      <p>This architecture allows for secure separation of concerns while maintaining flexibility.</p>
    `;
  }
}
