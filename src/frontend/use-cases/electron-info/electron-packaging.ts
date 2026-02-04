import { UseCase } from './types';

export class ElectronPackagingUseCase extends UseCase {
  config = {
    id: 'electron-packaging',
    title: 'Packaging and Distribution',
    category: 'packaging',
    tags: ['packaging', 'distribution', 'electron-builder', 'installer'],
  };

  theme = {
    name: 'green',
    bg: '#4ade80',
    color: 'black',
  };

  generateContent(): string {
    return `
      <p><strong>About "${this.config.title}":</strong> Electron applications can be packaged for distribution using tools like electron-builder, electron-forge, or electron-packager.</p>
      
      <p><strong>electron-builder:</strong> A complete solution for packaging and building ready-for-distribution Electron apps. Supports multiple formats for each platform including MSI, DMG, AppImage, and DEB packages.</p>
      
      <p><strong>Configuration:</strong> Packaging configuration includes app metadata, icons, installer options, and platform-specific settings. Proper packaging ensures a professional user experience across all platforms.</p>
      
      <p><strong>Code Signing:</strong> Important for distributing Electron applications, especially on macOS and Windows. Code signing verifies the authenticity of the application and prevents tampering.</p>
      
      <h4>Distribution Targets</h4>
      <ul>
        <li>Windows: MSI, NSIS, portable</li>
        <li>macOS: DMG, PKG, ZIP</li>
        <li>Linux: AppImage, DEB, RPM, Snap</li>
        <li>Auto-updater integration</li>
      </ul>
      
      <p>These tools create installable executables for Windows, macOS, and Linux.</p>
    `;
  }
}
