import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type Theme, getThemeById, applyTheme, themes } from '../themes';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (id: string) => void;
  themes: Theme[];
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'fs-theme';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? getThemeById(saved) : getThemeById('default');
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (id: string) => {
    const t = getThemeById(id);
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, id);
  };

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeCtx.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
