import { createReactiveStyles } from '../lib/reactive-styles';
import { computed, effect, signal } from '../lib/reactivity';
import type { Signal } from '../lib/reactivity';
import { css, styled } from '../lib/styling';
import { h, render } from '../lib/template';
import type { TemplateNode } from '../lib/template';

// ============================================
// EXAMPLE: Complete Reactive + Styled UI
// ============================================

// 1. Define reactive state
const theme = signal<'dark' | 'light'>('dark');
const sidebarWidth = signal(240);
const searchQuery = signal('');
const activeTab = signal('all');
const windowCount = signal(0);

// 2. Create reactive styles based on state
const appStyles = createReactiveStyles(
  (values) => `
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: ${values.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
    color: ${values.theme === 'dark' ? '#ffffff' : '#333333'};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,
  { theme }
);

const sidebarStyles = createReactiveStyles(
  (values) => `
    width: ${values.sidebarWidth}px;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: ${values.theme === 'dark' ? '#252525' : '#f5f5f5'};
    border-right: 1px solid ${values.theme === 'dark' ? '#333' : '#ddd'};
    transition: width 0.3s ease;
  `,
  { sidebarWidth, theme }
);

const mainContentStyles = createReactiveStyles(
  (values) => `
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: ${values.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
  `,
  { theme }
);

// 3. Styled components with goober
const Button = styled('button')`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--accent, #4a6cf7);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.9em;

  &:hover {
    background: var(--accent-hover, #3d5ce0);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus {
    outline: 2px solid var(--accent, #4a6cf7);
    outline-offset: 2px;
  }
`;

const SearchInput = styled('input')`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border, #333);
  border-radius: 8px;
  background: var(--bg-card, #252525);
  color: inherit;
  font-size: 1em;
  outline: none;
  transition: all 0.15s ease;

  &:focus {
    border-color: var(--accent, #4a6cf7);
    box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.1);
  }

  &::placeholder {
    color: var(--text-secondary, #666);
  }
`;

const Card = styled('div')`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-card, #252525);
  border: 1px solid var(--border, #333);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border-color: var(--accent, #4a6cf7);
  }

  &:active {
    transform: translateY(0);
  }
`;

const DockItem = styled('div')`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-card, #252525);
  border: 1px solid var(--border, #333);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: 6px;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const TabButton = styled('button')`
  padding: 6px 12px;
  border: 1px solid var(--border, #333);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85em;
  transition: all 0.15s ease;
  background: transparent;
  color: inherit;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

// 4. Dynamic styles based on state
const getDockItemStyles = (isActive: boolean, isMinimized: boolean, isLoading: boolean) => css`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: ${isActive ? '#333' : 'var(--bg-card, #252525)'};
  border: 1px solid var(--border, #333);
  border-left: ${
    isActive
      ? '3px solid #27c93f'
      : isLoading
        ? '3px solid #fbbf24'
        : '1px solid var(--border, #333)'
  };
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  opacity: ${isMinimized || isLoading ? '0.8' : '1'};
  margin-bottom: 6px;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const getTabButtonStyles = (isActive: boolean) => css`
  padding: 6px 12px;
  border: 1px solid var(--border, #333);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85em;
  transition: all 0.15s ease;
  background: ${isActive ? 'var(--accent, #4a6cf7)' : 'transparent'};
  color: ${isActive ? 'white' : 'inherit'};

  &:hover {
    background: ${isActive ? 'var(--accent, #4a6cf7)' : 'rgba(255, 255, 255, 0.05)'};
  }
`;

// 5. Create reactive UI components
const createSidebar = (windows: Signal<Map<string, unknown>>): TemplateNode => {
  const windowsList = computed(() => {
    const w = windows();
    return Array.from(w.values());
  });

  return h(
    'aside',
    {
      className: sidebarStyles(),
    },
    [
      // Home button
      h(
        'button',
        {
          className: css`
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: transparent;
        border: none;
        color: inherit;
        cursor: pointer;
        width: 100%;
        text-align: left;
        transition: background 0.15s ease;
        
        &:hover {
          background: rgba(255, 255, 255, 0.05);
        }
      `,
          onClick: () => console.log('Home clicked'),
        },
        [h('span', { style: 'font-size: 1.1em;' }, '⌂'), h('span', {}, 'Home')]
      ),

      // Windows dock header
      h(
        'div',
        {
          style: 'flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden;',
        },
        [
          h(
            'div',
            {
              style: `
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 4px;
          font-size: 0.7em;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary, #666);
          border-bottom: 1px solid var(--border, #333);
          margin-bottom: 8px;
        `,
            },
            [
              h('span', {}, 'Windows'),
              h(
                'span',
                {
                  style: `
            background: var(--accent, #4a6cf7);
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.85em;
          `,
                },
                String(windowCount())
              ),
            ]
          ),

          // Dock items
          h(
            'div',
            {
              style:
                'flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding: 0 8px;',
            },
            windowsList().map((win: unknown) => {
              const w = win as {
                id: string;
                title: string;
                active: boolean;
                minimized: boolean;
                loading: boolean;
              };
              return h(
                'div',
                {
                  className: getDockItemStyles(w.active, w.minimized, w.loading),
                  onClick: () => console.log('Window clicked:', w.id),
                },
                [
                  h(
                    'span',
                    {
                      style:
                        'width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;',
                    },
                    w.loading ? '⏳' : w.minimized ? '👁' : '●'
                  ),
                  h(
                    'span',
                    {
                      style:
                        'flex: 1; font-size: 0.85em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
                    },
                    `${w.title}${w.loading ? ' (loading...)' : ''}`
                  ),
                  h('div', { style: 'display: flex; gap: 4px;' }, [
                    h(
                      'button',
                      {
                        style:
                          'width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; background: transparent; border: 1px solid var(--border); border-radius: 4px; cursor: pointer;',
                        onClick: (e: Event) => {
                          e.stopPropagation();
                          console.log('Toggle:', w.id);
                        },
                      },
                      w.minimized ? '＋' : '−'
                    ),
                    h(
                      'button',
                      {
                        style:
                          'width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; background: transparent; border: 1px solid var(--border); border-radius: 4px; cursor: pointer;',
                        onClick: (e: Event) => {
                          e.stopPropagation();
                          console.log('Close:', w.id);
                        },
                      },
                      '×'
                    ),
                  ]),
                ]
              );
            })
          ),
        ]
      ),
    ]
  );
};

const createSearchBar = (): TemplateNode => {
  return h('div', { style: 'margin-bottom: 16px;' }, [
    h('input', {
      type: 'text',
      className: SearchInput,
      placeholder: 'Search topics...',
      value: searchQuery(),
      onInput: (e: Event) => {
        const target = e.target as HTMLInputElement;
        searchQuery.set(target.value);
      },
    }),
  ]);
};

const createTabs = (categories: string[]): TemplateNode => {
  return h('div', { style: 'margin-bottom: 16px;' }, [
    h('div', { style: 'display: flex; flex-wrap: wrap; gap: 8px;' }, [
      // All tab
      h(
        'button',
        {
          className: getTabButtonStyles(activeTab() === 'all'),
          onClick: () => activeTab.set('all'),
        },
        'All'
      ),

      // Category tabs
      ...categories.map((cat) =>
        h(
          'button',
          {
            className: getTabButtonStyles(activeTab() === cat),
            onClick: () => activeTab.set(cat),
          },
          cat.charAt(0).toUpperCase() + cat.slice(1)
        )
      ),
    ]),
  ]);
};

const createCard = (title: string, category: string, onClick: () => void): TemplateNode => {
  const icons: Record<string, string> = {
    framework: '◈',
    security: '●',
    api: '▶',
    performance: '◉',
    packaging: '■',
    development: '◆',
    maintenance: '★',
    architecture: '⬡',
  };

  return h(
    'div',
    {
      className: Card,
      onClick,
    },
    [
      h(
        'div',
        {
          style: 'font-size: 1.5em; color: var(--accent, #4a6cf7);',
        },
        icons[category] || '●'
      ),
      h('div', {}, [
        h('h3', { style: 'margin: 0 0 4px 0; font-size: 1em; font-weight: 600;' }, title),
        h(
          'span',
          {
            style:
              'display: inline-block; font-size: 0.75em; padding: 2px 8px; background: var(--bg-secondary); border-radius: 4px; color: var(--text-secondary);',
          },
          category
        ),
      ]),
    ]
  );
};

// 6. Main app component with everything combined
const createApp = (): TemplateNode => {
  const windows = signal<Map<string, unknown>>(new Map());
  const categories = ['framework', 'security', 'api', 'performance'];
  const items = [
    { id: '1', title: 'Electron Framework', category: 'framework' },
    { id: '2', title: 'Security Best Practices', category: 'security' },
    { id: '3', title: 'Native APIs', category: 'api' },
    { id: '4', title: 'Performance Optimization', category: 'performance' },
  ];

  // Filter items based on search and active tab
  const filteredItems = computed(() => {
    const query = searchQuery().toLowerCase();
    const tab = activeTab();

    return items.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(query);
      const matchesTab = tab === 'all' || item.category === tab;
      return matchesSearch && matchesTab;
    });
  });

  return h(
    'div',
    {
      className: appStyles(),
    },
    [
      // Sidebar
      createSidebar(windows),

      // Main content
      h(
        'main',
        {
          className: mainContentStyles(),
        },
        [
          h('div', { style: 'max-width: 1200px; margin: 0 auto;' }, [
            // Search
            createSearchBar(),

            // Tabs
            createTabs(categories),

            // Cards grid
            h(
              'div',
              {
                style:
                  'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;',
              },
              filteredItems().map((item) =>
                createCard(item.title, item.category, () => {
                  console.log('Opening:', item.id);
                  windowCount.update((n) => n + 1);
                })
              )
            ),
          ]),

          // Theme toggle
          h('div', { style: 'position: fixed; bottom: 20px; right: 20px;' }, [
            h(
              'button',
              {
                className: Button,
                onClick: () => {
                  theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
                },
              },
              `Switch to ${theme() === 'dark' ? 'light' : 'dark'} mode`
            ),
          ]),
        ]
      ),
    ]
  );
};

// 7. Initialize the app
export const initApp = (container: HTMLElement): (() => void) => {
  const app = createApp();
  const { cleanup } = render(app, container);

  // Set up reactive updates
  const unsubscribeTheme = theme.subscribe(() => {
    // Styles automatically update through the signals
    console.log('Theme changed:', theme());
  });

  return () => {
    cleanup();
    unsubscribeTheme();
  };
};

// Export everything for use in other files
export {
  theme,
  sidebarWidth,
  searchQuery,
  activeTab,
  windowCount,
  appStyles,
  sidebarStyles,
  mainContentStyles,
  Button,
  SearchInput,
  Card,
  DockItem,
  TabButton,
  getDockItemStyles,
  getTabButtonStyles,
  createSidebar,
  createSearchBar,
  createTabs,
  createCard,
  createApp,
};
