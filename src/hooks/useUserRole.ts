import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'editor' | 'viewer';

export type UserWithRole = {
  id: string;
  email: string | undefined;
  role: UserRole;
};

const ROLE_PRIORITY: UserRole[] = ['admin', 'editor', 'viewer'];

function parseRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'admin' || normalized === 'editor' || normalized === 'viewer') {
    return normalized;
  }
  return null;
}

function resolveRole(user: User): UserRole {
  for (const candidate of ROLE_PRIORITY) {
    if (parseRole(user.user_metadata?.role) === candidate) return candidate;
    if (parseRole(user.app_metadata?.role) === candidate) return candidate;
    if (parseRole(user.app_metadata?.user_role) === candidate) return candidate;
    if (parseRole((user.app_metadata as { claims?: { role?: unknown } } | null)?.claims?.role) === candidate) {
      return candidate;
    }
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

  const loadUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }

      let role = resolveRole(session.user);

      // If the cached session has stale claims, fetch the canonical user once.
      if (role === 'viewer') {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (!userError && userData.user) {
          role = resolveRole(userData.user);
        }
      }

      setUser({
        id: session.user.id,
        email: session.user.email,
        role,
      });
    } catch (err) {
      console.error('[useUserRole] Error loading user role:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    // Подписка на изменения сессии
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }

      const role = resolveRole(session.user);

      setUser({
        id: session.user.id,
        email: session.user.email,
        role,
      });
      setLoading(false);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [loadUser]);

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
