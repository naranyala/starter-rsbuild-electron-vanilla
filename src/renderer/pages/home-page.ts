import 'winbox/dist/css/winbox.min.css';
import { effect } from '../../frontend/lib/simple-reactivity';
import { h, reactiveComponent } from '../../frontend/lib/ultra-simple-template';
import { globalStore, searchTermSignal, activeTabSignal } from '../../frontend/lib/global-store';
import { useCaseRegistry } from '../../frontend/use-cases/electron-info';
import type { UseCase } from '../../frontend/use-cases/electron-info';
import { type WindowEntry } from '../services/window-store';

let currentContainer: HTMLElement | null = null;
let mounted = false;

// Create a reactive component that re-renders the entire UI when signals change
export const initHomePage = (container: HTMLElement): void => {
  mounted = true;
  currentContainer = container;

  // Create the reactive component
  reactiveComponent(() => {
    // Get current values for rendering from the global store
    const searchTerm = globalStore.searchTerm;
    const searchTab = globalStore.activeTab;
    const useCases = useCaseRegistry.getAll();
    const windows = globalStore.windowManager.getAll();
    const activeId = globalStore.windowManager.getActiveId();
    const windowCount = globalStore.windowManager.sidebarState().windowCount;

    return createApp(searchTerm, searchTab, useCases, windows, activeId, windowCount);
  }, container);
};

const createWindowItem = (entry: WindowEntry, isActive: boolean) => {
  const borderLeft = isActive ? '3px solid #27c93f' : '1px solid rgba(255, 255, 255, 0.05)';
  const bg = isActive ? 'rgba(102, 126, 234, 0.15)' : 'rgba(255, 255, 255, 0.03)';
  return h(
    'div',
    {
      className: 'dock-item',
      style: {
        padding: '14px 18px',
        background: bg,
        border: borderLeft,
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        marginBottom: '6px'
      },
      onClick: () => globalStore.windowManager.focus(entry.id),
    },
    [
      h(
        'span',
        {
          style: {
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
        entry.loading ? '⏳' : entry.minimized ? '○' : '●'
      ),
      h(
        'span',
        {
          style: {
            flex: '1',
            fontSize: '0.9em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
        },
        entry.loading ? `${entry.title} (loading...)` : entry.title
      ),
    ]
  );
};

const createSidebarDock = (windows: WindowEntry[], activeId: string | null) => {
  if (windows.length === 0) {
    return h(
      'div',
      {
        className: 'dock-empty',
        style: {
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
        },
      },
      [
        h('span', { style: { fontSize: '2.5em', opacity: '0.4' } }, '□'),
        h(
          'span',
          { style: { display: 'block', marginTop: '12px', fontSize: '0.9em' } },
          'No windows open'
        ),
      ]
    );
  }
  return h(
    'div',
    {
      className: 'window-dock',
      style: {
        flex: '1',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        paddingRight: '8px',
      },
    },
    windows.map((entry) => {
      const isActive = entry.id === activeId && !entry.minimized && !entry.loading;
      return createWindowItem(entry, isActive);
    })
  );
};

const createSidebar = (
  windows: WindowEntry[],
  activeId: string | null,
  windowCount: number
) => {
  return h('aside', { className: 'sidebar' }, [
    h(
      'button',
      {
        className: 'sidebar-home',
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          background: 'linear-gradient(135deg, var(--accent) 0%, #764ba2 100%)',
          border: 'none',
          borderRadius: '10px',
          color: 'white',
          fontSize: '1.1em',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
        },
        onClick: () => globalStore.windowManager.minimizeAll(),
      },
      [h('span', { style: { fontSize: '1.2em' } }, '⌂'), h('span', {}, 'Home')]
    ),
    h(
      'div',
      { style: { flex: '1', display: 'flex', flexDirection: 'column', minHeight: '0', overflow: 'hidden' } },
      [
        h(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 4px',
              fontSize: '0.75em',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--text-secondary)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '12px',
            },
          },
          [
            h('span', {}, 'Windows'),
            h(
              'span',
              {
                className: 'window-count',
                style: {
                  background: 'var(--accent)',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.85em',
                },
              },
              String(windowCount)
            ),
          ]
        ),
        createSidebarDock(windows, activeId),
      ]
    ),
  ]);
};

