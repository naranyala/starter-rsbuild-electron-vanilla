import { UseCase } from './types';

export class ElectronIntroUseCase extends UseCase {
  config = {
    id: 'electron-intro',
    title: 'What is Electron?',
    category: 'framework',
    tags: ['electron', 'desktop', 'chromium', 'nodejs', 'cross-platform'],
  };

  theme = {
    name: 'blue',
    bg: '#4a6cf7',
    color: 'white',
  };

  generateContent(): string {
    return `
      <p><strong>About "${this.config.title}":</strong> Electron is a framework for building cross-platform desktop applications using web technologies like HTML, CSS, and JavaScript. It combines the Chromium rendering engine and the Node.js runtime.</p>
      
      <p>With Electron, you can develop desktop applications that run on Windows, macOS, and Linux using familiar web technologies. Popular applications like Visual Studio Code, Slack, Discord, and WhatsApp Desktop are built with Electron.</p>
      
      <p>Electron applications have two main processes: the Main Process and the Renderer Process. The Main Process controls the life cycle of the app and creates browser windows. The Renderer Process renders the UI and runs in the browser window.</p>
      
      <h4>Key Features</h4>
      <ul>
        <li>Cross-platform compatibility</li>
        <li>Native desktop features</li>
        <li>Web technology stack</li>
        <li>Large community and ecosystem</li>
        <li>Automatic updates support</li>
      </ul>
      
      <p>For more information, consult the official Electron documentation at electronjs.org</p>
    `;
  }
}
