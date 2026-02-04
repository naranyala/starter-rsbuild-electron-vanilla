# Enhanced Development Utilities

This project includes a comprehensive set of enhanced utilities designed to accelerate development and improve code quality across both frontend and backend environments.

## 1. Enhanced Reactivity System

The reactivity system has been significantly enhanced with advanced features:

### Features
- **Enhanced Signal Tracking**: Improved dependency tracking with proper cleanup
- **Batch Updates**: Efficient batch processing of multiple updates
- **Derived Signals**: Create computed signals from existing signals
- **History Signals**: Built-in undo/redo functionality
- **Debounced/Throttled Signals**: Control update frequency
- **Disposal Methods**: Proper cleanup with dispose methods

### Usage
```typescript
import { signal, computed, effect } from '@/frontend/lib';

// Create a signal with options
const count = signal(0, { equals: (prev, next) => prev === next });

// Create a computed signal
const doubled = computed(() => count() * 2);

// Create a signal with history (for undo/redo)
const historySignal = createHistorySignal('initial value');

// Debounced signal
const debouncedInput = debounceSignal(inputSignal, 300);

// Throttled signal
const throttledScroll = throttleSignal(scrollSignal, 100);
```

## 2. Enhanced Template System

The template system now includes performance optimizations and advanced features:

### Features
- **Keyed Reconciliation**: Efficient list updates with keyed reconciliation
- **Element Caching**: Reuse DOM elements for better performance
- **Text Caching**: Cache text nodes for repeated use
- **Reactive Bindings**: Direct integration with signals
- **Conditional Rendering**: `show()` utility for conditional rendering
- **List Rendering**: `each()` utility for efficient list rendering
- **Fragment Support**: Better fragment handling

### Usage
```typescript
import { h, render, signal } from '@/frontend/lib';

const count = signal(0);

const Counter = () => h('div', {},
  h('h1', {}, `Count: ${count()}`),
  h('button', {
    onClick: () => count.update(n => n + 1)
  }, 'Increment')
);

render(Counter(), document.getElementById('app'));
```

## 3. Comprehensive Validation Utilities

Advanced validation utilities for both frontend and backend:

### Features
- **Schema Validation**: Define schemas for complex validation
- **Type-Specific Validators**: String, number, array, object, date validators
- **Pattern Validation**: Built-in patterns for emails, URLs, UUIDs, etc.
- **Sanitization Functions**: Clean and sanitize input data
- **Conditional Validation**: Validate based on conditions
- **Custom Validation Chains**: Chain multiple validations

### Usage
```typescript
import { validateString, validateNumber, validateSchema } from '@/shared/utils';

// String validation
const result = validateString(email)
  .required()
  .email()
  .validate();

// Schema validation
const userSchema = {
  name: { validate: validateString, optional: false },
  age: { validate: (v) => validateNumber(v).min(0).max(120).validate(), optional: false },
  email: { validate: (v) => validateString(v).email().validate(), optional: true }
};

const validationResult = validateSchema(userData, userSchema);
```

## 4. Enhanced DOM Manipulation Utilities

Comprehensive DOM manipulation utilities with reactive bindings:

### Features
- **Query Selectors**: Enhanced query functions
- **Element Creation**: Easy element creation with attributes
- **Class Manipulation**: Add, remove, toggle classes
- **Style Manipulation**: Set/get styles and CSS properties
- **Event Handling**: Delegated event handling
- **Animations**: Built-in animation utilities
- **Reactive Bindings**: Bind DOM elements to signals
- **Visibility Control**: Show/hide elements with transitions

### Usage
```typescript
import { DOM, bind } from '@/frontend/lib';

// Query elements
const button = DOM.query('#my-button');

// Manipulate elements
DOM.addClass(button, 'active');
DOM.setStyle(button, 'color', 'red');

// Bind to signals
bind(inputElement, 'value', mySignal);

// Animate elements
DOM.fadeIn(element);
DOM.slideDown(element);
```

## 5. Advanced Async Utilities

Comprehensive async utilities for both frontend and backend:

### Features
- **Retry Mechanisms**: Exponential backoff retries
- **Timeout Wrappers**: Add timeouts to promises
- **Debounce/Throttle**: Control async function execution
- **Rate Limiting**: Limit concurrent executions
- **Concurrent Execution**: Execute multiple promises with limits
- **Cancellable Promises**: Cancel ongoing promises
- **Async Memoization**: Cache async results with TTL
- **Semaphores/Mutexes**: Control access to resources

### Usage
```typescript
import { retry, withTimeout, concurrent, AsyncMemoizer } from '@/shared/lib';

// Retry with exponential backoff
const result = await retry(asyncOperation, {
  retries: 3,
  delay: 1000,
  backoff: 'exponential'
});

// Execute concurrently with limits
const results = await concurrent([
  () => fetch('/api/data1'),
  () => fetch('/api/data2'),
  () => fetch('/api/data3')
], { concurrency: 2 });

// Memoize async operations
const memoizer = new AsyncMemoizer(5 * 60 * 1000); // 5 minutes TTL
const userData = await memoizer.get(userId, () => fetchUser(userId));
```

## 6. Enhanced Storage Utilities

Secure storage utilities with encryption capabilities:

