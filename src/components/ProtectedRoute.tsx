import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { protectedRouteContent } from '../content/global';
import { useAuth } from '../context/AuthContext';
import { useUserRole } from '../hooks/useUserRole';
import type { UserRole } from '../hooks/useUserRole';

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole?: UserRole;
};

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { user, loading: roleLoading, hasRole } = useUserRole();

  const isLoading = authLoading || roleLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    console.warn(
      `[ProtectedRoute] Access denied: user role "${user?.role}" < required "${requiredRole}"`,
    );

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-4xl" aria-hidden="true">
          🔒
        </div>
        <h2 className="text-xl font-semibold text-white">{protectedRouteContent.accessDeniedTitle}</h2>
        <p className="text-slate-400">{protectedRouteContent.accessDeniedDescription}</p>
        <p className="text-xs text-slate-500">
          {protectedRouteContent.currentRolePrefix}{' '}
          {user?.role || protectedRouteContent.currentRoleUnknown}
        </p>
        <button
          onClick={() => window.history.back()}
          className="rounded-lg border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          {protectedRouteContent.backButton}
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
