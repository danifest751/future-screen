/**
 * Query keys для React Query.
 * 
 * Все ключи должны быть здесь для единообразия и предотвращения дублирования.
 */

export const queryKeys = {
  // Cases
  cases: {
    all: ['cases'] as const,
    byId: (slug: string) => ['cases', slug] as const,
  },
  
  // Categories
  categories: {
    all: ['categories'] as const,
    byId: (id: number) => ['categories', id] as const,
  },
  
  // Contacts
  contacts: {
    all: ['contacts'] as const,
  },
  
  // Packages
  packages: {
    all: ['packages'] as const,
    byId: (id: number) => ['packages', id] as const,
  },
  
  // Leads
  leads: {
    all: ['leads'] as const,
  },
  
  // Privacy Policy
  privacyPolicy: {
    all: ['privacy-policy'] as const,
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
} as const;
