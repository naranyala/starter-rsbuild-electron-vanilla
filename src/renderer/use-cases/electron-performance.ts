import { UseCase } from './types';

export class ElectronPerformanceUseCase extends UseCase {
  config = {
    id: 'electron-performance',
    title: 'Performance Optimization',
    category: 'performance',
    tags: ['performance', 'optimization', 'memory', 'startup-time'],
  };

  theme = {
    name: 'orange',
    bg: '#f97316',
    color: 'white',
  };

  generateContent(): string {
    return `
      <p><strong>About "${this.config.title}":</strong> Optimizing Electron apps involves reducing memory usage, improving startup time, and efficient resource management.</p>
      
      <p><strong>Memory Management:</strong> Avoid memory leaks by properly cleaning up event listeners, timers, and references when windows are closed. Monitor memory usage with Chrome DevTools.</p>
      
      <p><strong>Startup Performance:</strong> Improve startup time by optimizing the main process initialization and deferring non-critical operations until after the application has loaded.</p>
      
      <p><strong>Code Splitting:</strong> Use techniques like code splitting and lazy loading to reduce the initial bundle size and improve load times.</p>
      
      <h4>Optimization Techniques</h4>
      <ul>
        <li>Code splitting and lazy loading</li>
        <li>Efficient cleanup of resources</li>
        <li>Optimized asset loading</li>
        <li>Efficient IPC communication</li>
        <li>Native modules for CPU-intensive tasks</li>
        <li>Minimize main process blocking</li>
      </ul>
      
      <p>Monitor performance with Chrome DevTools to identify bottlenecks.</p>
    `;
  }
}
