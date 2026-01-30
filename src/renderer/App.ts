import 'winbox/dist/css/winbox.min.css';
import WinBox from 'winbox/src/js/winbox';
import { menuData } from './components/menu-data';
import { generateTheme, generateWindowContent } from './components/window-generator';
import { fuzzySearch } from './lib/fuzzy-search';
import type { MenuItem } from './types/menu-item';
import DomUtils from './lib/dom-utils';
import AsyncUtils from './lib/async-utils';

class App {
  private appElement: HTMLElement;
  private searchTerm: string = '';

  constructor(appElement: HTMLElement) {
    this.appElement = appElement;
  }

  public init(): void {
    this.render();
    this.bindEvents();
  }

  private render(): void {
    // Create the main application structure using DOM utilities
    const appContainer = DomUtils.createElement('div', { className: 'App' });
    const mainSection = DomUtils.createElement('main', { className: 'App-main-no-navbar' });
    const searchContainer = DomUtils.createElement('div', {
      className: 'search-container-no-navbar',
    });
    const searchInput = DomUtils.createElement('input', {
      type: 'text',
      className: 'search-input',
      placeholder: 'Search topics...',
      value: this.searchTerm,
    });
    const cardsContainer = DomUtils.createElement('div', {
      className: 'cards-list',
      id: 'cards-list',
    });

    // Render cards content
    cardsContainer.innerHTML = this.renderCards();

    // Assemble the DOM structure
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(cardsContainer);
    mainSection.appendChild(searchContainer);

    const footer = DomUtils.createElement('footer', { className: 'App-footer' });
    const footerText = DomUtils.createElement('p', {}, [
      'Get started by editing ',
      DomUtils.createElement('code', {}, ['src/App.ts']),
      ' and save to reload.',
    ]);
    footer.appendChild(footerText);

    appContainer.appendChild(mainSection);
    appContainer.appendChild(footer);

    // Clear and append the new structure
    this.appElement.innerHTML = '';
    this.appElement.appendChild(appContainer);
  }

  private renderCards(): string {
    // Filter cards based on search term
    const filteredCards = menuData.filter((card: MenuItem) => {
      const titleMatch = fuzzySearch(card.title, this.searchTerm).matches;
      return titleMatch;
    });

    if (filteredCards.length === 0) {
      return '<div class="no-results">No matching topics found</div>';
    }

    return filteredCards
      .map((card: MenuItem, index: number) => {
        // Process title for highlighting
        const processedTitle = fuzzySearch(card.title, this.searchTerm);

        return `
        <div class="simple-card card-${index}" data-index="${index}" data-title="${card.title}">
          <h3 class="simple-card-title">${processedTitle.matches ? processedTitle.highlightedText : card.title}</h3>
        </div>
      `;
      })
      .join('');
  }

  private bindEvents(): void {
    // Use debounced search to improve performance
    const debouncedSearch = AsyncUtils.debounce((value: string) => {
      this.searchTerm = value;
      this.render(); // Re-render the cards based on search term
      this.bindEvents(); // Re-bind events after re-rendering
    }, 300);

    // Bind search input event
    const searchInput = DomUtils.querySelector(
      '.search-input',
      this.appElement
    ) as HTMLInputElement;
    if (searchInput) {
      // Use the debounced version
      searchInput.addEventListener('input', (event) => {
        const value = (event.target as HTMLInputElement).value;
        debouncedSearch(value);
      });
    }

    // Bind card click events
    const cards = DomUtils.querySelectorAll('.simple-card', this.appElement);
    cards.forEach((card, index) => {
      // Use event delegation for better performance
      card.addEventListener('click', () => {
        this.handleCardClick(index);
      });
    });
  }

  private handleCardClick(index: number): void {
    const card = menuData[index];
    if (!card) return;

    const { title } = card;

    // Define different themes for variety
    const themes = [
      { name: 'blue', bg: '#4a6cf7', color: 'white' },
      { name: 'green', bg: '#4ade80', color: 'black' },
      { name: 'purple', bg: '#a78bfa', color: 'white' },
      { name: 'red', bg: '#f87171', color: 'white' },
      { name: 'yellow', bg: '#fbbf24', color: 'black' },
      { name: 'indigo', bg: '#6366f1', color: 'white' },
    ];

    // Select a theme based on the index to have consistent colors
    const _theme = themes[index % themes.length];

    // Generate dynamic content and theme based on the title
    const dynamicContent = generateWindowContent(title);
    const windowTheme = generateTheme(title);

    // Create a WinBox window with the generated content
    const winbox = new WinBox({
      title: title,
      html: `<div class="winbox-content"><h3 style="color: ${windowTheme.color};">${title}</h3><div style="color: ${windowTheme.color};" class="winbox-dynamic-content">Loading content...</div></div>`,
      width: '500px',
      height: '400px',
      x: 'center',
      y: 'center',
      class: 'modern',
      background: windowTheme.bg,
      border: 4,
    });

    // Set the content after the window is created using WinBox's body property
    // Use async utilities for better timing
    AsyncUtils.delay(10).then(() => {
      if (winbox?.body) {
        const contentDiv = DomUtils.querySelector('.winbox-dynamic-content', winbox.body);
        if (contentDiv) {
          contentDiv.innerHTML = dynamicContent;
        } else {
          // If we can't find the specific div, replace all content in the body
          winbox.body.innerHTML = `<div class="winbox-content"><h3 style="color: ${windowTheme.color};">${title}</h3><div style="color: ${windowTheme.color};">${dynamicContent}</div></div>`;
        }
      }
    });
  }
}

export default App;
