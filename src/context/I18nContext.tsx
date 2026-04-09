import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { I18nScope, Locale } from '../i18n/types';

const SITE_LOCALE_KEY = 'future-screen.locale.site';
const ADMIN_LOCALE_KEY = 'future-screen.locale.admin';
const ADMIN_CONTENT_LOCALE_KEY = 'future-screen.locale.admin-content';

type I18nContextValue = {
  siteLocale: Locale;
  adminLocale: Locale;
  adminContentLocale: Locale;
  setSiteLocale: (locale: Locale) => void;
  setAdminLocale: (locale: Locale) => void;
  setAdminContentLocale: (locale: Locale) => void;
  getLocaleForPath: (pathname: string) => Locale;
  setLocaleForPath: (pathname: string, locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const isLocale = (value: string | null): value is Locale => value === 'ru' || value === 'en';

const readStoredLocale = (key: string, fallback: Locale): Locale => {
  const value = localStorage.getItem(key);
  return isLocale(value) ? value : fallback;
};

export const getScopeByPath = (pathname: string): I18nScope =>
  pathname.startsWith('/admin') ? 'admin' : 'site';

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [siteLocale, setSiteLocaleState] = useState<Locale>(() => readStoredLocale(SITE_LOCALE_KEY, 'en'));
  const [adminLocale, setAdminLocaleState] = useState<Locale>(() => readStoredLocale(ADMIN_LOCALE_KEY, 'ru'));
  const [adminContentLocale, setAdminContentLocaleState] = useState<Locale>(() =>
    readStoredLocale(ADMIN_CONTENT_LOCALE_KEY, 'ru')
  );

  const setSiteLocale = (locale: Locale) => {
    setSiteLocaleState(locale);
    localStorage.setItem(SITE_LOCALE_KEY, locale);
  };

  const setAdminLocale = (locale: Locale) => {
    setAdminLocaleState(locale);
    localStorage.setItem(ADMIN_LOCALE_KEY, locale);
  };

  const setAdminContentLocale = (locale: Locale) => {
    setAdminContentLocaleState(locale);
    localStorage.setItem(ADMIN_CONTENT_LOCALE_KEY, locale);
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      siteLocale,
      adminLocale,
      adminContentLocale,
      setSiteLocale,
      setAdminLocale,
      setAdminContentLocale,
      getLocaleForPath: (pathname: string) => (getScopeByPath(pathname) === 'admin' ? adminLocale : siteLocale),
      setLocaleForPath: (pathname: string, locale: Locale) => {
        if (getScopeByPath(pathname) === 'admin') {
          setAdminLocale(locale);
          return;
        }
        setSiteLocale(locale);
      },
    }),
    [siteLocale, adminLocale, adminContentLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
