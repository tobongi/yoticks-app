import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { listSavedEvents, saveEvent as backendSaveEvent, unsaveEvent as backendUnsaveEvent } from './backend';
import { useAuth } from './auth';
import { notifyLiveRefresh } from './live-refresh';

const STORAGE_KEY = 'yoticks.savedEventIds';

type SavedEventsState = {
  loading: boolean;
  pendingIds: string[];
  savedIds: string[];
  isSaved: (eventId: string) => boolean;
  refreshSavedEvents: () => Promise<void>;
  toggleSavedEvent: (eventId: string) => Promise<boolean>;
};

const SavedEventsContext = createContext<SavedEventsState | null>(null);

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

export function parseSavedEventIds(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? uniqueIds(parsed.filter((entry): entry is string => typeof entry === 'string')) : [];
  } catch {
    return [];
  }
}

export function mergeSavedEventIds(primaryIds: string[], secondaryIds: string[]) {
  return uniqueIds([...primaryIds, ...secondaryIds]);
}

export function readLocalSavedEventIds() {
  return parseSavedEventIds(getStorage()?.getItem(STORAGE_KEY) ?? null);
}

function writeLocalSavedEventIds(ids: string[]) {
  getStorage()?.setItem(STORAGE_KEY, JSON.stringify(uniqueIds(ids)));
}

export function SavedEventsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    const refreshSavedEvents = async () => {
      const localIds = readLocalSavedEventIds();

      if (!token) {
        if (active) {
          setSavedIds(localIds);
          setLoading(false);
        }
        return;
      }

      if (active) {
        setLoading(true);
      }

      if (localIds.length > 0) {
        const syncResults = await Promise.all(localIds.map((eventId) => backendSaveEvent(eventId, token)));
        const unsyncedIds = localIds.filter((_, index) => !syncResults[index]);
        writeLocalSavedEventIds(unsyncedIds);
      }

      const remoteSaved = await listSavedEvents(token);
      if (!active) {
        return;
      }

      setSavedIds(mergeSavedEventIds(remoteSaved.map((entry) => entry.event.id), localIds));
      setLoading(false);
    };

    void refreshSavedEvents();

    return () => {
      active = false;
    };
  }, [token]);

  const value = useMemo<SavedEventsState>(
    () => ({
      loading,
      pendingIds,
      savedIds,
      isSaved: (eventId: string) => savedIds.includes(eventId),
      refreshSavedEvents: async () => {
        const localIds = readLocalSavedEventIds();
        if (!token) {
          setSavedIds(localIds);
          return;
        }

        const remoteSaved = await listSavedEvents(token);
        setSavedIds(mergeSavedEventIds(remoteSaved.map((entry) => entry.event.id), localIds));
      },
      toggleSavedEvent: async (eventId: string) => {
        if (!eventId.trim() || pendingIds.includes(eventId)) {
          return savedIds.includes(eventId);
        }

        const currentlySaved = savedIds.includes(eventId);
        const nextSavedIds = currentlySaved ? savedIds.filter((id) => id !== eventId) : [...savedIds, eventId];

        setPendingIds((current) => [...current, eventId]);
        setSavedIds(nextSavedIds);

        try {
          if (!token) {
            writeLocalSavedEventIds(nextSavedIds);
            notifyLiveRefresh();
            return !currentlySaved;
          }

          const result = currentlySaved
            ? await backendUnsaveEvent(eventId, token)
            : Boolean(await backendSaveEvent(eventId, token));

          if (!result) {
            setSavedIds(savedIds);
            return currentlySaved;
          }

          writeLocalSavedEventIds(readLocalSavedEventIds().filter((id) => id !== eventId));
          notifyLiveRefresh();
          return !currentlySaved;
        } finally {
          setPendingIds((current) => current.filter((id) => id !== eventId));
        }
      },
    }),
    [loading, pendingIds, savedIds, token],
  );

  return <SavedEventsContext.Provider value={value}>{children}</SavedEventsContext.Provider>;
}

export function useSavedEvents() {
  const context = useContext(SavedEventsContext);
  if (!context) {
    throw new Error('useSavedEvents must be used inside SavedEventsProvider');
  }

  return context;
}
