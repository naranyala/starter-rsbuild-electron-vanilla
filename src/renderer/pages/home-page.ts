import 'winbox/dist/css/winbox.min.css';
import WinBox from 'winbox/src/js/winbox';
import { useCaseRegistry } from '../features/electron-info';
import { type TemplateNode, h, render as mount, reconcile } from '../lib';
import { type Signal, effect, signal } from '../lib/reactivity';
import type { UseCase } from './features/electron-info';

interface WindowEntry {
  id: string;
  title: string;
  winbox: WinBox | null;
  minimized: boolean;
  active: boolean;
  firstOpen: boolean;
  openedAt: number;
  loading: boolean;
}

interface AppState {
  searchTerm: string;
  activeTab: string;
  sidebarWidth: number;
}

// Sidebar state signal to track when all windows are minimized
const sidebarState = signal<{ allMinimized: boolean; windowCount: number }>({
  allMinimized: true,
  windowCount: 0,
});

const createWindowManager = () => {
  const windowsSignal = signal<Map<string, WindowEntry>>(new Map());
  const activeWindowIdSignal = signal<string | null>(null);

  const updateSidebarState = () => {
    const windows = Array.from(windowsSignal().values());
    const count = windows.length;
    const allMinimized = count === 0 || windows.every((w) => w.minimized);
    sidebarState.set({ allMinimized, windowCount: count });
  };

  const getAll = (): WindowEntry[] => {
    return Array.from(windowsSignal().values()).sort((a, b) => a.openedAt - b.openedAt);
  };

  const getActiveId = (): string | null => activeWindowIdSignal();

  const open = (id: string, title: string, content: string): void => {
    const existing = windowsSignal().get(id);
    if (existing) {
      if (existing.minimized || !existing.active) {
        restore(id);
      } else {
        focus(id);
      }
      return;
    }

    const placeholderEntry: WindowEntry = {
      id,
      title,
      winbox: null,
      minimized: false,
      active: true,
      firstOpen: true,
      openedAt: Date.now(),
      loading: true,
    };

    const newWindows = new Map(windowsSignal());
    newWindows.set(id, placeholderEntry);
    windowsSignal.set(newWindows);
    activeWindowIdSignal.set(id);
    updateSidebarState();

    requestAnimationFrame(() => {
      const entry = windowsSignal().get(id);
      if (!entry) return;

      const sidebarWidth = 240;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const windowWidth = viewportWidth - sidebarWidth;

      const wb = new WinBox({
        title: title,
        width: windowWidth,
        height: viewportHeight,
        x: sidebarWidth,
        y: 0,
        class: 'app-window',
        background: '#1a1a1a',
        border: 0,
      });

      const contentHtml = `<div class="winbox-body"><h3>${title}</h3>${content}</div>`;
      wb.body.innerHTML = contentHtml;

      const updatedWindows = new Map(windowsSignal());
      const updatedEntry = updatedWindows.get(id);
      if (updatedEntry) {
        updatedEntry.winbox = wb;
        updatedEntry.loading = false;
        windowsSignal.set(updatedWindows);
        updateSidebarState();
      }

      bindEvents(id, wb, entry);
      focus(id);
    });
  };

  const bindEvents = (id: string, wb: WinBox, entry: WindowEntry): void => {
    wb.on('close', () => {
      const newWindows = new Map(windowsSignal());
      newWindows.delete(id);
      windowsSignal.set(newWindows);
      activeWindowIdSignal.set(null);
      updateSidebarState();
    });

    wb.on('minimize', (e) => {
      e.preventDefault();
      minimize(id);
    });

    wb.on('restore', () => {
      const newWindows = new Map(windowsSignal());
      const e = newWindows.get(id);
      if (e) e.firstOpen = false;
      windowsSignal.set(newWindows);
      restore(id);
    });

    wb.on('focus', () => {
      focus(id);
    });

    wb.on('move', () => {
      const newWindows = new Map(windowsSignal());
      const e = newWindows.get(id);
      if (e) e.firstOpen = false;
      windowsSignal.set(newWindows);
    });

    wb.on('resize', () => {
      const newWindows = new Map(windowsSignal());
      const e = newWindows.get(id);
      if (e) e.firstOpen = false;
      windowsSignal.set(newWindows);
    });
  };

  const minimize = (id: string): void => {
    const entry = windowsSignal().get(id);
    if (!entry || entry.minimized || entry.loading) return;

    entry.winbox!.hide();

    const newWindows = new Map(windowsSignal());
    const e = newWindows.get(id);
    if (e) {
      e.minimized = true;
      e.active = false;
    }
    windowsSignal.set(newWindows);
    activeWindowIdSignal.set(null);
    updateSidebarState();
  };

  const restore = (id: string): void => {
    const entry = windowsSignal().get(id);
    if (!entry || entry.loading) return;

    if (entry.firstOpen) {
      const sidebarWidth = 240;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const windowWidth = viewportWidth - sidebarWidth;
      entry.winbox!.resize(windowWidth, viewportHeight);
      entry.winbox!.move(sidebarWidth, 0);
    }

    entry.winbox!.show();
    entry.winbox!.focus();

    const newWindows = new Map(windowsSignal());
    const e = newWindows.get(id);
    if (e) {
      e.minimized = false;
      e.active = true;
      e.firstOpen = false;
    }
    windowsSignal.set(newWindows);
    activeWindowIdSignal.set(id);
    updateSidebarState();
  };

  const focus = (id: string): void => {
    const entry = windowsSignal().get(id);
    if (!entry || entry.loading) return;

    entry.winbox!.show();
    entry.winbox!.focus();

    const newWindows = new Map(windowsSignal());
    for (const [wid, e] of newWindows) {
      e.active = wid === id;
      e.minimized = false;
    }
    windowsSignal.set(newWindows);
    activeWindowIdSignal.set(id);
    updateSidebarState();
  };

  const toggle = (id: string): void => {
    const entry = windowsSignal().get(id);
    if (!entry || entry.loading) return;

    if (entry.minimized || !entry.active) {
      restore(id);
    } else {
      minimize(id);
    }
  };

  const close = (id: string): void => {
    const entry = windowsSignal().get(id);
    if (entry) {
      if (entry.winbox) {
        entry.winbox.close();
      } else {
        const newWindows = new Map(windowsSignal());
        newWindows.delete(id);
        windowsSignal.set(newWindows);
        activeWindowIdSignal.set(null);
        updateSidebarState();
      }
    }
  };

  const minimizeAll = (): void => {
    for (const [id, entry] of windowsSignal()) {
      if (!entry.minimized && !entry.loading) {
        minimize(id);
      }
    }
  };

  const setSidebarWidth = (width: number): void => {
    const newWindows = new Map(windowsSignal());
    for (const [id, entry] of newWindows) {
      entry.firstOpen = true;
    }
    windowsSignal.set(newWindows);
  };

  return {
    windows: windowsSignal,
    activeId: activeWindowIdSignal,
    getAll,
    getActiveId,
    open,
    minimize,
    restore,
    focus,
    toggle,
    close,
    minimizeAll,
    setSidebarWidth,
  };
};

