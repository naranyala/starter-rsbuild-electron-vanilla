import 'winbox/dist/css/winbox.min.css';
import WinBox from 'winbox/src/js/winbox';
import AsyncUtils from './lib/async-utils';
import DomUtils from './lib/dom-utils';
import { fuzzySearch } from './lib/fuzzy-search';
import type { UseCase } from './use-cases';
import { useCaseRegistry } from './use-cases';

class App {
  private appElement: HTMLElement;
  private searchTerm: string = '';
  private useCases: UseCase[] = [];

  constructor(appElement: HTMLElement) {
    this.appElement = appElement;
    // Load all use cases from registry
    this.useCases = useCaseRegistry.getAll();
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

    // Render cards content based on use cases
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
    // Filter use cases based on search term
    const filteredUseCases = this.useCases.filter((useCase: UseCase) => {
      return useCase.matchesSearch(this.searchTerm);
    });

    if (filteredUseCases.length === 0) {
      return '<div class="no-results">No matching topics found</div>';
    }

    return filteredUseCases
      .map((useCase: UseCase, index: number) => {
        // Process title for highlighting
        const processedTitle = fuzzySearch(useCase.config.title, this.searchTerm);

        return `
        <div class="simple-card card-${index}" data-index="${index}" data-id="${useCase.config.id}" data-title="${useCase.config.title}">
          <h3 class="simple-card-title">${processedTitle.matches ? processedTitle.highlightedText : useCase.config.title}</h3>
          <span class="simple-card-category">${useCase.config.category}</span>
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
      // Get the use case ID from the data attribute
      const useCaseId = card.getAttribute('data-id');
      if (useCaseId) {
        card.addEventListener('click', () => {
          this.handleCardClick(useCaseId);
        });
      }
    });
  }

  private handleCardClick(useCaseId: string): void {
    // Find the use case from registry
    const useCase = useCaseRegistry.get(useCaseId);
    if (!useCase) return;

    // Get window configuration from use case
    const windowConfig = useCase.getWindowConfig();

    // Create a WinBox window with the use case configuration
    const winbox = new WinBox({
      title: windowConfig.title,
      html: useCase.getInitialHtml(),
      width: windowConfig.width,
      height: windowConfig.height,
      x: windowConfig.x,
      y: windowConfig.y,
      class: windowConfig.class,
      background: windowConfig.background,
      border: windowConfig.border,
    });

    // Set the content after the window is created using WinBox's body property
    // Use async utilities for better timing
    AsyncUtils.delay(10).then(() => {
      if (winbox?.body) {
        const contentDiv = DomUtils.querySelector('.winbox-dynamic-content', winbox.body);
        if (contentDiv) {
          contentDiv.innerHTML = useCase.generateContent();
        } else {
          // If we can't find the specific div, replace all content in the body
          winbox.body.innerHTML = useCase.getFullHtml();
        }
      }
    });
  }
}

export default App;
