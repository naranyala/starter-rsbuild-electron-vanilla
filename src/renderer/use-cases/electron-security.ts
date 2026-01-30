import { UseCase } from './types';

export class ElectronSecurityUseCase extends UseCase {
  config = {
    id: 'electron-security',
    title: 'Electron Security Best Practices',
    category: 'security',
    tags: ['security', 'context-isolation', 'csp', 'best-practices'],
  };

  theme = {
    name: 'red',
    bg: '#f87171',
    color: 'white',
  };

  generateContent(): string {
    return `
      <p><strong>About "${this.config.title}":</strong> Security is crucial in Electron applications. Following best practices protects your users and ensures application integrity.</p>
      
      <p><strong>Context Isolation:</strong> Enable context isolation to ensure that preload scripts and Electron's internal logic run in a separate context from the website loaded in a WebContents. This prevents malicious scripts from accessing Electron internals.</p>
      
      <p><strong>Content Security Policy (CSP):</strong> Implement CSP to prevent cross-site scripting (XSS) attacks by restricting which resources can be loaded by the page. Define strict policies for scripts, styles, and external resources.</p>
      
      <p><strong>Node.js Integration:</strong> Disable nodeIntegration in renderer processes unless absolutely necessary. When needed, expose only the required APIs through preload scripts using contextBridge.</p>
      
      <h4>Security Checklist</h4>
      <ul>
        <li>Enable context isolation</li>
        <li>Disable nodeIntegration in renderer</li>
        <li>Implement Content Security Policy</li>
        <li>Validate all user input</li>
        <li>Sanitize user-provided content</li>
        <li>Keep dependencies updated</li>
        <li>Run in secure context</li>
      </ul>
      
      <p>Always follow the principle of least privilege for all operations.</p>
    `;
  }
}