const windowManager = createWindowManager();

// Create a keyed window item for efficient reconciliation
const createWindowItem = (entry: WindowEntry, isActive: boolean): TemplateNode => {
  const borderLeft = isActive ? '3px solid #27c93f' : '1px solid var(--border)';
  const bg = isActive ? '#333' : 'var(--bg-card)';
  const opacity = entry.loading || entry.minimized ? '0.8' : '1';

  return h(
    'div',
    {
      key: entry.id, // Key for efficient reconciliation
      className: 'dock-item',
      style: `padding: 10px 12px; background: ${bg}; border: ${borderLeft}; border-radius: 6px; cursor: pointer; transition: all 0.15s ease; margin-bottom: 6px; opacity: ${opacity};`,
      'data-window-id': entry.id,
      onClick: () => windowManager.toggle(entry.id),
    },
    [
      h(
        'span',
        {
          style:
            'display: block; font-size: 0.85em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
        },
        entry.title
      ),
    ]
  );
};

// Consistent container structure for sidebar dock
const createSidebarDock = (): TemplateNode => {
  const windows = windowManager.getAll();
  const activeId = windowManager.getActiveId();

  // Always return a div container with consistent structure
  // Empty state or populated state both use the same container type
  const children =
    windows.length === 0
      ? [
          h(
            'div',
            {
              className: 'dock-empty',
              style: 'padding: 20px; text-align: center;',
            },
            [
              h(
                'span',
                { style: 'font-size: 2em; opacity: 0.5; display: block; margin-bottom: 8px;' },
                '□'
              ),
              h(
                'span',
                { style: 'font-size: 0.85em; color: var(--text-secondary);' },
                'No windows'
              ),
            ]
          ),
        ]
      : windows.map((entry) => {
          const isActive = entry.id === activeId && !entry.minimized && !entry.loading;
          return createWindowItem(entry, isActive);
        });

  return h(
    'div',
    {
      key: 'dock-container', // Consistent key for reconciliation
      style: 'flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;',
    },
    children
  );
};

