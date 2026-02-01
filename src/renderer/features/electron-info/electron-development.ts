import { UseCase } from './types';

export class ElectronDevelopmentUseCase extends UseCase {
  config = {
    id: 'electron-development',
    title: 'Development Workflow',
    category: 'development',
    tags: ['development', 'workflow', 'debugging', 'hmr'],
  };

  theme = {
    name: 'teal',
    bg: '#14b8a6',
    color: 'white',
  };

  generateContent(): string {
    return `
      <p><strong>About "${this.config.title}":</strong> Effective Electron development involves using the right tools and workflows for productivity and code quality.</p>
      
      <p><strong>Hot Module Replacement:</strong> Use HMR with tools like Rsbuild or Webpack for instant updates during development without restarting the application.</p>
      
      <p><strong>Debugging:</strong> Debug Electron applications using Chrome DevTools for the renderer process and standard Node.js debugging tools for the main process. Use VS Code debugger for integrated debugging.</p>
      
      <p><strong>Development vs Production:</strong> Separate development and production configurations, implement proper error handling, and use build tools to automate repetitive tasks.</p>
      
      <h4>Development Best Practices</h4>
      <ul>
        <li>Use electron-reload for auto-restarts</li>
        <li>Source maps for debugging</li>
        <li>Separate dev/prod configs</li>
        <li>Linting and formatting (Biome, ESLint)</li>
        <li>Automated testing setup</li>
        <li>Version control with Git</li>
      </ul>
      
      <p>Common development patterns include using preload scripts and implementing proper error boundaries.</p>
    `;
  }
}
