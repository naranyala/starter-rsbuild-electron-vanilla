import './styles/reset.css';
import './styles/index.css';
import './styles/app.css';
import App from './App';
import DomUtils from './lib/dom-utils';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Use DOM utilities to get the app container
  const appContainer = DomUtils.querySelector('#app');
  if (appContainer) {
    // Create the main application structure
    appContainer.innerHTML = '<div id="root"></div>';
    const rootElement = DomUtils.querySelector('#root');

    if (rootElement) {
      // Initialize the App
      const app = new App(rootElement);
      app.init();
    }
  }

  // Ensure the app container has proper initial styling
  const appDiv = DomUtils.querySelector('#app');
  if (appDiv) {
    DomUtils.setStyles(appDiv, {
      height: '100vh',
      overflow: 'auto',
    });
  }
});
