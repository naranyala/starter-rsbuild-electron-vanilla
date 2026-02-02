export interface Signal<T> {
  (): T;
  set: (value: T) => void;
  update: (fn: (value: T) => T) => void;
  subscribe: (fn: (value: T) => void) => () => void;
}

export interface ReadonlySignal<T> {
  (): T;
  subscribe: (fn: (value: T) => void) => () => void;
}

export interface Computed<T> extends ReadonlySignal<T> {}

export interface Effect {
  (): void;
  cleanup?: () => void;
}

let currentEffect: Effect | null = null;
let tracking = false;

const createSignal = <T>(initialValue: T): Signal<T> => {
  let value = initialValue;
  const subscribers = new Set<(value: T) => void>();

  const signal = (() => {
    if (currentEffect && tracking) {
      currentEffectCleanup.add(() => subscribers.delete(listener));
    }
    return value;
  }) as Signal<T>;

  const listener = (newValue: T) => {
    subscribers.forEach((fn) => fn(newValue));
  };

  signal.set = (newValue: T) => {
    if (Object.is(value, newValue)) return;
    value = newValue;
    listener(value);
  };

  signal.update = (fn: (value: T) => T) => {
    signal.set(fn(value));
  };

  signal.subscribe = (fn: (value: T) => void) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  };

  return signal;
};

const currentEffectCleanup = new Set<() => void>();

export const createEffect = (fn: Effect): Effect => {
  const effect = fn as Effect;
  const cleanup = () => {
    currentEffectCleanup.forEach((cleanup) => cleanup());
    currentEffectCleanup.clear();
  };
  effect.cleanup = cleanup;

  const wrappedFn = () => {
    cleanup();
    currentEffect = effect;
    tracking = true;
    try {
      effect();
    } finally {
      tracking = false;
      currentEffect = null;
    }
  };

  wrappedFn();
  return wrappedFn;
};

export const createComputed = <T>(fn: () => T): Computed<T> => {
  const signal = createSignal<T>(undefined as unknown as T);

  createEffect(() => {
    signal.set(fn());
  });

  return signal;
};

export const createRenderEffect = (fn: () => void | (() => void)): Effect => {
  return createEffect(() => {
    const cleanup = fn();
    if (typeof cleanup === 'function') {
      currentEffectCleanup.add(cleanup as () => void);
    }
  });
};

export const batch = <T>(fn: () => T): T => {
  return fn();
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

export const signal = createSignal;
export const computed = createComputed;
export const effect = createEffect;
export const renderEffect = createRenderEffect;

export type { Signal, ReadonlySignal, Computed, Effect };
