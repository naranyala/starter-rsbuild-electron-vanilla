export interface Signal<T> {
  (): T;
  set: (value: T) => void;
  update: (fn: (value: T) => T) => void;
  subscribe: (fn: (value: T) => void) => () => void;
  dispose: () => void;
}

export interface ReadonlySignal<T> {
  (): T;
  subscribe: (fn: (value: T) => void) => () => void;
  dispose: () => void;
}

export interface Computed<T> extends ReadonlySignal<T> {}

export interface Effect {
  (): void;
  cleanup?: () => void;
  dispose: () => void;
}

// Enhanced tracking system
let currentEffect: Effect | null = null;
let tracking = false;
const signalMap = new WeakMap<Signal<any>, Set<Effect>>();
const effectMap = new WeakMap<Effect, Set<Signal<any>>>();
const computedMap = new Map<string, Computed<any>>();

// Batch updates queue
const batchQueue = new Set<() => void>();
let isBatching = false;

const createSignal = <T>(initialValue: T, options?: { equals?: (prev: T, next: T) => boolean }): Signal<T> => {
  let value = initialValue;
  const subscribers = new Set<(value: T) => void>();
  const equals = options?.equals || Object.is;
  let disposed = false;

  const signal = (() => {
    if (currentEffect && tracking && !disposed) {
      // Track dependencies
      signalMap.set(signal as Signal<any>, signalMap.get(signal as Signal<any>) || new Set());
      signalMap.get(signal as Signal<any>)!.add(currentEffect);

      // Track which signals this effect depends on
      effectMap.set(currentEffect, effectMap.get(currentEffect) || new Set());
      effectMap.get(currentEffect)!.add(signal as Signal<any>);
    }
    return value;
  }) as Signal<T>;

  const notifySubscribers = (newValue: T) => {
    if (disposed) return;
    subscribers.forEach((fn) => fn(newValue));
  };

  signal.set = (newValue: T) => {
    if (disposed) return;
    if (equals(value, newValue)) return;

    value = newValue;
    notifySubscribers(value);
  };

  signal.update = (fn: (value: T) => T) => {
    if (disposed) return;
    signal.set(fn(value));
  };

  signal.subscribe = (fn: (value: T) => void) => {
    if (disposed) return () => {};
    subscribers.add(fn);
    return () => {
      if (!disposed) {
        subscribers.delete(fn);
      }
    };
  };

  signal.dispose = () => {
    disposed = true;
    subscribers.clear();
    // Remove from dependency tracking
    signalMap.delete(signal as Signal<any>);
  };

  return signal;
};

export const createEffect = (fn: () => void, options?: { scheduler?: (callback: () => void) => void }): Effect => {
  if (typeof fn !== 'function') {
    throw new Error('Effect must be a function');
  }

  let disposed = false;
  let cleanupFn: (() => void) | null = null;
  const scheduler = options?.scheduler || ((cb) => cb());

  const effect = (() => {
    if (disposed) return;

    // Cleanup previous dependencies
    const prevSignals = effectMap.get(effect as Effect);
    if (prevSignals) {
      prevSignals.forEach(signal => {
        const effects = signalMap.get(signal);
        if (effects) effects.delete(effect as Effect);
      });
    }

    // Clear previous tracking
    effectMap.set(effect as Effect, new Set());

    // Run effect with tracking
    const prevEffect = currentEffect;
    const prevTracking = tracking;

    currentEffect = effect as Effect;
    tracking = true;

    try {
      if (cleanupFn) cleanupFn();
      cleanupFn = fn() as (() => void) || null;
    } catch (error) {
      console.error('Error in effect:', error);
    } finally {
      tracking = prevTracking;
      currentEffect = prevEffect;
    }
  }) as Effect;

  effect.cleanup = cleanupFn || (() => {});
  effect.dispose = () => {
    disposed = true;
    if (cleanupFn) cleanupFn();

    // Remove from dependency tracking
    const signals = effectMap.get(effect as Effect);
    if (signals) {
      signals.forEach(signal => {
        const effects = signalMap.get(signal);
        if (effects) effects.delete(effect as Effect);
      });
    }
    effectMap.delete(effect as Effect);
  };

  // Schedule initial run
  scheduler(() => {
    if (!disposed) {
      effect();
    }
  });

  return effect;
};

