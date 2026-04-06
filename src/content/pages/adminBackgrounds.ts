import type { Locale } from '../../i18n/types';

const ru = {
  title: 'Фоны',
  subtitle: 'Глобальный фон сайта',
  loadingSubtitle: 'Управление глобальным фоном сайта',
  saving: 'Сохранение...',
  backgroundPickerTitle: 'Выбор фона',
  settingsTitle: 'Настройки',
  resetButton: 'Сбросить',
  motionLabel: 'Скорость анимации',
  motionOptions: {
    slow: 'Медленно',
    normal: 'Нормально',
    fast: 'Быстро',
  },
  starBorderTitle: 'Star Border',
  starBorderSubtitle: 'Светящаяся рамка при наведении',
  starBorderOn: 'Вкл',
  starBorderOff: 'Выкл',
  starBorderEnable: 'Включить',
  starBorderDisable: 'Выключить',
  starBorderColor: 'Цвет',
  starBorderSpeed: 'Скорость',
  starBorderThickness: 'Толщина',
  starBorderGlow: 'Свечение',
};

const en: typeof ru = {
  title: 'Backgrounds',
  subtitle: 'Global site background',
  loadingSubtitle: 'Managing global site background',
  saving: 'Saving...',
  backgroundPickerTitle: 'Background selection',
  settingsTitle: 'Settings',
  resetButton: 'Reset',
  motionLabel: 'Animation speed',
  motionOptions: {
    slow: 'Slow',
    normal: 'Normal',
    fast: 'Fast',
  },
  starBorderTitle: 'Star Border',
  starBorderSubtitle: 'Glowing frame on hover',
  starBorderOn: 'On',
  starBorderOff: 'Off',
  starBorderEnable: 'Enable',
  starBorderDisable: 'Disable',
  starBorderColor: 'Color',
  starBorderSpeed: 'Speed',
  starBorderThickness: 'Thickness',
  starBorderGlow: 'Glow',
};

const adminBackgroundsPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getAdminBackgroundsPageContent = (locale: Locale) => adminBackgroundsPageContentByLocale[locale];

export const adminBackgroundsPageContent = ru;
