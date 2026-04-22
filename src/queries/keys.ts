/**
 * Query keys для React Query.
 * 
 * Все ключи должны быть здесь для единообразия и предотвращения дублирования.
 */

export const queryKeys = {
  // Cases
  cases: {
    all: (locale: string = 'ru') => ['cases', locale] as const,
    byId: (slug: string, locale: string = 'ru') => ['cases', locale, slug] as const,
  },
  
  // Categories
  categories: {
    all: (locale: string = 'ru') => ['categories', locale] as const,
    byId: (id: number, locale: string = 'ru') => ['categories', locale, id] as const,
  },
  
  // Contacts
  contacts: {
    all: (locale: string = 'ru') => ['contacts', locale] as const,
  },
  
  // Packages
  packages: {
    all: (locale: string = 'ru') => ['packages', locale] as const,
    byId: (id: number, locale: string = 'ru') => ['packages', locale, id] as const,
  },
  
  // Leads
  leads: {
    all: ['leads'] as const,
  },
  
  // Privacy Policy
  privacyPolicy: {
    all: (locale: string = 'ru') => ['privacy-policy', locale] as const,
  },
  
  // Site Settings
  siteSettings: {
    all: ['site-settings'] as const,
    backgrounds: ['site-settings', 'backgrounds'] as const,
  },
  
  // Rental Categories
  rentalCategories: {
    all: ['rental-categories'] as const,
    bySlug: (slug: string) => ['rental-categories', slug] as const,
  },

  // Visual LED logs
  visualLedLogs: {
    sessions: (limit: number, offset: number) =>
      ['visual-led-sessions', limit, offset] as const,
    session: (id: string) => ['visual-led-session', id] as const,
  },
} as const;
