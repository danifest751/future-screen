import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'editor' | 'viewer';

export type UserWithRole = {
  id: string;
  email: string | undefined;
  role: UserRole;
};

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserWithRole | null;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const parseRole = (value: unknown): UserRole | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'admin' || normalized === 'editor' || normalized === 'viewer') {
    return normalized;
  }
  return null;
};

// Read role ONLY from app_metadata. user_metadata is client-writable
// (supabase.auth.updateUser), so it must never grant authority. If
// app_metadata is absent we default to viewer until an admin assigns
// the role via the service-role API.
const resolveRole = (user: User): UserRole => {
  const appRole =
    parseRole(user.app_metadata?.role) ??
    parseRole(user.app_metadata?.user_role) ??
    parseRole((user.app_metadata as { claims?: { role?: unknown } } | null)?.claims?.role);
  return appRole ?? 'viewer';
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const hydrateFromSession = useCallback(async (sessionUser: User) => {
    let role = resolveRole(sessionUser);

    // Token-refresh sessions sometimes carry stale/partial claims. If
    // the role resolves to viewer, re-read the canonical user from the
    // server before committing.
    if (role === 'viewer') {
      try {
        const { data, error: getUserError } = await supabase.auth.getUser();
        if (!getUserError && data.user) {
          role = resolveRole(data.user);
        }
      } catch {
        // best-effort; fall back to whatever we have
      }
    }

    setUser({
      id: sessionUser.id,
      email: sessionUser.email,
      role,
    });
  }, []);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setUser(null);
      } else {
        await hydrateFromSession(data.session.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [hydrateFromSession]);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      await reload();
      if (!mounted) {
        // reload finished after unmount; nothing to do.
      }
    })();

    // Single subscription for the whole app. useUserRole is a thin
    // wrapper around this context, so admin pages and the layout never
    // race over isAuthenticated vs role anymore.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      void hydrateFromSession(session.user).finally(() => {
        if (mounted) setIsLoading(false);
      });
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [hydrateFromSession, reload]);

  const login = useCallback(async (email: string, password: string) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    return !signInError;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: user !== null,
        isLoading,
        user,
        error,
        login,
        logout,
        reload,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
