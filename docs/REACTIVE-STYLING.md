# Reactivity + Goober + Clsx Integration Guide

This guide shows how to combine three powerful libraries for building reactive, styled UIs in Electron.

## The Stack

- **Signals** (`./lib/reactivity`) - Fine-grained reactive state
- **Goober** - 1KB CSS-in-JS library
- **Clsx** - Conditional className utility (0.2KB)

## Installation

Already installed via package.json:
```bash
bun install
```

## Quick Start

### 1. Basic Setup

```typescript
import { signal } from './lib/reactivity';
import { css } from './lib/styling';
import { cx } from './lib/class-utils';

// Create reactive state
const isActive = signal(false);

// Create styles
const buttonClass = css`
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
`;

// Use cx for conditional classes
const getClassName = () => cx(
  buttonClass,
  {
    [css`background: blue; color: white;`]: isActive(),
    [css`background: gray;`]: !isActive(),
  }
);
```

### 2. Reactive Styles with Signals

```typescript
import { createRxClass } from './lib/class-utils';

const theme = signal('dark');
const sidebarOpen = signal(true);

// Styles that automatically update when signals change
const sidebarClass = createRxClass(
  (values) => `
    width: ${values.isOpen ? '240px' : '60px'};
    background: ${values.theme === 'dark' ? '#1a1a1a' : '#fff'};
    transition: width 0.3s ease;
  `,
  { isOpen: sidebarOpen, theme }
);

// Use in template
const sidebar = document.createElement('aside');
sidebar.className = sidebarClass(); // Automatically updates!
```

### 3. Conditional Classes with Clsx

```typescript
import { cx } from './lib/class-utils';

const size = signal<'sm' | 'md' | 'lg'>('md');
const isDisabled = signal(false);
const isLoading = signal(false);

const buttonClass = () => cx(
  // Base styles
  css`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  `,
  
  // Size variants (conditional)
  {
    [css`padding: 8px 12px; font-size: 0.8em;`]: size() === 'sm',
    [css`padding: 12px 20px; font-size: 0.9em;`]: size() === 'md',
    [css`padding: 16px 28px; font-size: 1em;`]: size() === 'lg',
  },
  
  // State styles (conditional)
  {
    [css`
      background: var(--accent);
      color: white;
      &:hover { background: var(--accent-hover); }
    `]: !isDisabled() && !isLoading(),
    
    [css`
      opacity: 0.5;
      cursor: not-allowed;
    `]: isDisabled() || isLoading(),
  }
);
```

## Advanced Patterns

### Pattern 1: Component with Multiple States

```typescript
import { signal, computed } from './lib/reactivity';
import { cx, css } from './lib/class-utils';

const createCard = (props: {
  id: string;
  title: string;
  variant?: 'default' | 'active' | 'loading';
}) => {
  const variant = signal(props.variant || 'default');
  const isHovered = signal(false);
  
  const cardClass = () => cx(
    // Base card styles
    css`
      display: flex;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--border);
      transition: all 0.2s ease;
    `,
    
    // Variant styles
    {
      [css`
        background: var(--bg-card);
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      `]: variant() === 'default',
      
      [css`
        background: rgba(74, 108, 247, 0.1);
        border-color: var(--accent);
        border-left: 3px solid var(--accent);
      `]: variant() === 'active',
      
      [css`
        opacity: 0.7;
        pointer-events: none;
        &::after {
          content: '⏳';
          margin-left: auto;
        }
      `]: variant() === 'loading',
    },
    
    // Hover effect (only for default)
    {
      [css`border-color: var(--accent);`]: 
        isHovered() && variant() === 'default',
    }
  );
  
  return {
    className: cardClass,
    setVariant: (v: 'default' | 'active' | 'loading') => variant.set(v),
    setHovered: (v: boolean) => isHovered.set(v),
  };
};
```

### Pattern 2: Responsive Design

```typescript
import { responsive } from './lib/class-utils';

const responsiveCard = css`
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

// Or with signals
const layout = signal<'list' | 'grid'>('list');

const containerClass = () => cx(
  css`display: flex; gap: 16px;`,
  {
    [css`flex-direction: column;`]: layout() === 'list',
    [css`
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    `]: layout() === 'grid',
  }
);
```

### Pattern 3: Theme-Aware Components

```typescript
import { signal } from './lib/reactivity';
import { cx, css } from './lib/class-utils';

const theme = signal<'dark' | 'light'>('dark');

const themedButton = () => cx(
  css`
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  `,
  
  // Theme-specific styles
  {
    [css`
      background: #4a6cf7;
      color: white;
      border: none;
      &:hover { background: #3d5ce0; }
    `]: theme() === 'dark',
    
    [css`
      background: white;
      color: #4a6cf7;
      border: 2px solid #4a6cf7;
      &:hover { background: #f0f4ff; }
    `]: theme() === 'light',
  }
);

// Or use CSS variables for easier theming
const setupTheme = () => {
  const root = document.documentElement;
  
  effect(() => {
    if (theme() === 'dark') {
      root.style.setProperty('--bg-primary', '#1a1a1a');
      root.style.setProperty('--bg-card', '#252525');
      root.style.setProperty('--text-primary', '#fff');
      root.style.setProperty('--accent', '#4a6cf7');
    } else {
      root.style.setProperty('--bg-primary', '#fff');
      root.style.setProperty('--bg-card', '#f5f5f5');
      root.style.setProperty('--text-primary', '#333');
      root.style.setProperty('--accent', '#4a6cf7');
    }
  });
};
```

### Pattern 4: Animation with State

```typescript
import { animate } from './lib/class-utils';
import { signal } from './lib/reactivity';
import { cx } from './lib/class-utils';

