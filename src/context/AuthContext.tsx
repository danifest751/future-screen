import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

const ADMIN_LOGIN = import.meta.env.VITE_ADMIN_LOGIN ?? 'admin';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'fs2024';

type AuthContextType = {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => sessionStorage.getItem('fs_auth') === '1'
  );

  const login = useCallback((username: string, password: string) => {
    if (username === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
      sessionStorage.setItem('fs_auth', '1');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('fs_auth');
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
