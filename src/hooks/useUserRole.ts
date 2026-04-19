import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'editor' | 'viewer';

export type UserWithRole = {
  id: string;
  email: string | undefined;
  role: UserRole;
};

function parseRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'admin' || normalized === 'editor' || normalized === 'viewer') {
    return normalized;
  }
  return null;
}

function resolveRole(user: User): UserRole {
  // app_metadata is server-only (user cannot self-update it via auth.updateUser),
  // so it is the trusted source of truth. We prefer it strictly over user_metadata.
  // user_metadata is kept only as a transitional fallback; once every user has
  // a role in app_metadata (see scripts/backfill-app-metadata-role.mjs), the
  // user_metadata branch and SQL policy will be removed in PR #4c.
  const appRole =
    parseRole(user.app_metadata?.role) ??
    parseRole(user.app_metadata?.user_role) ??
    parseRole((user.app_metadata as { claims?: { role?: unknown } } | null)?.claims?.role);

  if (appRole) return appRole;

  const userRole = parseRole(user.user_metadata?.role);
  if (userRole) {
    console.warn(
      `[useUserRole] user ${user.id} has role in user_metadata but not app_metadata — ` +
        'this is insecure (user can self-promote). Run the backfill script (PR #4b).',
    );
    return userRole;
  }

  return 'viewer';
}

/**
 * Хук для получения роли пользователя из Supabase.
 * Роль хранится в user_metadata.role или загружается из таблицы profiles.
 */
export function useUserRole() {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hydrateUserFromSession = useCallback(async (sessionUser: User) => {
    let role = resolveRole(sessionUser);

    // Access token refresh can contain stale/partial claims.
    // Re-read canonical user when role resolves to viewer.
    if (role === 'viewer') {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!userError && userData.user) {
        role = resolveRole(userData.user);
      }
    }

    setUser({
      id: sessionUser.id,
      email: sessionUser.email,
      role,
    });
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }

      await hydrateUserFromSession(session.user);
    } catch (err) {
      console.error('[useUserRole] Error loading user role:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [hydrateUserFromSession]);

  useEffect(() => {
    loadUser();

    // Подписка на изменения сессии
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      void hydrateUserFromSession(session.user).finally(() => setLoading(false));
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [hydrateUserFromSession, loadUser]);

  const hasRole = useCallback((requiredRole: UserRole): boolean => {
    if (!user) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      viewer: 0,
      editor: 1,
      admin: 2,
    };

    return (roleHierarchy[user.role] ?? 0) >= (roleHierarchy[requiredRole] ?? 0);
  }, [user]);

  return {
    user,
    loading,
    error,
    hasRole,
    isAdmin: hasRole('admin'),
    isEditor: hasRole('editor'),
    reload: loadUser,
  };
}
