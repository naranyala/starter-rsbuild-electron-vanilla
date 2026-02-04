// Global application store
import { signal } from './simple-reactivity';
import { type WindowEntry, type WindowStore, createWindowStore } from '../../renderer/services/window-store';

// Define the application state structure
interface AppState {
  searchTerm: string;
  activeTab: string;
  // Add other global state properties here
}

// Create the global store instance
class GlobalStore {
  // Signals for global state
  private state = {
    searchTerm: signal<string>(''),
    activeTab: signal<string>('all'),
  };

  // Window manager instance
  private _windowManager: WindowStore | null = null;

  constructor() {
    // Initialize window manager
    this._windowManager = createWindowStore();
  }

  // Getters for accessing state
  get searchTerm(): string {
    return this.state.searchTerm();
  }

  get activeTab(): string {
    return this.state.activeTab();
  }

  get windowManager(): WindowStore {
    if (!this._windowManager) {
      this._windowManager = createWindowStore();
    }
    return this._windowManager;
  }

  // Actions for updating state
  setSearchTerm(value: string): void {
    this.state.searchTerm.set(value);
  }

  setActiveTab(value: string): void {
    this.state.activeTab.set(value);
  }

  // Reset all state to initial values
  reset(): void {
    this.state.searchTerm.set('');
    this.state.activeTab.set('all');
  }

  // Subscribe to state changes (useful for debugging or side effects)
  subscribeToSearchTerm(callback: (value: string) => void): () => void {
    return this.state.searchTerm.subscribe(callback);
  }

  subscribeToActiveTab(callback: (value: string) => void): () => void {
    return this.state.activeTab.subscribe(callback);
  }
}

// Create and export the singleton instance
export const globalStore = new GlobalStore();

// Export individual signals for direct use in components if needed
export const searchTermSignal = () => globalStore.state.searchTerm;
export const activeTabSignal = () => globalStore.state.activeTab;