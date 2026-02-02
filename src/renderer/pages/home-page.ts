import 'winbox/dist/css/winbox.min.css';
import WinBox from 'winbox/src/js/winbox';
import { useCaseRegistry } from '../features/electron-info';
import { AsyncUtils } from '../utils/async-utils';
import { DomUtils } from '../utils/dom-utils';
import type { UseCase } from './features/electron-info';

class HomePage {
  private appElement: HTMLElement;
  private searchTerm = '';
  private activeTab = 'all';
  private useCases: UseCase[] = [];
  private windowMap = new Map<string, WinBox>();
  private eventsAttached = false;

  constructor(appElement: HTMLElement) {
    this.appElement = appElement;
    this.useCases = useCaseRegistry.getAll();
  }

  public init(): void {
    this.render();
  }

  private render(): void {
    if (this.appElement.querySelector('.App') === null) {
      this.createUI();
    } else {
      this.updateCards();
    }
  }

  private createUI(): void {
    const app = document.createElement('div');
    app.className = 'App';
    app.innerHTML = `
      <main class="App-main-no-navbar">
        <div class="search-container-no-navbar">
          <input type="text" class="search-input" placeholder="Search topics..." value="${this.searchTerm}">
          <div class="tab-filter-wrapper">
            <div class="tab-filter-container">
              ${this.renderTabs()}
            </div>
          </div>
          <div class="cards-list">${this.renderCards()}</div>
        </div>
      </main>
      <footer class="App-footer">
        <p>Get started by editing <code>src/renderer/pages/home-page.ts</code> and save to reload.</p>
      </footer>
    `;
    this.appElement.innerHTML = '';
    this.appElement.appendChild(app);
    this.attachEvents();
  }

  private renderTabs(): string {
    const categories = [...new Set(this.useCases.map((u) => u.config.category))];
    const allActive = this.activeTab === 'all' ? 'active' : '';
    let html = `<button class="tab-button ${allActive}" data-tab="all">All</button>`;
    for (const cat of categories) {
      const active = this.activeTab === cat ? 'active' : '';
      html += `<button class="tab-button ${active}" data-tab="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</button>`;
    }
    return html;
  }

  private renderCards(): string {
    let filtered = this.useCases.filter((u) => u.matchesSearch(this.searchTerm));
    if (this.activeTab !== 'all') {
      filtered = filtered.filter((u) => u.config.category === this.activeTab);
    }
    if (filtered.length === 0) return '<div class="no-results">No matching topics found</div>';
    return filtered
      .map(
        (u, i) => `
      <div class="simple-card" data-id="${u.config.id}">
        <div class="simple-card-header">
          ${this.getIcon(u.config.category)}
          <h3 class="simple-card-title">${u.config.title}</h3>
        </div>
        <span class="simple-card-category">${u.config.category}</span>
      </div>
    `
      )
      .join('');
  }

  private getIcon(category: string): string {
    const icons: Record<string, string> = {
      framework:
        '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
      security:
        '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>',
      api: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M14.6 16.6l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>',
      performance:
        '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 3.21-1.92 6-4.72 7.28z"/></svg>',
      packaging:
        '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/></svg>',
      development:
        '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4z"/></svg>',
      maintenance:
        '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3z"/></svg>',
      architecture:
        '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M4 4h7v7H4V4zm0 9h7v7H4v-7zm9-9h7v7h-7V4zm0 9h7v7h-7v-7z"/></svg>',
    };
    return (
      icons[category] ||
      '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><circle cx="12" cy="12" r="10"/></svg>'
    );
  }

  private updateCards(): void {
    const container = this.appElement.querySelector('.cards-list');
    if (container) container.innerHTML = this.renderCards();
    const search = this.appElement.querySelector('.search-input') as HTMLInputElement;
    if (search) search.value = this.searchTerm;
    document.querySelectorAll('.tab-button').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === this.activeTab);
    });
  }

  private attachEvents(): void {
    // Only attach events once to prevent duplicates
    if (this.eventsAttached) return;

    const search = this.appElement.querySelector('.search-input') as HTMLInputElement;
    search?.addEventListener('input', (e) => {
      this.searchTerm = (e.target as HTMLInputElement).value;
      this.render();
    });

    this.appElement.querySelectorAll('.tab-button').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.getAttribute('data-tab') || 'all';
        this.render();
      });
    });

    this.appElement.querySelector('.cards-list')?.addEventListener('click', (e) => {
      const card = (e.target as HTMLElement).closest('.simple-card');
      if (card) {
        const id = card.getAttribute('data-id');
        if (id) this.openWindow(id);
      }
    });

    this.eventsAttached = true;
  }

  private openWindow(id: string): void {
    // Check if window already exists
    const existing = this.windowMap.get(id);
    if (existing) {
      // Bring existing window to front and focus
      existing.focus();
      return;
    }

    const useCase = useCaseRegistry.get(id);
    if (!useCase) return;

    const config = useCase.getWindowConfig();
    const content = useCase.generateContent();

    // Create new WinBox window
    const wb = new WinBox({
      title: config.title,
      width: config.width,
      height: config.height,
      x: config.x,
      y: config.y,
      class: 'custom-winbox',
      background: '#252525',
      border: config.border,
    });

    // Store reference to the window
    this.windowMap.set(id, wb);

    // Set up close handler to remove from map
    wb.on('close', () => {
      this.windowMap.delete(id);
    });

    // Add content to the window body
    wb.body.innerHTML = `<div class="winbox-content"><h3>${useCase.config.title}</h3>${content}</div>`;
  }
}

export default HomePage;
