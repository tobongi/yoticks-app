import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  devLogin as apiDevLogin,
  getMe,
  login as apiLogin,
  register as apiRegister,
  type BackendUser,
} from './backend';

type AuthState = {
  token: string | null;
  user: BackendUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<BackendUser>;
  register: (name: string, email: string, password: string) => Promise<BackendUser>;
  devLogin: (role?: 'attendee' | 'organizer', email?: string) => Promise<BackendUser>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = 'yoticks.token';

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = getStorage()?.getItem(STORAGE_KEY);
    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);
    getMe(storedToken)
      .then((nextUser) => setUser(nextUser))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }
    getStorage()?.setItem(STORAGE_KEY, token);
  }, [token]);

  const syncAuth = async (result: { token: string; user: BackendUser } | null) => {
    if (!result) {
      throw new Error('Connexion impossible');
    }
    setToken(result.token);
    setUser(result.user);
    getStorage()?.setItem(STORAGE_KEY, result.token);
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
        getStorage()?.removeItem(STORAGE_KEY);
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
