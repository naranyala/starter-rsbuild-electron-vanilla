# Goober + Clsx Styling Guide

Modern CSS-in-JS styling for Electron apps using **goober** (1KB) and **clsx** for class management.

## The Stack

- **Goober** - 1KB CSS-in-JS library with autoprefixer
- **Clsx** - 0.2KB utility for conditional class names
- **CSS Variables** - For dynamic theming (set in JS, used in goober)

## Installation

```bash
bun install
```

Dependencies already in `package.json`:
- `goober`
- `goober/prefixer`
- `clsx`

## Quick Start

### 1. Setup

```typescript
// In your app entry file (index.ts)
import { initGoober } from './lib/styling';

// Initialize goober with autoprefixer
initGoober();
```

### 2. Basic Usage

```typescript
import { css } from 'goober';
import { cx } from './lib/class-utils';
import { signal } from './lib/reactivity';

// Create signals
const isActive = signal(false);

// Create styles with goober
const buttonStyles = css`
  padding: 12px 24px;
  background: var(--accent, #4a6cf7);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--accent-hover, #3d5ce0);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--accent, #4a6cf7), 
                0 0 0 4px rgba(74, 108, 247, 0.3);
  }
`;

// Conditional classes with cx
const getButtonClass = () => cx(
  buttonStyles,
  {
    [css`
      background: var(--success, #27c93f);
      &:hover { background: var(--success-hover, #1fa832); }
    `]: isActive(),
  }
);

// Use in component
const button = document.createElement('button');
button.className = getButtonClass();
```

## Reactivity + Goober Integration

### Pattern 1: Reactive Styles with Signals

```typescript
import { signal, computed } from './lib/reactivity';
import { css } from 'goober';
import { cx, createRxClass } from './lib/class-utils';

// State
const theme = signal<'dark' | 'light'>('dark');
const sidebarOpen = signal(true);

// Create reactive CSS class
const sidebarClass = createRxClass(
  (values) => `
    width: ${values.isOpen ? '240px' : '60px'};
    background: ${values.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
    color: ${values.theme === 'dark' ? '#ffffff' : '#1a1a1a'};
    transition: width 0.3s ease;
    height: 100vh;
    display: flex;
    flex-direction: column;
  `,
  { isOpen: sidebarOpen, theme }
);

// Use in component - automatically updates!
const sidebar = document.createElement('aside');
sidebar.className = sidebarClass();
// When sidebarOpen or theme changes, class automatically updates
```

### Pattern 2: Conditional Styles with cx

```typescript
import { cx } from './lib/class-utils';
import { css } from 'goober';
import { signal } from './lib/reactivity';

const size = signal<'sm' | 'md' | 'lg'>('md');
const isDisabled = signal(false);
const isLoading = signal(false);

const getButtonClass = () => cx(
  // Base styles
  css`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    outline: none;
  `,
  
  // Size variants
  {
    [css`padding: 8px 12px; font-size: 0.8em;`]: size() === 'sm',
    [css`padding: 12px 20px; font-size: 0.9em;`]: size() === 'md',
    [css`padding: 16px 28px; font-size: 1em;`]: size() === 'lg',
  },
  
  // State styles
  {
    [css`
      background: var(--accent, #4a6cf7);
      color: white;
      border: none;
      &:hover:not(:disabled) { 
        background: var(--accent-hover, #3d5ce0); 
      }
    `]: !isDisabled() && !isLoading(),
    
    [css`
      opacity: 0.5;
      cursor: not-allowed;
    `]: isDisabled() || isLoading(),
  }
);
```

### Pattern 3: Template System Integration

```typescript
import { h, render } from './lib/template';
import { css } from 'goober';
import { cx } from './lib/class-utils';
import { signal } from './lib/reactivity';

const count = signal(0);
const isEven = computed(() => count() % 2 === 0);

// Card component with reactive styles
const Card = ({ title, active }: { title: string; active: boolean }) => {
  const cardClass = () => cx(
    css`
      padding: 20px;
      background: var(--bg-card, #252525);
      border: 1px solid var(--border, #333);
      border-radius: 8px;
      transition: all 0.2s ease;
    `,
    {
      [css`
        background: rgba(74, 108, 247, 0.1);
        border-color: var(--accent, #4a6cf7);
        border-left: 3px solid var(--accent, #4a6cf7);
      `]: active,
      
      [css`
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
      `]: !active,
    }
  );
  
  return h('div', { className: cardClass }, [
    h('h3', {}, title),
    h('p', {}, () => `Count: ${count()}`),
  ]);
};

// Render
const app = Card({ title: 'My Card', active: true });
render(app, document.getElementById('app')!);
```

## Advanced Patterns

### Pattern 4: CSS Variables for Theming

```typescript
// Set CSS variables via JavaScript
const setTheme = (theme: 'dark' | 'light') => {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.style.setProperty('--bg-primary', '#1a1a1a');
    root.style.setProperty('--bg-card', '#252525');
    root.style.setProperty('--text-primary', '#ffffff');
    root.style.setProperty('--border', '#333333');
    root.style.setProperty('--accent', '#4a6cf7');
  } else {
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-card', '#f5f5f5');
    root.style.setProperty('--text-primary', '#1a1a1a');
    root.style.setProperty('--border', '#e0e0e0');
    root.style.setProperty('--accent', '#4a6cf7');
  }
};

// Use in goober styles
const themedCard = css`
  padding: 20px;
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  
  &:hover {
    border-color: var(--accent);
  }
`;
```

### Pattern 5: Responsive Styles

```typescript
import { responsive } from './lib/class-utils';

const cardClass = css`
  ${responsive({
    base: `
      display: flex;
      flex-direction: column;
      padding: 12px;
    `,
    md: `
      flex-direction: row;
      padding: 16px;
    `,
    lg: `
      padding: 24px;
      gap: 20px;
    `,
  })}
`;
```

### Pattern 6: Animations

```typescript
import { animate } from './lib/class-utils';

const fadeInCard = css`
  ${animate('fadeIn', `
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  `, { duration: '0.3s', fillMode: 'forwards' })}
  
  padding: 20px;
  background: var(--bg-card);
  border-radius: 8px;
`;
```

### Pattern 7: Styled Components Pattern

```typescript
import { styled } from 'goober';

// Create reusable styled components
export const Button = styled('button')`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--accent, #4a6cf7);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s ease;
  outline: none;

  &:hover {
    background: var(--accent-hover, #3d5ce0);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--accent), 0 0 0 4px rgba(74, 108, 247, 0.3);
  }
`;

export const Card = styled('div')`
  padding: 20px;
  background: var(--bg-card, #252525);
  border: 1px solid var(--border, #333);
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border-color: var(--accent, #4a6cf7);
  }
`;

// Usage
const button = document.createElement('button');
button.className = Button;
button.textContent = 'Click me';
```

## Complete App Example

```typescript
import { signal, computed, effect } from './lib/reactivity';
import { h, render } from './lib/template';
import { css, styled } from 'goober';
import { cx, createRxClass } from './lib/class-utils';

// State
const theme = signal<'dark' | 'light'>('dark');
const sidebarOpen = signal(true);
const searchQuery = signal('');
const windows = signal<Array<{ id: string; title: string }>>([]);

// CSS Variables setup
const setupTheme = () => {
  const root = document.documentElement;
  
  effect(() => {
    if (theme() === 'dark') {
      root.style.setProperty('--bg-primary', '#1a1a1a');
      root.style.setProperty('--bg-card', '#252525');
      root.style.setProperty('--text-primary', '#ffffff');
    } else {
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-card', '#f5f5f5');
      root.style.setProperty('--text-primary', '#1a1a1a');
    }
  });
};

// Components
const Sidebar = () => {
  const sidebarClass = createRxClass(
    (values) => `
      width: ${values.open ? '240px' : '60px'};
      background: var(--bg-card);
      height: 100vh;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
    `,
    { open: sidebarOpen }
  );

  return h('aside', { className: sidebarClass }, [
    h('button', {
      className: css`padding: 12px;`,
      onClick: () => sidebarOpen.update(v => !v),
    }, () => sidebarOpen() ? '◀' : '▶'),
  ]);
};

const SearchBar = () => {
  return h('div', { 
    className: css`margin-bottom: 20px;` 
  }, [
    h('input', {
      type: 'text',
      className: css`
        width: 100%;
        padding: 12px 16px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text-primary);
        
        &:focus {
          border-color: var(--accent);
          outline: none;
        }
      `,
      placeholder: 'Search...',
      value: () => searchQuery(),
      onInput: (e: Event) => searchQuery.set((e.target as HTMLInputElement).value),
    }),
  ]);
};

const Card = (props: { title: string; category: string }) => {
  const categoryIcons: Record<string, string> = {
    framework: '◈',
    security: '●',
    api: '▶',
  };

  return h('div', {
    className: cx(
      css`
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          border-color: var(--accent);
        }
      `
    ),
  }, [
    h('span', { 
      className: css`font-size: 1.5em; color: var(--accent);` 
    }, categoryIcons[props.category] || '●'),
    h('div', {}, [
      h('h3', { 
        className: css`margin: 0 0 4px 0; font-size: 1em;` 
      }, props.title),
      h('span', { 
        className: css`
          font-size: 0.75em;
          padding: 2px 8px;
          background: var(--bg-primary);
          border-radius: 4px;
          color: var(--text-secondary);
        ` 
      }, props.category),
    ]),
  ]);
};

const App = () => {
  setupTheme();

  return h('div', {
    className: css`
      display: flex;
      height: 100vh;
      background: var(--bg-primary);
      color: var(--text-primary);
    `,
  }, [
    Sidebar(),
    h('main', { 
      className: css`flex: 1; padding: 20px; overflow-y: auto;` 
    }, [
      SearchBar(),
      h('div', {
        className: css`
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        `,
      }, [
        Card({ title: 'Electron Framework', category: 'framework' }),
        Card({ title: 'Security Guide', category: 'security' }),
        Card({ title: 'Native APIs', category: 'api' }),
      ]),
    ]),
  ]);
};

// Initialize
export const initApp = (container: HTMLElement) => {
  const app = App();
  return render(app, container);
};
```

## API Reference

### `css` (from goober)
Create CSS classes with tagged template literals.

```typescript
import { css } from 'goober';

const className = css`
  padding: 12px;
  background: blue;
  
  &:hover {
    background: darkblue;
  }
`;
```

### `styled` (from goober)
Create styled components.

```typescript
import { styled } from 'goober';

const Button = styled('button')`
  padding: 12px 24px;
  background: blue;
`;

// Use
const button = document.createElement('button');
button.className = Button;
```

### `cx` (from class-utils)
Conditional class name joining with signal support.

```typescript
import { cx } from './lib/class-utils';

cx('foo', true && 'bar', { baz: true }); // => 'foo bar baz'
cx(['foo', 'bar']); // => 'foo bar'
cx(baseStyles, { [activeStyles]: isActive() }); // With goober
```

### `createRxClass`
Create reactive CSS that updates when signals change.

```typescript
import { createRxClass } from './lib/class-utils';

const myClass = createRxClass(
  (values) => `color: ${values.color};`,
  { color: colorSignal }
);

// Use
element.className = myClass();
// Updates automatically when colorSignal changes
```

### `responsive`
Responsive breakpoint helper.

```typescript
import { responsive } from './lib/class-utils';

const styles = responsive({
  base: 'font-size: 14px;',
  md: 'font-size: 16px;',
  lg: 'font-size: 18px;',
});
```

### `animate`
CSS animation helper.

```typescript
import { animate } from './lib/class-utils';

const animation = animate('fadeIn', `
  from { opacity: 0; }
  to { opacity: 1; }
`, { duration: '0.3s' });
```

## Best Practices

1. **Use CSS Variables for theming** - Set in JS, use in goober
2. **Use `cx` for conditionals** - Cleaner than template literals
3. **Use `createRxClass` for complex reactive styles**
4. **Keep goober styles co-located** - Near the component that uses them
5. **Extract reusable patterns** - To styled components

## Performance Tips

1. **Goober is 1KB** - Minimal runtime overhead
2. **Styles are hashed** - Only unique styles are inserted
3. **Autoprefixer included** - Automatic vendor prefixes
4. **SSR ready** - Use `extractCss()` for server rendering

## Examples

See complete examples:
- `src/renderer/components/clsx-example.ts` - Full dashboard
- `src/renderer/components/reactive-app-example.ts` - Basic setup

## Resources

- Goober: https://goober.js.org/
- Clsx: https://github.com/lukeed/clsx
