/**
 * Complete Example: Reactivity + Goober + Clsx
 *
 * This example demonstrates how to use:
 * - Signals for reactive state
 * - Goober for CSS-in-JS
 * - Clsx for conditional class names
 * - Together in a cohesive system
 */

import { animate, bem, createRxClass, cx, responsive, rx } from '../../frontend/lib/class-utils';
import { computed, effect, signal } from '../../frontend/lib/reactivity';
import type { Signal } from '../../frontend/lib/reactivity';
import { css, styled } from '../../frontend/lib/styling';
import { h, render } from '../../frontend/lib/template';
import type { TemplateNode } from '../../frontend/lib/template';

// ============================================
// 1. Define Application State
// ============================================

const theme = signal<'dark' | 'light'>('dark');
const sidebarOpen = signal(true);
const sidebarWidth = computed(() => (sidebarOpen() ? 240 : 60));
const activeView = signal('home');
const searchQuery = signal('');
const isLoading = signal(false);
const windows = signal<Array<{ id: string; title: string; active: boolean }>>([]);

// ============================================
// 2. Create Reactive Styles with Clsx
// ============================================

// Base styles using goober
const baseButtonStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--accent, #4a6cf7), 0 0 0 4px rgba(74, 108, 247, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Reactive button styles that change based on signals
const getButtonClass = (variant: 'primary' | 'secondary' | 'ghost' = 'primary') => {
  return () =>
    cx(baseButtonStyles, {
      // Conditional styles based on variant
      [css`
        background: var(--accent, #4a6cf7);
        color: white;
        &:hover:not(:disabled) { background: var(--accent-hover, #3d5ce0); }
      `]: variant === 'primary',

      [css`
        background: transparent;
        border: 1px solid var(--border, #333);
        color: inherit;
        &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.05); }
      `]: variant === 'secondary',

      [css`
        background: transparent;
        color: inherit;
        &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.05); }
      `]: variant === 'ghost',
    });
};

// Sidebar styles with reactive width
const sidebarClass = createRxClass(
  (values) => `
    width: ${values.width}px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: ${values.isDark ? '#252525' : '#f5f5f5'};
    border-right: 1px solid ${values.isDark ? '#333' : '#ddd'};
    transition: width 0.3s ease;
    overflow: hidden;
  `,
  { width: sidebarWidth, isDark: computed(() => theme() === 'dark') }
);

// Main content area
const mainContentClass = () =>
  cx(
    css`
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    transition: margin-left 0.3s ease;
  `,
    {
      [css`margin-left: 0;`]: !sidebarOpen(),
    }
  );

// Card component with multiple states
const getCardClass = (
  isActive: boolean | Signal<boolean>,
  isLoading: boolean | Signal<boolean>,
  size: 'sm' | 'md' | 'lg' = 'md'
) => {
  return () =>
    cx(
      css`
      display: flex;
      align-items: center;
      gap: 12px;
      border: 1px solid var(--border, #333);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    `,
      // Size variants
      {
        [css`padding: 12px;`]: size === 'sm',
        [css`padding: 16px;`]: size === 'md',
        [css`padding: 24px;`]: size === 'lg',
      },
      // State styles
      {
        [css`
        background: #333;
        border-left: 3px solid #27c93f;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      `]: typeof isActive === 'function' ? isActive() : isActive,

        [css`
        background: var(--bg-card, #252525);
        opacity: 0.7;
        pointer-events: none;
      `]: typeof isLoading === 'function' ? isLoading() : isLoading,

        [css`
        background: var(--bg-card, #252525);
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          border-color: var(--accent, #4a6cf7);
        }
      `]:
          !(typeof isActive === 'function' ? isActive() : isActive) &&
          !(typeof isLoading === 'function' ? isLoading() : isLoading),
      }
    );
};

// Search input with focus states
const searchInputClass = () =>
  cx(
    css`
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--border, #333);
    border-radius: 8px;
    background: var(--bg-card, #252525);
    color: inherit;
    font-size: 1em;
    outline: none;
    transition: all 0.15s ease;
  `,
    // Focus state handled via CSS
    css`
    &:focus {
      border-color: var(--accent, #4a6cf7);
      box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.1);
    }
    
    &::placeholder {
      color: var(--text-secondary, #666);
    }
  `
  );

