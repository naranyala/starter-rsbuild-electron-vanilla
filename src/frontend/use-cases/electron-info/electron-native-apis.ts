import { UseCase } from './types';

export class ElectronNativeApisUseCase extends UseCase {
  config = {
    id: 'electron-native-apis',
    title: 'Native Operating System APIs',
    category: 'api',
    tags: ['native-api', 'file-system', 'notifications', 'dialogs'],
  };

  theme = {
    name: 'indigo',
    bg: '#6366f1',
    color: 'white',
  };

  generateContent(): string {
    return `
      <p><strong>About "${this.config.title}":</strong> Electron provides access to native OS features through its APIs, bridging the gap between web technologies and desktop functionality.</p>
      
      <p><strong>File System Operations:</strong> Full access to the Node.js fs module allows reading, writing, and managing files and directories on the user's system.</p>
      
      <p><strong>Native Dialogs:</strong> Show native system dialogs for opening files, saving files, and displaying message boxes with the dialog module.</p>
      
      <p><strong>System Notifications:</strong> Display native desktop notifications using the Notification API to alert users of important events.</p>
      
      <h4>Common Native Integrations</h4>
      <ul>
        <li>File dialogs (open, save)</li>
        <li>System notifications</li>
        <li>Context menus</li>
        <li>Tray icons and menus</li>
        <li>Clipboard operations</li>
        <li>Shell operations</li>
      </ul>
      
      <p>Powerful APIs like app, BrowserWindow, Menu, Tray, and nativeImage provide access to operating system-level functionality.</p>
    `;
  }
}
