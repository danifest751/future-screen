import { getAdminSourceLabel } from './adminSourceLabel';

describe('getAdminSourceLabel', () => {
  it('returns RU labels for RU admin locale', () => {
    expect(
      getAdminSourceLabel({ adminLocale: 'ru', contentLocale: 'ru', fallbackUsed: false })
    ).toBe('Источник: RU локаль');
    expect(
      getAdminSourceLabel({ adminLocale: 'ru', contentLocale: 'en', fallbackUsed: false })
    ).toBe('Источник: EN локаль');
    expect(
      getAdminSourceLabel({ adminLocale: 'ru', contentLocale: 'en', fallbackUsed: true })
    ).toBe('Источник: RU fallback');
  });

  it('returns EN labels for EN admin locale', () => {
    expect(
      getAdminSourceLabel({ adminLocale: 'en', contentLocale: 'ru', fallbackUsed: false })
    ).toBe('Source: RU locale');
    expect(
      getAdminSourceLabel({ adminLocale: 'en', contentLocale: 'en', fallbackUsed: false })
    ).toBe('Source: EN locale');
    expect(
      getAdminSourceLabel({ adminLocale: 'en', contentLocale: 'en', fallbackUsed: true })
    ).toBe('Source: RU fallback');
  });
});

