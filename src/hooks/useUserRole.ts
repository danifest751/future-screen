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
  // Role is read ONLY from app_metadata. That field is server-side (the user
  // cannot change it through supabase.auth.updateUser), so it is the trusted
  // source of truth. The transitional user_metadata fallback existed in PR
  // #4a; PR #4b confirmed every existing user has app_metadata.role set, so
  // in PR #4c we drop the fallback entirely. If a new user appears without
  // app_metadata.role they correctly default to `viewer` until an admin
  // assigns one via the service-role API.
  const appRole =
    parseRole(user.app_metadata?.role) ??
    parseRole(user.app_metadata?.user_role) ??
    parseRole((user.app_metadata as { claims?: { role?: unknown } } | null)?.claims?.role);

  return appRole ?? 'viewer';
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