### Features
- **Encrypted Storage**: Client-side encryption for sensitive data
- **Multiple Storage Types**: localStorage, sessionStorage, memory, IndexedDB
- **TTL Support**: Automatic expiration of stored items
- **Reactive Bindings**: Signals backed by storage
- **Cookie Utilities**: Enhanced cookie management
- **IndexedDB Utilities**: Simplified IndexedDB operations

### Usage
```typescript
import { SecureLocalStorage, ReactiveStorage } from '@/shared/lib';

// Secure storage
const secureStorage = new SecureLocalStorage({
  encrypt: true,
  encryptionKey: 'my-secret-key',
  ttl: 24 * 60 * 60 * 1000 // 24 hours
});

secureStorage.setItem('sensitive-data', { secret: 'value' });

// Reactive storage
const reactiveStorage = new ReactiveStorage('localStorage');
const userSignal = reactiveStorage.createSignal('user', { name: 'Guest' });
```

## 7. Advanced Networking Utilities

Comprehensive networking utilities with caching and retry mechanisms:

### Features
- **HTTP Client**: Advanced HTTP client with caching and retries
- **REST Client**: Resource-based API client
- **GraphQL Client**: GraphQL query/mutation client
- **WebSocket Client**: Auto-reconnecting WebSocket client
- **Network Status**: Monitor network connectivity
- **Request Interceptors**: Modify requests/responses
- **Caching Mechanisms**: Intelligent caching with TTL

### Usage
```typescript
import { HttpClient, RestApiClient, WebSocketClient } from '@/shared/lib';

// HTTP client with caching
const client = new HttpClient({
  timeout: 10000,
  retries: 3,
  cacheTTL: 5 * 60 * 1000 // 5 minutes
});

const response = await client.get('/api/users');

// REST client
const api = new RestApiClient('/api');
const users = await api.getAll('users');

// WebSocket client
const ws = new WebSocketClient('ws://localhost:8080');
ws.connect();
ws.onMessage(data => console.log(data));
```

## 8. Enhanced Logging and Monitoring

Comprehensive logging and monitoring utilities:

### Features
- **Multiple Log Levels**: Trace, debug, info, warn, error, fatal
- **Multiple Transports**: Console, file, network logging
- **Performance Monitoring**: Measure execution times
- **Error Tracking**: Automatic error tracking and reporting
- **Metrics Collection**: Counters, timers, gauges
- **Health Checks**: Application health monitoring
- **Contextual Logging**: Add context to log entries

### Usage
```typescript
import { Logger, PerformanceMonitor, AppMonitor } from '@/shared/lib';

// Logger with multiple transports
const logger = new Logger({
  level: 'debug',
  enableConsole: true,
  enableNetwork: true
});

logger.info('Application started', { userId: '123' });

// Performance monitoring
const perf = new PerformanceMonitor();
const result = await perf.measure('expensive-operation', () => {
  // Expensive operation
  return result;
});

// Application monitor
const monitor = new AppMonitor();
monitor.start();
const health = monitor.getHealthStatus();
```

## 9. Comprehensive Error Handling

Advanced error handling utilities:

### Features
- **Custom Error Types**: Specific error classes for different scenarios
- **Error Context**: Rich error context with metadata
- **Error Handlers**: Multiple error handling strategies
- **Circuit Breaker**: Prevent cascading failures
- **Error Recovery**: Retry, fallback, and timeout strategies
- **Global Error Handling**: Catch unhandled errors
- **Error Boundaries**: Component-level error boundaries

### Usage
```typescript
import { 
  ValidationError, 
  ErrorHandlerRegistry, 
  CircuitBreaker, 
  ErrorRecovery 
} from '@/shared/lib';

// Custom errors
throw new ValidationError('Invalid input', { field: 'email' });

// Error handler registry
const registry = new ErrorHandlerRegistry();
registry.addHandler(new ConsoleErrorHandler());
registry.handleError(myError);

// Circuit breaker
const circuitBreaker = new CircuitBreaker({ failureThreshold: 3 });
const result = await circuitBreaker.execute(asyncOperation);

// Error recovery
const result = await ErrorRecovery.retry(asyncOperation, {
  maxRetries: 3,
  baseDelay: 1000
});
```

## 10. Integration Examples

### Combining Multiple Utilities
```typescript
import { 
  signal, 
  effect, 
  HttpClient, 
  SecureLocalStorage, 
  Logger 
} from '@/frontend/lib';

// Create reactive state
const user = signal(null);
const isLoading = signal(false);

// HTTP client with caching
const client = new HttpClient({ cacheTTL: 5 * 60 * 1000 });
const storage = new SecureLocalStorage({ encrypt: true });
const logger = new Logger({ level: 'info' });

// Load user data
const loadUser = async () => {
  isLoading.set(true);
  try {
    const userData = await client.get('/api/user');
    user.set(userData);
    storage.setItem('user', userData);
    logger.info('User loaded successfully');
  } catch (error) {
    logger.error('Failed to load user', { error: error.message });
  } finally {
    isLoading.set(false);
  }
};

// React to user changes
effect(() => {
  if (user()) {
    console.log('User updated:', user());
  }
});
```

These enhanced utilities provide a solid foundation for 10x development velocity by offering robust, well-tested, and feature-rich abstractions for common development tasks.