// Home button component with reactive active state
const createHomeButton = (isActive: boolean): TemplateNode => {
  const bg = isActive ? 'rgba(39, 201, 63, 0.2)' : 'transparent';
  const borderLeft = isActive ? '3px solid #27c93f' : '1px solid transparent';

  return h(
    'button',
    {
      className: 'sidebar-home',
      id: 'sidebar-home',
      style: `display: flex; align-items: center; gap: 8px; padding: 12px; background: ${bg}; border: ${borderLeft}; border-radius: 6px; color: inherit; cursor: pointer; width: 100%; text-align: left; transition: all 0.15s ease;`,
      onClick: () => {
        windowManager.minimizeAll();
        // Main view is always visible behind windows, just need to ensure all minimized
      },
    },
    [h('span', { style: 'font-size: 1.1em;' }, '⌂'), h('span', {}, 'Home')]
  );
};

// Create sidebar with proper structure
const createSidebar = (homeActive: boolean, windowCount: number): TemplateNode => {
  return h('aside', { className: 'sidebar' }, [
    createHomeButton(homeActive),
    h(
      'div',
      {
        style: 'flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden;',
      },
      [
        h(
          'div',
          {
            style:
              'display: flex; align-items: center; justify-content: space-between; padding: 10px 4px; font-size: 0.7em; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); border-bottom: 1px solid var(--border); margin-bottom: 8px;',
          },
          [
            h('span', {}, 'Windows'),
            h(
              'span',
              {
                id: 'window-count',
                style:
                  'background: var(--accent); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.85em;',
              },
              String(windowCount)
            ),
          ]
        ),
        createSidebarDock(),
      ]
    ),
  ]);
};

const createTopicCard = (
  useCase: UseCase,
  searchTerm: string,
  activeTab: string
): TemplateNode | null => {
  if (!useCase.matchesSearch(searchTerm)) return null;
  if (activeTab !== 'all' && useCase.config.category !== activeTab) return null;

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
      className: 'topic-card',
      'data-id': useCase.config.id,
      style:
        'display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s ease;',
      onClick: () => {
        const config = useCase.getWindowConfig();
        const content = useCase.generateContent();
        windowManager.open(useCase.config.id, config.title, content);
      },
    },
    [
      h(
        'div',
        {
          className: 'card-icon',
          style: 'font-size: 1.5em; color: var(--accent);',
        },
        icons[useCase.config.category] || '●'
      ),
      h('div', { className: 'card-text' }, [
        h(
          'h3',
          { style: 'margin: 0 0 4px 0; font-size: 1em; font-weight: 600;' },
          useCase.config.title
        ),
        h(
          'span',
          {
            className: 'card-tag',
            style:
              'display: inline-block; font-size: 0.75em; padding: 2px 8px; background: var(--bg-secondary); border-radius: 4px; color: var(--text-secondary);',
          },
          useCase.config.category
        ),
      ]),
    ]
  );
};

const createCardsGrid = (
  useCases: UseCase[],
  searchTerm: string,
  activeTab: string
): TemplateNode => {
  const filtered = useCases.filter(
    (u) => u.matchesSearch(searchTerm) && (activeTab === 'all' || u.config.category === activeTab)
  );

  if (filtered.length === 0) {
    return h(
      'div',
      {
        className: 'empty-msg',
        style: 'padding: 40px; text-align: center; color: var(--text-secondary);',
      },
      'No topics found'
    );
  }

  return h(
    'div',
    {
      className: 'cards-grid',
      style:
        'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;',
    },
    filtered
      .map((useCase) => createTopicCard(useCase, searchTerm, activeTab))
      .filter(Boolean) as TemplateNode[]
  );
};

const createTabButton = (label: string, isActive: boolean, onClick: () => void): TemplateNode => {
  return h(
    'button',
    {
      className: `tab-btn ${isActive ? 'active' : ''}`,
      style: `padding: 6px 12px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 0.85em; transition: all 0.15s ease; background: ${isActive ? 'var(--accent)' : 'transparent'}; color: ${isActive ? 'white' : 'inherit'};`,
      onClick,
    },
    label
  );
};

