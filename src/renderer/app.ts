// Main application controller for renderer process
import HomePage from './pages/home-page';
import { DomUtils } from './utils/dom-utils';

export class App {
  private rootElement: HTMLElement | null = null;

  constructor() {
    console.log('App constructor called');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupApp());
    } else {
      await this.setupApp();
    }
  }

  private async setupApp(): Promise<void> {
    console.log('setupApp called');
    // Use DOM utilities to get the app container
    const appContainer = DomUtils.querySelector('#app');
    console.log('appContainer:', appContainer);
    if (appContainer) {
      // Create the main application structure
      appContainer.innerHTML = '<div id="root"></div>';
      this.rootElement = DomUtils.querySelector('#root') as HTMLElement;
      console.log('rootElement:', this.rootElement);

      if (this.rootElement) {
        // Initialize the HomePage
        console.log('Initializing HomePage...');
        const homePage = new HomePage(this.rootElement);
        homePage.init();
        console.log('HomePage initialized');

        // Ensure the app container has proper initial styling
        const appDiv = DomUtils.querySelector('#app') as HTMLElement;
        if (appDiv) {
          DomUtils.setStyles(appDiv, {
            height: '100vh',
            overflow: 'auto',
          });
        }
      }
    }
  }
}

// Initialize the app when module is loaded
if (typeof window !== 'undefined') {
  new App();
}
