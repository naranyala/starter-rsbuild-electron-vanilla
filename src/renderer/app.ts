// Main application controller for renderer process
import HomePage from './pages/home-page';
import { initHomePage } from './pages/home-page';
import { DomUtils } from './utils/dom-utils';

export class App {
  private rootElement: HTMLElement | null = null;

  constructor() {
    console.log('App constructor called');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupApp());
    } else {
      await this.setupApp();
    }
  }

  private async setupApp(): Promise<void> {
    console.log('setupApp called');
    const appContainer = DomUtils.querySelector('#app');
    console.log('appContainer:', appContainer);

    if (appContainer) {
      appContainer.innerHTML = '<div id="root"></div>';
      this.rootElement = DomUtils.querySelector('#root') as HTMLElement;
      console.log('rootElement:', this.rootElement);

      if (this.rootElement) {
        console.log('Initializing HomePage...');
        initHomePage(this.rootElement);
        console.log('HomePage initialized');

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

if (typeof window !== 'undefined') {
  new App();
}