// ============================================
// 3. Component Templates with Reactive Classes
// ============================================

const createSidebarToggle = (): TemplateNode => {
  return h(
    'button',
    {
      className: getButtonClass('ghost')(),
      style: 'position: absolute; top: 10px; right: -40px; width: 32px; height: 32px; padding: 0;',
      onClick: () => sidebarOpen.update((v) => !v),
      ariaLabel: () => (sidebarOpen() ? 'Collapse sidebar' : 'Expand sidebar'),
    },
    [() => (sidebarOpen() ? '◀' : '▶')]
  );
};

const createNavItem = (id: string, label: string, icon: string): TemplateNode => {
  const isActive = computed(() => activeView() === id);

  return h(
    'button',
    {
      className: () =>
        cx(
          css`
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 12px;
        background: transparent;
        border: none;
        color: inherit;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s ease;
        white-space: nowrap;
      `,
          {
            [css`
          background: rgba(74, 108, 247, 0.1);
          color: var(--accent, #4a6cf7);
          border-right: 3px solid var(--accent, #4a6cf7);
        `]: isActive(),

            [css`
          &:hover {
            background: rgba(255, 255, 255, 0.05);
          }
        `]: !isActive(),
          }
        ),
      onClick: () => activeView.set(id),
    },
    [
      h('span', { style: 'font-size: 1.2em; width: 24px; text-align: center;' }, icon),
      h(
        'span',
        {
          style: () =>
            sidebarOpen()
              ? 'opacity: 1; width: auto; margin-left: 0;'
              : 'opacity: 0; width: 0; margin-left: -12px; overflow: hidden;',
        },
        label
      ),
    ]
  );
};

const createSidebar = (): TemplateNode => {
  return h(
    'aside',
    {
      className: sidebarClass,
    },
    [
      createSidebarToggle(),

      // Logo/Brand
      h(
        'div',
        {
          style:
            'padding: 20px 12px; border-bottom: 1px solid var(--border, #333); margin-bottom: 8px;',
        },
        [
          h(
            'h1',
            {
              style: () =>
                sidebarOpen()
                  ? 'font-size: 1.2em; margin: 0; font-weight: 600;'
                  : 'font-size: 1.2em; margin: 0; font-weight: 600; text-align: center;',
            },
            '⚡ Electron App'
          ),
        ]
      ),

      // Navigation
      h('nav', { style: 'flex: 1; overflow-y: auto;' }, [
        createNavItem('home', 'Home', '🏠'),
        createNavItem('windows', 'Windows', '🪟'),
        createNavItem('settings', 'Settings', '⚙️'),
      ]),

      // Bottom section
      h(
        'div',
        {
          style: 'padding: 12px; border-top: 1px solid var(--border, #333);',
        },
        [
          h(
            'button',
            {
              className: getButtonClass('secondary')(),
              style: 'width: 100%;',
              onClick: () => theme.update((t) => (t === 'dark' ? 'light' : 'dark')),
            },
            [() => (theme() === 'dark' ? '🌙 Dark' : '☀️ Light')]
          ),
        ]
      ),
    ]
  );
};

const createSearchBar = (): TemplateNode => {
  return h('div', { style: 'margin-bottom: 20px;' }, [
    h(
      'div',
      {
        style: 'position: relative;',
      },
      [
        h(
          'span',
          {
            style:
              'position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-secondary);',
          },
          '🔍'
        ),
        h('input', {
          type: 'text',
          className: searchInputClass,
          placeholder: 'Search...',
          style: 'padding-left: 44px;',
          value: () => searchQuery(),
          onInput: (e: Event) => searchQuery.set((e.target as HTMLInputElement).value),
        }),
        // Clear button
        () =>
          searchQuery()
            ? h(
                'button',
                {
                  style:
                    'position: absolute; right: 16px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-secondary);',
                  onClick: () => searchQuery.set(''),
                },
                '✕'
              )
            : null,
      ]
    ),
  ]);
};

