import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  devLogin as apiDevLogin,
  deleteAccount as apiDeleteAccount,
  getMe,
  login as apiLogin,
  register as apiRegister,
  type BackendUser,
} from './backend';
import { createSessionStore, restoreValidSession, type SessionStorageAdapter } from './auth-session';

type AuthState = {
  token: string | null;
  user: BackendUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<BackendUser>;
  register: (name: string, email: string, password: string) => Promise<BackendUser>;
  devLogin: (role?: 'attendee' | 'organizer', email?: string) => Promise<BackendUser>;
  signOut: () => void;
  deleteAccount: (password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);
const webStorageAdapter: SessionStorageAdapter = {
  getItem: async (key) => (typeof window === 'undefined' ? null : window.localStorage.getItem(key)),
  setItem: async (key, value) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  },
  deleteItem: async (key) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
  },
};

const nativeStorageAdapter: SessionStorageAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED }),
  deleteItem: (key) => SecureStore.deleteItemAsync(key),
};

const sessionStore = createSessionStore(Platform.OS === 'web' ? webStorageAdapter : nativeStorageAdapter);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    restoreValidSession(sessionStore, getMe)
      .then((session) => {
        if (!active || !session) return;
        setToken(session.token);
        setUser(session.user);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const syncAuth = async (result: { token: string; user: BackendUser } | null) => {
    if (!result) {
      throw new Error('Connexion impossible');
    }
    await sessionStore.save(result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  };

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      loading,
      login: async (email, password) => syncAuth(await apiLogin(email, password)),
      register: async (name, email, password) => syncAuth(await apiRegister(name, email, password)),
      devLogin: async (role = 'attendee', email?: string) => syncAuth(await apiDevLogin(role, email)),
      signOut: () => {
        setToken(null);
        setUser(null);
        void sessionStore.clear();
      },
      deleteAccount: async (password) => {
        if (!token) throw new Error('Connexion requise');
        await apiDeleteAccount(password, token);
        setToken(null);
        setUser(null);
        await sessionStore.clear();
      },
      refreshUser: async () => {
        if (!token) {
          setUser(null);
          return;
        }
        setUser(await getMe(token));
      },
    }),
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