const isVisible = signal(false);

const animatedCard = () => cx(
  css`
    padding: 20px;
    background: var(--bg-card);
    border-radius: 8px;
  `,
  
  // Entry animation
  isVisible() && animate('slideIn', `
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `, { duration: '0.3s', fillMode: 'forwards' }),
  
  // Exit animation
  !isVisible() && animate('slideOut', `
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  `, { duration: '0.2s', fillMode: 'forwards' })
);
```

### Pattern 5: BEM-style Naming with Reactivity

```typescript
import { bem, rxBem } from './lib/class-utils';
import { signal } from './lib/reactivity';
import { cx } from './lib/class-utils';

// Static BEM
const cardClass = bem('card');
const cardHeaderClass = bem('card', 'header');
const cardHeaderActiveClass = bem('card', 'header', 'active');
// Result: "card__header card__header--active"

// Reactive BEM
const block = signal('sidebar');
const element = signal('nav');
const modifier = signal(['open', 'dark']);

const reactiveClass = rxBem(block, element, modifier);
// Returns function that updates when signals change
// Result: "sidebar__nav sidebar__nav--open sidebar__nav--dark"
```

## Integration with Template System

```typescript
import { h, render } from './lib/template';
import { signal } from './lib/reactivity';
import { cx, css } from './lib/class-utils';

const count = signal(0);
const isEven = computed(() => count() % 2 === 0);

const Counter = () => {
  return h('div', {
    className: cx(
      css`padding: 20px;`,
      css`background: ${isEven() ? '#e8f5e9' : '#ffebee'};`
    ),
  }, [
    h('h2', {}, `Count: ${count()}`),
    h('p', {}, isEven() ? 'Even number!' : 'Odd number!'),
    h('button', {
      className: css`
        padding: 10px 20px;
        cursor: pointer;
      `,
      onClick: () => count.update((c) => c + 1),
    }, 'Increment'),
  ]);
};

// Render with automatic updates
const app = Counter();
render(app, document.getElementById('app')!);
```

## Best Practices

### 1. Use `cx` for all className composition

```typescript
// ❌ Bad
className={`button ${isActive ? 'active' : ''}`}

// ✅ Good
className={cx('button', isActive && 'active')}

// ✅ Better (with goober)
className={cx(
  buttonBaseStyles,
  { [activeStyles]: isActive() }
)}
```

### 2. Extract reactive styles to functions

```typescript
// ❌ Bad - inline every time
className={cx(
  baseStyles,
  { [activeStyles]: isActive() }
)}

// ✅ Good - reusable function
const getButtonClass = (active: Signal<boolean>) => () => cx(
  baseStyles,
  { [activeStyles]: active() }
);

// Usage
className={getButtonClass(isActive)()}
```

### 3. Use `createRxClass` for complex reactive styles

```typescript
// ❌ Bad - multiple subscriptions manually
const class1 = () => cx(...);
const class2 = () => cx(...);
className={cx(class1(), class2())}

// ✅ Good - single reactive class
const componentClass = createRxClass(
  (values) => `...`,
  { theme, size, state }
);
className={componentClass()}
```

### 4. Prefer CSS variables for theming

```typescript
// ❌ Bad - conditionals everywhere
className={cx(
  { [darkStyles]: theme() === 'dark' },
  { [lightStyles]: theme() === 'light' }
)}

// ✅ Good - CSS variables
// In global CSS or effect:
root.style.setProperty('--bg', theme() === 'dark' ? '#1a1a1a' : '#fff');

// In component:
className={css`background: var(--bg);`}
```

## Performance Tips

1. **Memoize style functions** that don't depend on signals
2. **Use `createRxClass`** for components with multiple signal dependencies
3. **Batch updates** when changing multiple signals
4. **Avoid inline style objects** in render - use pre-defined style functions

## API Reference

### `cx(...inputs)`
Conditionally join classNames together.

```typescript
import { cx } from './lib/class-utils';

cx('foo', true && 'bar', { baz: true }); // => 'foo bar baz'
cx(['foo', 'bar']); // => 'foo bar'
cx({ foo: true, bar: false }); // => 'foo'
```

### `createRxClass(styleFn, signals)`
Create a reactive class that updates when signals change.

```typescript
import { createRxClass } from './lib/class-utils';

const myClass = createRxClass(
  (values) => `color: ${values.color};`,
  { color: colorSignal }
);

// Returns getter function
element.className = myClass();
```

### `responsive(styles)`
Create responsive styles with breakpoints.

```typescript
import { responsive } from './lib/class-utils';

const styles = responsive({
  base: 'font-size: 14px;',
  sm: 'font-size: 16px;',
  md: 'font-size: 18px;',
  lg: 'font-size: 20px;',
});
```

### `animate(name, keyframes, options)`
Create CSS animations.

```typescript
import { animate } from './lib/class-utils';

const animation = animate('fadeIn', `
  from { opacity: 0; }
  to { opacity: 1; }
`, { duration: '0.3s' });
```

### `bem(block, element?, modifier?)`
Generate BEM-style class names.

```typescript
import { bem } from './lib/class-utils';

bem('button'); // => 'button'
bem('button', 'icon'); // => 'button__icon'
bem('button', 'icon', 'large'); // => 'button__icon button__icon--large'
bem('button', null, ['primary', 'large']); // => 'button button--primary button--large'
```

## Examples

See complete working examples:
- `src/renderer/components/clsx-example.ts` - Full dashboard example
- `src/renderer/components/reactive-app-example.ts` - Basic reactive UI

## Questions?

- Signals API: `./lib/reactivity.ts`
- Clsx docs: https://github.com/lukeed/clsx
- Goober docs: https://goober.js.org/
