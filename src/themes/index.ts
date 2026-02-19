export interface Theme {
  id: string;
  name: string;
  emoji: string;
  vars: Record<string, string>;
}

import { defaultTheme } from './default';
import { lightTheme } from './light';
import { neonTheme } from './neon';

export const themes: Theme[] = [defaultTheme, lightTheme, neonTheme];

export const getThemeById = (id: string): Theme =>
  themes.find((t) => t.id === id) ?? defaultTheme;

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
  root.setAttribute('data-theme', theme.id);
};
