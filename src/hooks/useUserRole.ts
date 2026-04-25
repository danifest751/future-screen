import { useCallback } from 'react';
import { useAuth, type UserRole, type UserWithRole } from '../context/AuthContext';

export type { UserRole, UserWithRole };

/**
 * Reads the current user (with role) from AuthContext. Used to live as
 * an independent hook with its own onAuthStateChange subscription, but
 * that caused the dual-subscription race that flickered "access denied"
 * during logout. Now both this hook and AuthContext consume the same
 * state — single source of truth.
 */
export function useUserRole() {
  const { user, isLoading: loading, error, reload } = useAuth();

  const hasRole = useCallback(
    (requiredRole: UserRole): boolean => {
      if (!user) return false;
      const hierarchy: Record<UserRole, number> = {
        viewer: 0,
        editor: 1,
        admin: 2,
      };
      return (hierarchy[user.role] ?? 0) >= (hierarchy[requiredRole] ?? 0);
    },
    [user],
  );

  return {
    user,
    loading,
    error,
    hasRole,
    isAdmin: hasRole('admin'),
    isEditor: hasRole('editor'),
    reload,
  };
}
