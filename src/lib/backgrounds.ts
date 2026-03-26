export type BackgroundId = 'theme' | 'aurora' | 'mesh' | 'dots' | 'waves';

export const BACKGROUND_STORAGE_KEY = 'fs-background';
export const BACKGROUND_CHANGED_EVENT = 'fs-background-changed';

export type BackgroundOption = {
  id: BackgroundId;
  name: string;
  description: string;
};

export const backgroundOptions: BackgroundOption[] = [
  { id: 'theme', name: 'По теме', description: 'Автовыбор по текущей теме сайта' },
  { id: 'aurora', name: 'Aurora', description: 'Мягкие переливы и сияние' },
  { id: 'mesh', name: 'Mesh Grid', description: 'Градиентная сетка в стиле React Bits' },
  { id: 'dots', name: 'Dot Matrix', description: 'Паттерн из точек с подсветкой' },
  { id: 'waves', name: 'Waves', description: 'Линейные волны и glow-слои' },
];

export const isBackgroundId = (value: string | null): value is BackgroundId =>
  Boolean(value) && backgroundOptions.some((option) => option.id === value);

export const getStoredBackground = (): BackgroundId => {
  const raw = localStorage.getItem(BACKGROUND_STORAGE_KEY);
  if (isBackgroundId(raw)) return raw;
  return 'theme';
};

export const setStoredBackground = (background: BackgroundId) => {
  localStorage.setItem(BACKGROUND_STORAGE_KEY, background);
  window.dispatchEvent(new CustomEvent(BACKGROUND_CHANGED_EVENT, { detail: background }));
};
