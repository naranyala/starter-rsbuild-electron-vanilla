# Utility Libraries Usage Example

This file demonstrates how to use the reorganized utility libraries in both frontend and backend environments.

## Frontend Usage Example

```typescript
// Import frontend utilities
import { 
  delay, 
  debounce, 
  throttle,
  querySelector,
  addClass,
  removeClass,
  isLocalStorageAvailable,
  setLocalStorage,
  getLocalStorage
} from '../lib/frontend';

// Import shared utilities
import { 
  isValidEmail,
  toCamelCase,
  truncate,
  logger
} from '../lib/shared';

// Example usage in a React component
class ExampleComponent {
  private debouncedSearch: (query: string) => void;

  constructor() {
    // Initialize debounced function
    this.debouncedSearch = debounce((query: string) => {
      console.log('Searching for:', query);
      // Search logic here
    }, 300);

    // Set up localStorage if available
    if (isLocalStorageAvailable()) {
      const savedTheme = getLocalStorage('theme', 'light');
      logger.info('Loaded theme:', savedTheme);
    }
  }

  handleSearch = (event: Event) => {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.debouncedSearch(input.value);
    }
  };

  handleThemeToggle = () => {
    const currentTheme = getLocalStorage('theme', 'light');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    setLocalStorage('theme', newTheme);
    
    const root = querySelector('#app');
    if (root) {
      removeClass(root, currentTheme);
      addClass(root, newTheme);
    }
  };

  render() {
    return (
      <div>
        <input 
          type="text" 
          placeholder="Search..." 
          onChange={this.handleSearch}
        />
        <button onClick={this.handleThemeToggle}>
          Toggle Theme
        </button>
      </div>
    );
  }
}

// Validate user input
export const validateUser = (userData: { email: string; name: string }) => {
  const errors: string[] = [];
  
  if (!isValidEmail(userData.email)) {
    errors.push('Invalid email format');
  }
  
  if (!userData.name || userData.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};
```

## Backend Usage Example

```typescript
// Import backend utilities
import { 
  delay,
  retry,
  isDevelopment,
  getEnv,
  logger,
  readFile,
  writeFile,
  exists
} from '../lib/backend';

// Example usage in an Electron main process
class ExampleBackendService {
  private config: Record<string, string>;

  constructor() {
    this.loadConfig();
  }

  private async loadConfig() {
    try {
      if (await exists('config.json')) {
        const configData = await readFile('config.json');
        this.config = JSON.parse(configData);
        logger.info('Configuration loaded successfully');
      } else {
        // Create default config
        this.config = {
          apiEndpoint: getEnv('API_ENDPOINT', 'https://api.example.com'),
          port: parseInt(getEnv('PORT', '3000')),
          retries: 3,
        };
        
        await writeFile('config.json', JSON.stringify(this.config, null, 2));
        logger.info('Default configuration created');
      }
    } catch (error) {
      logger.error('Failed to load configuration:', error);
      this.config = {};
    }
  }

  async fetchWithRetry(url: string) {
    return retry(
      async () => {
        logger.info(`Fetching data from ${url}`);
        
        // Simulate API call with delay
        await delay(1000);
        
        if (Math.random() > 0.8) { // 80% success rate
          throw new Error('Simulated API error');
        }
        
        return { data: `Data from ${url}` };
      },
      3,
      1000
    );
  }

  async processRequest(requestData: any) {
    try {
      logger.info('Processing request:', requestData);
      
      // Simulate processing time
      await delay(500);
      
      const result = {
        success: true,
        processedAt: new Date().toISOString(),
        data: requestData,
      };
      
      logger.info('Request processed successfully');
      return result;
    } catch (error) {
      logger.error('Request processing failed:', error);
      return {
        success: false,
        error: error.message,
        processedAt: new Date().toISOString(),
      };
    }
  }
}
```

## Cross-Environment Compatibility

The utilities are designed to work in both environments:

- **Frontend utilities**: Browser-specific APIs (DOM, localStorage, etc.)
- **Backend utilities**: Node.js-specific APIs (fs, process, etc.)
- **Shared utilities**: Common functions that work in both environments

Each utility includes proper TypeScript typing and error handling for production use.