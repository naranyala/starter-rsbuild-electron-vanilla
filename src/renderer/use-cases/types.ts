// Base interface for all use cases
export interface UseCaseConfig {
  id: string;
  title: string;
  category: string;
  tags: string[];
}

export interface WindowTheme {
  name: string;
  bg: string;
  color: string;
}

export interface WindowConfig {
  title: string;
  width: string;
  height: string;
  x: string;
  y: string;
  class: string;
  background: string;
  border: number;
}

export abstract class UseCase {
  abstract config: UseCaseConfig;
  abstract theme: WindowTheme;

  // Generate window configuration
  getWindowConfig(): WindowConfig {
    return {
      title: this.config.title,
      width: '500px',
      height: '400px',
      x: 'center',
      y: 'center',
      class: 'modern',
      background: this.theme.bg,
      border: 4,
    };
  }

  // Generate the content HTML for the window
  abstract generateContent(): string;

  // Get the initial HTML before content is injected
  getInitialHtml(): string {
    return `<div class="winbox-content">
      <h3 style="color: ${this.theme.color};">${this.config.title}</h3>
      <div style="color: ${this.theme.color};" class="winbox-dynamic-content">
        Loading content...
      </div>
    </div>`;
  }

  // Get the full content HTML after generation
  getFullHtml(): string {
    const content = this.generateContent();
    return `<div class="winbox-content">
      <h3 style="color: ${this.theme.color};">${this.config.title}</h3>
      <div style="color: ${this.theme.color};">${content}</div>
    </div>`;
  }

  // Check if this use case matches a search query
  matchesSearch(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    const titleMatch = this.config.title.toLowerCase().includes(lowerQuery);
    const tagMatch = this.config.tags.some((tag) => tag.toLowerCase().includes(lowerQuery));
    const categoryMatch = this.config.category.toLowerCase().includes(lowerQuery);
    return titleMatch || tagMatch || categoryMatch;
  }
}
