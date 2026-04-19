import type { Locale } from '../../i18n/types';

const ru = {
  title: '\u0424\u043e\u043d\u044b',
  subtitle: '\u0413\u043b\u043e\u0431\u0430\u043b\u044c\u043d\u044b\u0439 \u0444\u043e\u043d \u0441\u0430\u0439\u0442\u0430',
  loadingSubtitle: '\u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435 \u0433\u043b\u043e\u0431\u0430\u043b\u044c\u043d\u044b\u043c \u0444\u043e\u043d\u043e\u043c \u0441\u0430\u0439\u0442\u0430',
  saving: '\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435...',
  backgroundPickerTitle: '\u0412\u044b\u0431\u043e\u0440 \u0444\u043e\u043d\u0430',
  settingsTitle: '\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438',
  resetButton: '\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c',
  motionLabel: '\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c \u0430\u043d\u0438\u043c\u0430\u0446\u0438\u0438',
  motionOptions: {
    slow: '\u041c\u0435\u0434\u043b\u0435\u043d\u043d\u043e',
    normal: '\u041d\u043e\u0440\u043c\u0430\u043b\u044c\u043d\u043e',
    fast: '\u0411\u044b\u0441\u0442\u0440\u043e',
  },
  starBorderTitle: 'Star Border',
  starBorderSubtitle: '\u0421\u0432\u0435\u0442\u044f\u0449\u0430\u044f\u0441\u044f \u0440\u0430\u043c\u043a\u0430 \u043f\u0440\u0438 \u043d\u0430\u0432\u0435\u0434\u0435\u043d\u0438\u0438',
  starBorderOn: '\u0412\u043a\u043b',
  starBorderOff: '\u0412\u044b\u043a\u043b',
  starBorderEnable: '\u0412\u043a\u043b\u044e\u0447\u0438\u0442\u044c',
  starBorderDisable: '\u0412\u044b\u043a\u043b\u044e\u0447\u0438\u0442\u044c',
  starBorderColor: '\u0426\u0432\u0435\u0442',
  starBorderSpeed: '\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c',
  starBorderThickness: '\u0422\u043e\u043b\u0449\u0438\u043d\u0430',
  starBorderGlow: '\u0421\u0432\u0435\u0447\u0435\u043d\u0438\u0435',
  starBorderCornerOffset: '\u041e\u0442\u0441\u0442\u0443\u043f \u0443\u0433\u043b\u043e\u0432',
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
  starBorderCornerOffset: 'Corner offset',
};

const adminBackgroundsPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getAdminBackgroundsPageContent = (locale: Locale) => adminBackgroundsPageContentByLocale[locale];

export const adminBackgroundsPageContent = ru;
