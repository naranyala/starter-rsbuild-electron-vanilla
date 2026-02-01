import './styles/reset.css';
import './styles/index.css';
import './styles/app.css';

// Simple test to see if imports work
console.log('Testing imports...');
try {
  // Try importing just a class from app.ts
  import('./app')
    .then((module) => {
      console.log('App module loaded:', module);
      const App = module.App;
      if (typeof window !== 'undefined') {
        new App();
      }
    })
    .catch((err) => {
      console.error('Failed to load app module:', err);
    });
} catch (err) {
  console.error('Import error:', err);
}

// The App class handles initialization automatically