const createMainView = (state: AppState, useCases: UseCase[]): TemplateNode => {
  const categories = [...new Set(useCases.map((u) => u.config.category))];

  return h(
    'main',
    {
      className: 'main-view',
      style: 'flex: 1; overflow-y: auto; padding: 20px; background: var(--bg-primary);',
    },
    [
      h('div', { className: 'main-container', style: 'max-width: 1200px; margin: 0 auto;' }, [
        h('div', { style: 'margin-bottom: 16px;' }, [
          h('input', {
            type: 'text',
            className: 'search-input',
            placeholder: 'Search topics...',
            value: state.searchTerm,
            style:
              'width: 100%; padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-card); color: inherit; font-size: 1em; outline: none;',
            onInput: (e: Event) => {
              const target = e.target as HTMLInputElement;
              state.searchTerm = target.value;
            },
          }),
        ]),
        h('div', { className: 'filter-tabs', style: 'margin-bottom: 16px;' }, [
          h('div', { style: 'display: flex; flex-wrap: wrap; gap: 8px;' }, [
            createTabButton('All', state.activeTab === 'all', () => {
              state.activeTab = 'all';
            }),
            ...categories.map((cat) =>
              createTabButton(
                cat.charAt(0).toUpperCase() + cat.slice(1),
                state.activeTab === cat,
                () => {
                  state.activeTab = cat;
                }
              )
            ),
          ]),
        ]),
        createCardsGrid(useCases, state.searchTerm, state.activeTab),
      ]),
    ]
  );
};

class HomePage {
  private appElement: HTMLElement;
  private state: AppState;
  private useCases: UseCase[];
  private rootNode: TemplateNode | null = null;
  private cleanup: (() => void) | null = null;
  private sidebarWidth = 240;
  private sidebarNode: TemplateNode | null = null;
  private mainViewNode: TemplateNode | null = null;
  private unsubscribeEffects: (() => void)[] = [];

  constructor(element: HTMLElement) {
    this.appElement = element;
    this.state = {
      searchTerm: '',
      activeTab: 'all',
      sidebarWidth: this.sidebarWidth,
    };
    this.useCases = useCaseRegistry.getAll();

    this.init();
  }

  private init(): void {
    // Create initial layout
    this.rootNode = this.createAppLayout();
    this.cleanup = mount(this.rootNode, this.appElement);

    // Store references to child nodes for targeted updates
    this.sidebarNode = this.rootNode.children?.[0] || null;
    this.mainViewNode = this.rootNode.children?.[1] || null;

    // Set up reactive effect for sidebar updates
    const sidebarEffect = effect(() => {
      const { allMinimized, windowCount } = sidebarState();
      this.updateSidebar(allMinimized, windowCount);
    });

    this.unsubscribeEffects.push(sidebarEffect.cleanup || (() => {}));

    // Set initial sidebar width
    windowManager.setSidebarWidth(this.sidebarWidth);
  }

  private createAppLayout(): TemplateNode {
    const { allMinimized, windowCount } = sidebarState();

    return h(
      'div',
      {
        className: 'app-layout',
        style:
          'display: flex; height: 100vh; overflow: hidden; background: var(--bg-primary); color: var(--text-primary);',
      },
      [createSidebar(allMinimized, windowCount), createMainView(this.state, this.useCases)]
    );
  }

  private updateSidebar(allMinimized: boolean, windowCount: number): void {
    if (!this.sidebarNode) return;

    // Create new sidebar with updated state
    const newSidebarNode = createSidebar(allMinimized, windowCount);

    // Reconcile only the sidebar, preserving the main view
    reconcile(this.sidebarNode, newSidebarNode);

    // Update the reference
    this.sidebarNode = newSidebarNode;

    // Also update the root node's children reference
    if (this.rootNode && this.rootNode.children) {
      this.rootNode.children[0] = newSidebarNode;
    }
  }

  public destroy(): void {
    // Clean up all effects
    for (const unsub of this.unsubscribeEffects) {
      unsub();
    }
    this.unsubscribeEffects = [];

    // Clean up main render
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }

    // Clean up window manager
    const windows = windowManager.getAll();
    for (const w of windows) {
      windowManager.close(w.id);
    }

    this.rootNode = null;
    this.sidebarNode = null;
    this.mainViewNode = null;
  }
}

export default HomePage;