const createTopicCard = (
  useCase: UseCase,
  searchTerm: string,
  activeTab: string
) => {
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
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '18px 20px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
      onClick: () => {
        const config = useCase.getWindowConfig();
        const content = useCase.generateContent();
        globalStore.windowManager.open(useCase.config.id, config.title, content);
      },
    },
    [
      h(
        'div',
        {
          style: {
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-panel)',
            borderRadius: '10px',
            fontSize: '1.3em',
            color: 'var(--accent)',
          },
        },
        icons[useCase.config.category] || '●'
      ),
      h('div', { style: { flex: '1' } }, [
        h(
          'h3',
          {
            style: {
              margin: '0 0 8px 0',
              fontSize: '1em',
              fontWeight: '600',
              color: 'var(--text-primary)',
            },
          },
          useCase.config.title
        ),
        h(
          'span',
          {
            style: {
              display: 'inline-block',
              fontSize: '0.7em',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '4px 10px',
              background: 'var(--bg-panel)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
            },
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
) => {
  const filtered = useCases.filter(
    (u) => u.matchesSearch(searchTerm) && (activeTab === 'all' || u.config.category === activeTab)
  );
  if (filtered.length === 0) {
    return h(
      'div',
      {
        className: 'empty-msg',
        style: {
          padding: '60px 20px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '1.1em',
        },
      },
      'No topics found'
    );
  }
  return h(
    'div',
    {
      className: 'cards-area',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
      },
    },
    filtered
      .map((useCase) => createTopicCard(useCase, searchTerm, activeTab))
      .filter(Boolean)
  );
};

const createTabButton = (label: string, isActive: boolean, onClick: () => void) => {
  return h(
    'button',
    {
      style: {
        padding: '10px 16px',
        border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '0.9em',
        background: isActive ? 'var(--accent)' : 'transparent',
        color: isActive ? 'white' : 'var(--text-secondary)',
        transition: 'all 0.2s ease',
      },
      onClick,
    },
    label
  );
};

const createMainView = (
  useCases: UseCase[],
  searchTerm: string,
  activeTab: string
) => {
  const categories = [...new Set(useCases.map((u) => u.config.category))];
  return h(
    'main',
    {
      className: 'main-view',
      style: {
        flex: '1',
        overflowY: 'auto',
        padding: '30px',
        background: 'var(--bg-dark)',
      },
    },
    [
      h('div', { className: 'main-container', style: { maxWidth: '1200px', margin: '0 auto' } }, [
        h('div', { style: { marginBottom: '24px' } }, [
          h('input', {
            type: 'text',
            placeholder: 'Search topics...',
            value: searchTerm,
            style: {
              width: '100%',
              padding: '14px 20px',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              background: 'var(--bg-card)',
              color: 'inherit',
              fontSize: '1em',
              outline: 'none',
              transition: 'all 0.2s ease',
            },
            onInput: (e: Event) => {
              const target = e.target as HTMLInputElement;
              globalStore.setSearchTerm(target.value);
            },
          }),
        ]),
        h(
          'div',
          {
            className: 'filter-tabs',
            style: {
              marginBottom: '24px',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '12px 16px',
            },
          },
          [
            h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '10px' } }, [
              createTabButton('All', activeTab === 'all', () => globalStore.setActiveTab('all')),
              ...categories.map((cat) =>
                createTabButton(cat.charAt(0).toUpperCase() + cat.slice(1), activeTab === cat, () =>
                  globalStore.setActiveTab(cat)
                )
              ),
            ]),
          ]
        ),
        createCardsGrid(useCases, searchTerm, activeTab),
      ]),
    ]
  );
};

const createApp = (
  searchTerm: string,
  activeTab: string,
  useCases: UseCase[],
  windows: WindowEntry[],
  activeId: string | null,
  windowCount: number
) => {
  return h(
    'div',
    {
      className: 'app-layout',
      style: {
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-dark)',
        color: 'var(--text-primary)',
      },
    },
    [
      createSidebar(windows, activeId, windowCount),
      createMainView(useCases, searchTerm, activeTab),
    ]
  );
};

export default { init: initHomePage };