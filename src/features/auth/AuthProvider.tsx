"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  getAuthContext,
  login as apiLogin,
  logout as apiLogout,
} from '@/api';
import { getSession, clearSession } from '@/api';
import { ApiError } from '@/api';
import type { Role, User } from '@/api/_fixtures/types';
import { getMenuForRole } from '@/shared/config/menu';
import type { MenuItem } from '@/shared/config/menu';

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  defaultLocationId: string | null;
  locationIds: string[];
  menu: MenuItem[];
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const DEFAULT_MENU = getMenuForRole('ADMIN');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>('ADMIN');
  const [defaultLocationId, setDefaultLocationId] = useState<string | null>('wh-pusat');
  const [locationIds, setLocationIds] = useState<string[]>(['wh-pusat', 'depo-rawat-inap', 'depo-igd', 'apotek-rawat-jalan']);
  const [menu, setMenu] = useState<MenuItem[]>(DEFAULT_MENU);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount: restore session (if any) and hydrate context from the backend.
  useEffect(() => {
    const session = getSession();
    if (!session) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getAuthContext()
      .then((context) => {
        if (cancelled) return;
        setUser(context.user);
        setRole(context.role);
        setDefaultLocationId(context.defaultLocationId);
        setLocationIds(context.locationIds);
        setMenu(context.menu);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          // Session no longer valid — clear it.
          clearSession();
          setError('Your session has expired. Please log in again.');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load user context');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await apiLogin(username, password);
      const context = await getAuthContext();
      setUser(context.user);
      setRole(context.role);
      setDefaultLocationId(context.defaultLocationId);
      setLocationIds(context.locationIds);
      setMenu(context.menu);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
      }
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setRole(null);
      setDefaultLocationId(null);
      setLocationIds([]);
      setMenu([]);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      defaultLocationId,
      locationIds,
      menu,
      isLoading,
      error,
      login,
      logout,
    }),
    [user, role, defaultLocationId, locationIds, menu, isLoading, error, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}