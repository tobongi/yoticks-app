import { useEffect, useState } from 'react';

type Listener = () => void;

export type LiveRefreshBus = {
  subscribe(listener: Listener): () => void;
  notify(): void;
};

export function createLiveRefreshBus(): LiveRefreshBus {
  const listeners = new Set<Listener>();

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    notify() {
      for (const listener of listeners) {
        listener();
      }
    },
  };
}

export const liveRefreshBus = createLiveRefreshBus();

export function notifyLiveRefresh() {
  liveRefreshBus.notify();
}

export function useLiveRefresh(intervalMs = 3000) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let disposed = false;
    let cleanupVisibility: (() => void) | null = null;
    let appStateSubscription: { remove(): void } | null = null;

    const pulse = () => setTick((current) => current + 1);
    const unsubscribe = liveRefreshBus.subscribe(pulse);
    const interval = setInterval(pulse, intervalMs);

    void (async () => {
      const { AppState, Platform } = await import('react-native');
      if (disposed) return;

      appStateSubscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          pulse();
        }
      });

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const handleVisibility = () => {
          if (document.visibilityState === 'visible') {
            pulse();
          }
        };

        window.addEventListener('focus', handleVisibility);
        document.addEventListener('visibilitychange', handleVisibility);
        cleanupVisibility = () => {
          window.removeEventListener('focus', handleVisibility);
          document.removeEventListener('visibilitychange', handleVisibility);
        };
      }
    })();

    return () => {
      disposed = true;
      clearInterval(interval);
      unsubscribe();
      appStateSubscription?.remove();
      cleanupVisibility?.();
    };
  }, [intervalMs]);

  return tick;
}
