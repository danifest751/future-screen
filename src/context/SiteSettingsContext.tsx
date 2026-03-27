import { createContext, useContext, ReactNode } from 'react';
import { useSiteSettings } from '../hooks/useSiteSettings';

type SiteSettingsContextValue = ReturnType<typeof useSiteSettings>;

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const siteSettings = useSiteSettings();
  return (
    <SiteSettingsContext.Provider value={siteSettings}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettingsContext = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettingsContext must be used within SiteSettingsProvider');
  }
  return context;
};

export default SiteSettingsContext;
