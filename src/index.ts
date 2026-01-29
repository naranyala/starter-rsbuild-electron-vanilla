import './reset.css';
import './index.css';
import App from './App';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  if (appContainer) {
    // Create the main application structure
    appContainer.innerHTML = '<div id="root"></div>';
    const rootElement = document.getElementById('root');

    if (rootElement) {
      // Initialize the App
      const app = new App(rootElement);
      app.init();
    }
  }

  // Ensure the app container has proper initial styling
  const appDiv = document.getElementById('app');
  if (appDiv) {
    appDiv.style.display = 'flex';
    appDiv.style.flexDirection = 'column';
    appDiv.style.minHeight = '100vh';
  }
});