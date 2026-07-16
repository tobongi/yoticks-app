export type SessionStorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
};

export type SessionStore = {
  read: () => Promise<string | null>;
  save: (token: string) => Promise<void>;
  clear: () => Promise<void>;
};

const SESSION_KEY = 'yoticks.session.token';

export function createSessionStore(adapter: SessionStorageAdapter): SessionStore {
  return {
    read: () => adapter.getItem(SESSION_KEY),
    save: (token) => adapter.setItem(SESSION_KEY, token),
    clear: () => adapter.deleteItem(SESSION_KEY),
  };
}

export async function restoreValidSession<T>(
  store: SessionStore,
  loadUser: (token: string) => Promise<T | null>,
): Promise<{ token: string; user: T } | null> {
  const token = await store.read();
  if (!token) {
    return null;
  }

  try {
    const user = await loadUser(token);
    if (user) {
      return { token, user };
    }
  } catch {
    // A stored credential that the server cannot validate is not a session.
  }

  await store.clear();
  return null;
}
