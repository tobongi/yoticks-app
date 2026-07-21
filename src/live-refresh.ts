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

/**
 * Named polling cadences.
 *
 * Screens used to hard-code 2500ms — about 1,440 requests an hour, per open
 * screen, running whether or not anyone was looking. On a Kinshasa prepaid
 * data plan that is a meaningful cost, and on a low-end phone it is a
 * meaningful chunk of battery.
 *
 * Pick by what the data actually does:
 *   live   — a value that changes second to second and that the user is
 *            actively waiting on: a payment confirming, a gate scanning.
 *   normal — content that changes over minutes: listings, ticket lists.
 *   slow   — background context: profile counters, dashboards.
 *
 * Anything on screen refreshes immediately when the app or tab regains
 * focus regardless of cadence, so the *perceived* freshness is unchanged.
 */
export const REFRESH = {
  live: 4000,
  normal: 30000,
  slow: 60000,
} as const;

/**
 * Ticks on an interval, on app foreground, and on tab focus.
 *
 * Polling is suspended entirely while the app is backgrounded or the browser
 * tab is hidden, and fires once on return. Previously the interval ran
 * forever in hidden tabs.
 */
export function useLiveRefresh(intervalMs: number = REFRESH.normal) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let disposed = false;
    let interval: ReturnType<typeof setInterval> | null = null;
    let cleanupVisibility: (() => void) | null = null;
    let appStateSubscription: { remove(): void } | null = null;

    const pulse = () => setTick((current) => current + 1);
    const unsubscribe = liveRefreshBus.subscribe(pulse);

    const isVisible = () =>
      typeof document === 'undefined' || document.visibilityState === 'visible';

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const startPolling = () => {
      if (interval || disposed) {
        return;
      }
      interval = setInterval(() => {
        // Guards the native case, where there is no `document` to consult
        // and AppState is the only signal.
        if (isVisible()) {
          pulse();
        }
      }, intervalMs);
    };

    if (isVisible()) {
      startPolling();
    }

    void (async () => {
      const { AppState, Platform } = await import('react-native');
      if (disposed) return;

      appStateSubscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          pulse();
          startPolling();
        } else {
          stopPolling();
        }
      });

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const handleVisibility = () => {
          if (document.visibilityState === 'visible') {
            pulse();
            startPolling();
          } else {
            stopPolling();
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
      stopPolling();
      unsubscribe();
      appStateSubscription?.remove();
      cleanupVisibility?.();
    };
  }, [intervalMs]);

  return tick;
}