export const createComputed = <T>(fn: () => T, options?: { equals?: (prev: T, next: T) => boolean }): Computed<T> => {
  const computedSignal = createSignal<T>(undefined as unknown as T, options) as Computed<T>;
  let currentValue: T;
  let initialized = false;

  createEffect(() => {
    const newValue = fn();
    if (!initialized || !options?.equals || !options.equals(currentValue, newValue)) {
      currentValue = newValue;
      initialized = true;
      computedSignal.set(newValue);
    }
  });

  return computedSignal;
};

export const createRenderEffect = (fn: () => void | (() => void), options?: { scheduler?: (callback: () => void) => void }): Effect => {
  return createEffect(() => {
    const cleanup = fn();
    if (typeof cleanup === 'function') {
      return cleanup;
    }
  }, options);
};

export const batch = <T>(fn: () => T): T => {
  if (isBatching) {
    return fn(); // Already batching
  }

  isBatching = true;
  try {
    const result = fn();
    // Process batched updates
    batchQueue.forEach(callback => callback());
    batchQueue.clear();
    return result;
  } finally {
    isBatching = false;
  }
};

export const untrack = <T>(fn: () => T): T => {
  const prevTracking = tracking;
  tracking = false;
  try {
    return fn();
  } finally {
    tracking = prevTracking;
  }
};

// Enhanced derived signals
export const derive = <T, U>(signal: Signal<T>, transformer: (value: T) => U): Computed<U> => {
  return createComputed(() => transformer(signal()));
};

// Memoized computation
export const memo = <T>(fn: () => T, deps: readonly any[], options?: { equals?: (prev: T, next: T) => boolean }): Computed<T> => {
  const depsSignal = createSignal(deps);
  return createComputed(() => {
    depsSignal(); // Subscribe to dependencies
    return fn();
  }, options);
};

// Signal with history (for undo/redo)
export const createHistorySignal = <T>(initialValue: T, capacity: number = 50) => {
  const signal = createSignal(initialValue);
  const history: T[] = [initialValue];
  const historyIndex = createSignal(0);

  const setWithHistory = (newValue: T) => {
    const currentIndex = historyIndex();
    // Truncate history after current position
    history.splice(currentIndex + 1);
    // Add new value
    history.push(newValue);
    // Limit history size
    if (history.length > capacity) {
      history.shift();
    }
    // Update index
    historyIndex.set(history.length - 1);
    signal.set(newValue);
  };

  const undo = () => {
    const currentIndex = historyIndex();
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      historyIndex.set(newIndex);
      signal.set(history[newIndex]);
    }
  };

  const redo = () => {
    const currentIndex = historyIndex();
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      historyIndex.set(newIndex);
      signal.set(history[newIndex]);
    }
  };

  return {
    ...signal,
    set: setWithHistory,
    undo,
    redo,
    canUndo: createComputed(() => historyIndex() > 0),
    canRedo: createComputed(() => historyIndex() < history.length - 1),
  };
};

// Signal with debouncing
export const debounceSignal = <T>(signal: Signal<T>, delay: number): Signal<T> => {
  const debouncedSignal = createSignal(signal());
  let timeoutId: any;

  signal.subscribe((value) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      debouncedSignal.set(value);
    }, delay);
  });

  return debouncedSignal;
};

// Signal with throttling
export const throttleSignal = <T>(signal: Signal<T>, delay: number): Signal<T> => {
  const throttledSignal = createSignal(signal());
  let lastExecTime = 0;
  let timeoutId: any;

  signal.subscribe((value) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime >= delay) {
      throttledSignal.set(value);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        throttledSignal.set(value);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  });

  return throttledSignal;
};

export const signal = createSignal;
export const computed = createComputed;
export const effect = createEffect;
export const renderEffect = createRenderEffect;

export type { Signal, ReadonlySignal, Computed, Effect };