const createWindowCard = (window: { id: string; title: string; active: boolean }): TemplateNode => {
  const isWindowActive = signal(window.active);
  const isWindowLoading = signal(false);

  return h(
    'div',
    {
      className: () => getCardClass(isWindowActive, isWindowLoading, 'md')(),
      onClick: () => {
        isWindowActive.update((v) => !v);
      },
    },
    [
      h(
        'div',
        {
          style: () => `
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2em;
        background: ${isWindowActive() ? 'var(--accent, #4a6cf7)' : 'var(--bg-secondary, #333)'};
        color: ${isWindowActive() ? 'white' : 'inherit'};
        transition: all 0.2s ease;
      `,
        },
        isWindowLoading() ? '⏳' : isWindowActive() ? '●' : '○'
      ),

      h('div', { style: 'flex: 1;' }, [
        h('h3', { style: 'margin: 0 0 4px 0; font-size: 1em;' }, window.title),
        h(
          'span',
          {
            style: 'font-size: 0.8em; color: var(--text-secondary);',
          },
          () => (isWindowActive() ? 'Active' : isWindowLoading() ? 'Loading...' : 'Inactive')
        ),
      ]),

      h('div', { style: 'display: flex; gap: 8px;' }, [
        h(
          'button',
          {
            className: () => getButtonClass('ghost')(),
            style: 'padding: 6px 12px; font-size: 0.8em;',
            onClick: (e: Event) => {
              e.stopPropagation();
              isWindowLoading.set(true);
              setTimeout(() => isWindowLoading.set(false), 2000);
            },
          },
          'Reload'
        ),
        h(
          'button',
          {
            className: () => getButtonClass('ghost')(),
            style: 'padding: 6px 12px; font-size: 0.8em; color: #ff4444;',
            onClick: (e: Event) => {
              e.stopPropagation();
              windows.update((w) => w.filter((win) => win.id !== window.id));
            },
          },
          'Close'
        ),
      ]),
    ]
  );
};

const createWindowsView = (): TemplateNode => {
  const windowList = computed(() => windows());

  return h('div', {}, [
    h(
      'div',
      {
        style:
          'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;',
      },
      [
        h('h2', { style: 'margin: 0;' }, 'Windows'),
        h(
          'button',
          {
            className: getButtonClass('primary')(),
            onClick: () => {
              const id = String(Date.now());
              windows.update((w) => [...w, { id, title: `Window ${w.length + 1}`, active: false }]);
            },
          },
          '+ New Window'
        ),
      ]
    ),

    () =>
      windowList().length === 0
        ? h(
            'div',
            {
              style: 'text-align: center; padding: 60px 20px; color: var(--text-secondary);',
            },
            [
              h('div', { style: 'font-size: 3em; margin-bottom: 16px;' }, '🪟'),
              h('p', {}, 'No windows open'),
              h(
                'button',
                {
                  className: getButtonClass('secondary')(),
                  onClick: () => {
                    const id = String(Date.now());
                    windows.update((w) => [
                      ...w,
                      { id, title: `Window ${w.length + 1}`, active: false },
                    ]);
                  },
                },
                'Create your first window'
              ),
            ]
          )
        : h(
            'div',
            {
              style:
                'display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;',
            },
            windowList().map(createWindowCard)
          ),
  ]);
};

