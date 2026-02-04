import { UseCase } from './types';

export class ElectronVersionsUseCase extends UseCase {
  config = {
    id: 'electron-versions',
    title: 'Version Management',
    category: 'maintenance',
    tags: ['version', 'updates', 'compatibility', 'maintenance'],
  };

  theme = {
    name: 'yellow',
    bg: '#fbbf24',
    color: 'black',
  };

  generateContent(): string {
    return `
      <p><strong>About "${this.config.title}":</strong> Managing Electron versions is important for stability, security, and access to new features.</p>
      
      <p><strong>Regular Updates:</strong> Regularly update to newer versions to get security patches and performance improvements. Electron releases follow Chromium and Node.js versions.</p>
      
      <p><strong>Compatibility:</strong> Consider the compatibility of Node.js and Chromium versions in each Electron release. Test your application thoroughly after version upgrades.</p>
      
      <p><strong>Dependency Management:</strong> Keep all dependencies updated using npm audit or similar tools to identify vulnerable packages.</p>
      
      <h4>Version Management Best Practices</h4>
      <ul>
        <li>Regular security updates</li>
        <li>Test before upgrading production</li>
        <li>Maintain consistent versions across team</li>
        <li>Use lock files (package-lock.json)</li>
        <li>Document version requirements</li>
        <li>Monitor Electron release notes</li>
      </ul>
      
      <p>Maintain a consistent version across your team to avoid compatibility issues.</p>
    `;
  }
}
