/**
 * Window Store - Reactive store for managing active windows
 */

import { type Signal, effect, signal } from '../../frontend/lib/reactivity';

export interface WindowEntry {
  id: string;
  title: string;
  winbox: any;
  minimized: boolean;
  active: boolean;
  firstOpen: boolean;
  openedAt: number;
  loading: boolean;
}

export interface WindowStore {
  windows: Signal<Map<string, WindowEntry>>;
  activeId: Signal<string | null>;
  sidebarState: Signal<{ allMinimized: boolean; windowCount: number }>;
  sidebarWidth: number;
  getAll: () => WindowEntry[];
  getActiveId: () => string | null;
  open: (id: string, title: string, content: string) => void;
  minimize: (id: string) => void;
  restore: (id: string) => void;
  focus: (id: string) => void;
  toggle: (id: string) => void;
  close: (id: string) => void;
  minimizeAll: () => void;
  setSidebarWidth: (width: number) => void;
}

export const createWindowStore = (): WindowStore => {
  const windowsSignal = signal<Map<string, WindowEntry>>(new Map());
  const activeWindowIdSignal = signal<string | null>(null);
  const sidebarWidth = 500;

  const sidebarStateSignal = signal<{ allMinimized: boolean; windowCount: number }>({
    allMinimized: true,
    windowCount: 0,
  });

  let WinBoxConstructor: any = null;
  let winboxLoaded = false;

  const loadWinBox = async (): Promise<void> => {
    if (winboxLoaded && WinBoxConstructor) return;

    try {
      const winboxModule = await import('winbox');
      // @ts-ignore
      WinBoxConstructor = winboxModule.default || winboxModule.WinBox || winboxModule;
      winboxLoaded = true;
      console.log('WinBox loaded successfully:', typeof WinBoxConstructor);
    } catch (error) {
      console.error('Failed to load WinBox:', error);
    }
  };

  effect(() => {
    const windows = Array.from(windowsSignal().values());
    const count = windows.length;
    const allMinimized = count === 0 || windows.every((w) => w.minimized);

    // Only update if values actually changed to prevent unnecessary re-renders
    const currentState = sidebarStateSignal();
    if (currentState.windowCount !== count || currentState.allMinimized !== allMinimized) {
      sidebarStateSignal.set({ allMinimized, windowCount: count });
    }
  });

  const getAll = (): WindowEntry[] => {
    return Array.from(windowsSignal().values()).sort((a, b) => a.openedAt - b.openedAt);
  };

  const getActiveId = (): string | null => activeWindowIdSignal();

  const open = async (id: string, title: string, content: string): Promise<void> => {
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

    await loadWinBox();

    if (!WinBoxConstructor) {
      console.error('WinBox constructor not available');
      const updatedWindows = new Map(windowsSignal());
      const updatedEntry = updatedWindows.get(id);
      if (updatedEntry) {
        updatedEntry.loading = false;
        windowsSignal.set(updatedWindows);
      }
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const windowWidth = viewportWidth - sidebarWidth;

    try {
      console.log('Creating WinBox window:', title, 'width:', windowWidth);

      const wb = new WinBoxConstructor({
        title: title,
        width: Math.min(windowWidth, 1200),
        height: viewportHeight - 50,
        x: sidebarWidth + 20,
        y: 20,
        class: 'app-window winbox-dark',
        background: '#1e1e2e',
        border: 4,
        max: false,
      });

      const contentHtml = `
        <div style="
          padding: 24px;
          height: 100%;
          overflow-y: auto;
          background: #1e1e2e;
          color: #e0e0e0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <h3 style="
            margin: 0 0 16px 0;
            font-size: 1.4em;
            font-weight: 600;
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 12px;
          ">${title}</h3>
          <div style="line-height: 1.7; font-size: 1em;">${content}</div>
        </div>
      `;

      document.body.appendChild(wb.element);
      wb.body.innerHTML = contentHtml;
      wb.show();

      const updatedWindows = new Map(windowsSignal());
      const updatedEntry = updatedWindows.get(id);
      if (updatedEntry) {
        updatedEntry.winbox = wb;
        updatedEntry.loading = false;
        windowsSignal.set(updatedWindows);
      }

      const currentEntry = windowsSignal().get(id);
      if (currentEntry) {
        bindEvents(id, wb, currentEntry);
        focus(id);
      }

      console.log('WinBox window created successfully');
    } catch (error) {
      console.error('Failed to create WinBox window:', error);
      const updatedWindows = new Map(windowsSignal());
      const updatedEntry = updatedWindows.get(id);
      if (updatedEntry) {
        updatedEntry.loading = false;
        windowsSignal.set(updatedWindows);
      }
    }
  };

  const bindEvents = (id: string, wb: any, entry: WindowEntry): void => {
    wb.on('close', () => {
      const newWindows = new Map(windowsSignal());
      newWindows.delete(id);
      windowsSignal.set(newWindows);
      if (activeWindowIdSignal() === id) {
        activeWindowIdSignal.set(null);
      }
    });

    wb.on('minimize', (e: Event) => {
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

    if (entry.winbox) {
      entry.winbox.hide();
    }

    const newWindows = new Map(windowsSignal());
    const e = newWindows.get(id);
    if (e) {
      e.minimized = true;
      e.active = false;
    }
    windowsSignal.set(newWindows);
    if (activeWindowIdSignal() === id) {
      activeWindowIdSignal.set(null);
    }
  };

  const restore = (id: string): void => {
    const entry = windowsSignal().get(id);
    if (!entry || entry.loading) return;

    if (entry.winbox) {
      if (entry.firstOpen) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const windowWidth = viewportWidth - sidebarWidth;
        entry.winbox.resize(windowWidth, viewportHeight);
        entry.winbox.move(sidebarWidth, 0);
      }

      entry.winbox.show();
      entry.winbox.focus();
      entry.winbox.maximize();
    }

    const newWindows = new Map(windowsSignal());
    const e = newWindows.get(id);
    if (e) {
      e.minimized = false;
      e.active = true;
      e.firstOpen = false;
    }
    windowsSignal.set(newWindows);
    activeWindowIdSignal.set(id);
  };

  const focus = (id: string): void => {
    const entry = windowsSignal().get(id);
    if (!entry || entry.loading) return;

    if (entry.winbox) {
      entry.winbox.show();
      entry.winbox.focus();
      entry.winbox.maximize();
    }

    const currentWindows = windowsSignal();
    const hasChanges = Array.from(currentWindows.entries()).some(([wid, e]) => {
      return (wid === id && (!e.active || e.minimized)) ||
             (wid !== id && (e.active || !e.minimized));
    });

    if (!hasChanges) {
      // No actual changes needed, just update active ID
      activeWindowIdSignal.set(id);
      return;
    }

    const newWindows = new Map(currentWindows);
    for (const [wid, e] of newWindows) {
      e.active = wid === id;
      e.minimized = wid !== id;
    }
    windowsSignal.set(newWindows);
    activeWindowIdSignal.set(id);
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
        if (activeWindowIdSignal() === id) {
          activeWindowIdSignal.set(null);
        }
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

  const setSidebarWidth = (_width: number): void => {
    const newWindows = new Map(windowsSignal());
    for (const [id, entry] of newWindows) {
      entry.firstOpen = true;
    }
    windowsSignal.set(newWindows);
  };

  return {
    windows: windowsSignal,
    activeId: activeWindowIdSignal,
    sidebarState: sidebarStateSignal,
    sidebarWidth,
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
