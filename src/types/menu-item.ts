// Define TypeScript interface for menu items
export interface MenuItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export interface FuzzySearchResult {
  matches: boolean;
  highlightedText: string;
}