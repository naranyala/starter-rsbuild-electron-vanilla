// Simple, reliable reactivity system

export interface Signal<T> {
  (): T;
  set: (value: T) => void;
  update: (fn: (value: T) => T) => void;
}

let activeEffect: Function | null = null;
const signalMap = new WeakMap<Function, Set<Function>>();
const effectMap = new WeakMap<Function, Set<Function>>();

export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<Function>();

  const sig = (() => {
    if (activeEffect) {
      // Track this signal as a dependency of the current effect
      subscribers.add(activeEffect);
      // Track the current effect as depending on this signal
      let effects = effectMap.get(sig as any);
      if (!effects) {
        effects = new Set();
        effectMap.set(sig as any, effects);
      }
      effects.add(activeEffect);
    }
    return value;
  }) as Signal<T>;

  sig.set = (newValue: T) => {
    if (value !== newValue) {
      value = newValue;
      // Notify all subscribers
      for (const subscriber of subscribers) {
        subscriber();
      }
    }
  };

  sig.update = (fn: (value: T) => T) => {
    sig.set(fn(value));
  };

  return sig;
}

export function effect(fn: () => void) {
  const wrapped = () => {
    // Clean up previous dependencies
    const prevEffects = effectMap.get(wrapped);
    if (prevEffects) {
      for (const sig of prevEffects) {
        const subs = signalMap.get(sig);
        if (subs) subs.delete(wrapped);
      }
    }
    effectMap.delete(wrapped);

    // Run effect with tracking
    const prevActiveEffect = activeEffect;
    activeEffect = wrapped;
    try {
      fn();
    } finally {
      activeEffect = prevActiveEffect;
    }
  };

  // Run immediately
  wrapped();
}