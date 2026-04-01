import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'editor' | 'viewer';

export type UserWithRole = {
  id: string;
  email: string | undefined;
  role: UserRole;
};

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

      const metadata = session.user.user_metadata || {};
      const role = (metadata.role as UserRole) || 'viewer';

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

      const metadata = session.user.user_metadata || {};
      const role = (metadata.role as UserRole) || 'viewer';

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