const createHomeView = (): TemplateNode => {
  return h('div', {}, [
    h('h2', { style: 'margin-bottom: 20px;' }, 'Dashboard'),
    h(
      'div',
      {
        style:
          'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 30px;',
      },
      [
        // Stats cards
        h(
          'div',
          {
            className: cx(
              css`padding: 20px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border);`,
              css`&:hover { border-color: var(--accent); }`
            ),
          },
          [
            h('div', { style: 'font-size: 2em; margin-bottom: 8px;' }, '🪟'),
            h('div', { style: 'font-size: 1.5em; font-weight: 600;' }, () =>
              String(windows().length)
            ),
            h(
              'div',
              { style: 'color: var(--text-secondary); font-size: 0.9em;' },
              'Active Windows'
            ),
          ]
        ),
        h(
          'div',
          {
            className: cx(
              css`padding: 20px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border);`,
              css`&:hover { border-color: var(--accent); }`
            ),
          },
          [
            h('div', { style: 'font-size: 2em; margin-bottom: 8px;' }, '🎨'),
            h('div', { style: 'font-size: 1.5em; font-weight: 600;' }, () =>
              theme() === 'dark' ? 'Dark' : 'Light'
            ),
            h('div', { style: 'color: var(--text-secondary); font-size: 0.9em;' }, 'Current Theme'),
          ]
        ),
        h(
          'div',
          {
            className: cx(
              css`padding: 20px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border);`,
              css`&:hover { border-color: var(--accent); }`
            ),
          },
          [
            h('div', { style: 'font-size: 2em; margin-bottom: 8px;' }, '📐'),
            h('div', { style: 'font-size: 1.5em; font-weight: 600;' }, () => `${sidebarWidth()}px`),
            h('div', { style: 'color: var(--text-secondary); font-size: 0.9em;' }, 'Sidebar Width'),
          ]
        ),
      ]
    ),

    h(
      'p',
      { style: 'color: var(--text-secondary); line-height: 1.6;' },
      'Welcome to the Electron app with reactive signals, goober CSS-in-JS, and clsx class management. Try toggling the sidebar, switching themes, and managing windows!'
    ),
  ]);
};

const createMainContent = (): TemplateNode => {
  return h(
    'main',
    {
      className: mainContentClass,
    },
    [
      createSearchBar(),

      () => {
        switch (activeView()) {
          case 'home':
            return createHomeView();
          case 'windows':
            return createWindowsView();
          case 'settings':
            return h('div', {}, h('h2', {}, 'Settings'));
          default:
            return createHomeView();
        }
      },
    ]
  );
};

// ============================================
// 4. Main Application
// ============================================

const createApp = (): TemplateNode => {
  return h(
    'div',
    {
      className: () =>
        cx(
          css`
        display: flex;
        height: 100vh;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `,
          {
            [css`
          background: #1a1a1a;
          color: #ffffff;
        `]: theme() === 'dark',

            [css`
          background: #ffffff;
          color: #333333;
        `]: theme() === 'light',
          }
        ),
    },
    [createSidebar(), createMainContent()]
  );
};

// ============================================
// 5. Initialize App
// ============================================

export const initClsxExample = (container: HTMLElement): (() => void) => {
  // Set CSS variables for theming
  const updateCSSVariables = () => {
    const root = document.documentElement;
    if (theme() === 'dark') {
      root.style.setProperty('--bg-primary', '#1a1a1a');
      root.style.setProperty('--bg-card', '#252525');
      root.style.setProperty('--bg-secondary', '#333');
      root.style.setProperty('--text-primary', '#fff');
      root.style.setProperty('--text-secondary', '#999');
      root.style.setProperty('--border', '#333');
      root.style.setProperty('--accent', '#4a6cf7');
      root.style.setProperty('--accent-hover', '#3d5ce0');
    } else {
      root.style.setProperty('--bg-primary', '#fff');
      root.style.setProperty('--bg-card', '#f5f5f5');
      root.style.setProperty('--bg-secondary', '#e0e0e0');
      root.style.setProperty('--text-primary', '#333');
      root.style.setProperty('--text-secondary', '#666');
      root.style.setProperty('--border', '#ddd');
      root.style.setProperty('--accent', '#4a6cf7');
      root.style.setProperty('--accent-hover', '#3d5ce0');
    }
  };

  // Subscribe to theme changes
  const unsubscribeTheme = theme.subscribe(updateCSSVariables);
  updateCSSVariables();

  // Render app
  const app = createApp();
  const { cleanup } = render(app, container);

  return () => {
    cleanup();
    unsubscribeTheme();
  };
};

// Export for use
export {
  theme,
  sidebarOpen,
  sidebarWidth,
  activeView,
  searchQuery,
  isLoading,
  windows,
  getButtonClass,
  sidebarClass,
  mainContentClass,
  getCardClass,
  searchInputClass,
};
