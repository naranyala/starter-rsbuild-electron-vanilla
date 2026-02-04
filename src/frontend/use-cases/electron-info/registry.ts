import type { UseCase } from './types';

// Registry to manage all use cases
class UseCaseRegistry {
  private useCases: Map<string, UseCase> = new Map();

  // Register a use case
  register(useCase: UseCase): void {
    this.useCases.set(useCase.config.id, useCase);
  }

  // Get a use case by ID
  get(id: string): UseCase | undefined {
    return this.useCases.get(id);
  }

  // Get all use cases
  getAll(): UseCase[] {
    return Array.from(this.useCases.values());
  }

  // Search use cases by query
  search(query: string): UseCase[] {
    if (!query.trim()) {
      return this.getAll();
    }
    return this.getAll().filter((useCase) => useCase.matchesSearch(query));
  }

  // Get use cases by category
  getByCategory(category: string): UseCase[] {
    return this.getAll().filter((useCase) => useCase.config.category === category);
  }

  // Get all unique categories
  getCategories(): string[] {
    const categories = new Set<string>();
    for (const useCase of this.useCases.values()) {
      categories.add(useCase.config.category);
    }
    return Array.from(categories);
  }
}

// Export singleton instance
export const useCaseRegistry = new UseCaseRegistry();
