import 'winbox/dist/css/winbox.min.css';
import WinBox from 'winbox/src/js/winbox';
import { menuData } from './lib/renderer/menu-data';
import { generateWindowContent, generateTheme } from './lib/renderer/window-generator';

// Define TypeScript interfaces
interface MenuItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

interface FuzzySearchResult {
  matches: boolean;
  highlightedText: string;
}

// Simple fuzzy search function
const fuzzySearch = (text: string, query: string): FuzzySearchResult => {
  if (!query) return { matches: true, highlightedText: text };

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let matchFound = true;
  let highlightedText = '';
  let queryIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const lowerChar = char.toLowerCase();

    if (queryIndex < lowerQuery.length && lowerChar === lowerQuery[queryIndex]) {
      highlightedText += `<mark>${char}</mark>`;
      queryIndex++;
    } else {
      highlightedText += char;
    }
  }

  // Check if all query characters were found in sequence
  matchFound = queryIndex === lowerQuery.length;

  return { matches: matchFound, highlightedText };
};

class App {
  private appElement: HTMLElement;
  private searchTerm: string = '';

  constructor(appElement: HTMLElement) {
    this.appElement = appElement;
  }

  public init(): void {
    this.render();
    this.bindEvents();
    // Trigger the fade-in animation after a brief delay to ensure content is rendered
    // The CSS animation will handle the fade-in, but we ensure it's triggered
    setTimeout(() => {
      const appDiv = this.appElement.querySelector('.App');
      if (appDiv) {
        // Remove the inline style to allow CSS animation to work properly
        appDiv.style.removeProperty('opacity');
      }
    }, 10);
  }

  private render(): void {
    // Create the main application structure
    this.appElement.innerHTML = `
      <div class="App">
        <main class="App-main-no-navbar">
          <div class="search-container-no-navbar">
            <input
              type="text"
              class="search-input"
              placeholder="Search topics..."
              value="${this.searchTerm}"
            />
            <div class="cards-list" id="cards-list">
              ${this.renderCards()}
            </div>
          </div>
        </main>
        <footer class="App-footer">
          <p>Get started by editing <code>src/App.ts</code> and save to reload.</p>
        </footer>
      </div>
    `;
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

    return filteredCards.map((card: MenuItem, index: number) => {
      // Process title for highlighting
      const processedTitle = fuzzySearch(card.title, this.searchTerm);
      
      return `
        <div class="simple-card card-${index}" data-index="${index}" data-title="${card.title}">
          <h3 class="simple-card-title">${processedTitle.matches ? processedTitle.highlightedText : card.title}</h3>
        </div>
      `;
    }).join('');
  }

  private bindEvents(): void {
    // Bind search input event
    const searchInput = this.appElement.querySelector('.search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        this.searchTerm = (event.target as HTMLInputElement).value;
        this.render(); // Re-render the cards based on search term
        this.bindEvents(); // Re-bind events after re-rendering
      });
    }

    // Bind card click events
    const cards = this.appElement.querySelectorAll('.simple-card');
    cards.forEach((card, index) => {
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
    const theme = themes[index % themes.length];

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
    setTimeout(() => {
      if (winbox && winbox.body) {
        const contentDiv = winbox.body.querySelector('.winbox-dynamic-content');
        if (contentDiv) {
          contentDiv.innerHTML = dynamicContent;
        } else {
          // If we can't find the specific div, replace all content in the body
          winbox.body.innerHTML = `<div class="winbox-content"><h3 style="color: ${windowTheme.color};">${title}</h3><div style="color: ${windowTheme.color};">${dynamicContent}</div></div>`;
        }
      }
    }, 10);
  }
}

export default App;