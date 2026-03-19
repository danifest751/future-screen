import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Package } from '../data/packages';
import type { Category } from '../data/categories';
import { contacts as baseContacts } from '../data/contacts';
import type { CaseItem } from '../data/cases';
import type { LeadLog } from '../types/leads';
import {
  addCase as addCaseService,
  clearLeads as clearLeadsService,
  loadCategories,
  loadCases,
  loadContacts,
  loadLeads,
  loadPackages,
  removeCase as removeCaseService,
  removeCategory as removeCategoryService,
  removePackage as removePackageService,
  resetCategories as resetCategoriesService,
  resetCases as resetCasesService,
  resetContacts as resetContactsService,
  resetPackages as resetPackagesService,
  saveContacts as saveContactsService,
  upsertCategory as upsertCategoryService,
  upsertPackage as upsertPackageService,
  updateCase as updateCaseService,
} from '../services/adminData';

export type ResourceState<T> = {
  items: T;
  loading: boolean;
  error: string | null;
  loaded: boolean;
};

type AdminDataContextValue = {
  packages: ResourceState<Package[]>;
  categories: ResourceState<Category[]>;
  contacts: ResourceState<(typeof baseContacts & { id?: number }) | null>;
  leads: ResourceState<LeadLog[]>;
  cases: ResourceState<CaseItem[]>;
  ensurePackages: () => Promise<void>;
  ensureCategories: () => Promise<void>;
  ensureContacts: () => Promise<void>;
  ensureLeads: () => Promise<void>;
  ensureCases: () => Promise<void>;
  upsertPackage: (payload: Package) => Promise<boolean>;
  removePackage: (id: Package['id']) => Promise<boolean>;
  resetPackages: () => Promise<boolean>;
  upsertCategory: (payload: Category) => Promise<boolean>;
  removeCategory: (id: Category['id']) => Promise<boolean>;
  resetCategories: () => Promise<boolean>;
  updateContacts: (payload: typeof baseContacts) => Promise<boolean>;
  resetContacts: () => Promise<boolean>;
  addCase: (payload: Omit<CaseItem, 'services'> & { services: string[] }) => Promise<boolean>;
  updateCase: (slug: string, payload: Partial<Omit<CaseItem, 'services'>> & { services?: string[] }) => Promise<boolean>;
  removeCase: (slug: string) => Promise<boolean>;
  resetCases: () => Promise<boolean>;
  clearLeads: () => Promise<boolean>;
};

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

const initialResourceState = <T,>(items: T): ResourceState<T> => ({
  items,
  loading: false,
  error: null,
  loaded: false,
});

const initialState = {
  packages: initialResourceState<Package[]>([]),
  categories: initialResourceState<Category[]>([]),
  contacts: initialResourceState<(typeof baseContacts & { id?: number }) | null>(null),
  leads: initialResourceState<LeadLog[]>([]),
  cases: initialResourceState<CaseItem[]>([]),
};

const getErrorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Unknown error');

export const AdminDataProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  const inFlightRef = useRef<Partial<Record<keyof typeof initialState, Promise<void>>>>({});

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const patchResource = useCallback(<K extends keyof typeof initialState>(
    key: K,
    patch: Partial<(typeof initialState)[K]>
  ) => {
    setState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...patch,
      },
    }));
  }, []);

  const loadResource = useCallback(async <T, K extends keyof typeof initialState>(
    key: K,
    loader: () => Promise<T>,
    itemsFallback: T,
  ) => {
    const current = stateRef.current[key];
    const inFlight = inFlightRef.current[key];
    if (inFlight) return inFlight;
    if (current.loading || current.loaded) return Promise.resolve();

    patchResource(key, { loading: true, error: null } as Partial<(typeof initialState)[K]>);
    const request = loader()
      .then((items) => {
        patchResource(key, { items, loading: false, error: null, loaded: true } as Partial<(typeof initialState)[K]>);
      })
      .catch((err) => {
        patchResource(key, {
          items: itemsFallback,
          loading: false,
          error: getErrorMessage(err),
          loaded: false,
        } as Partial<(typeof initialState)[K]>);
      })
      .finally(() => {
        delete inFlightRef.current[key];
      });

    inFlightRef.current[key] = request;
    return request;
  }, [patchResource]);

  const ensurePackages = useCallback(async () => {
    await loadResource('packages', loadPackages, []);
  }, [loadResource]);

  const ensureCategories = useCallback(async () => {
    await loadResource('categories', loadCategories, []);
  }, [loadResource]);

  const ensureContacts = useCallback(async () => {
    await loadResource('contacts', loadContacts, null);
  }, [loadResource]);

  const ensureLeads = useCallback(async () => {
    await loadResource('leads', loadLeads, []);
  }, [loadResource]);

  const ensureCases = useCallback(async () => {
    await loadResource('cases', loadCases, []);
  }, [loadResource]);

  const upsertPackage = useCallback(async (payload: Package) => {
    try {
      const updated = await upsertPackageService(payload);
      setState((prev) => {
        const exists = prev.packages.items.some((item) => item.id === payload.id);
        return {
          ...prev,
          packages: {
            ...prev.packages,
            items: exists
              ? prev.packages.items.map((item) => (item.id === payload.id ? updated : item))
              : [...prev.packages.items, updated],
            loading: false,
            error: null,
            loaded: true,
          },
        };
      });
      return true;
    } catch (err) {
      patchResource('packages', { error: getErrorMessage(err), loading: false, loaded: true } as Partial<(typeof initialState)['packages']>);
      return false;
    }
  }, [patchResource]);

  const removePackage = useCallback(async (id: Package['id']) => {
    try {
      await removePackageService(id);
      setState((prev) => ({
        ...prev,
        packages: {
          ...prev.packages,
          items: prev.packages.items.filter((item) => item.id !== id),
          loading: false,
          error: null,
          loaded: true,
        },
      }));
      return true;
    } catch (err) {
      patchResource('packages', { error: getErrorMessage(err), loading: false, loaded: true } as Partial<(typeof initialState)['packages']>);
      return false;
    }
  }, [patchResource]);

  const resetPackages = useCallback(async () => {
    try {
      patchResource('packages', { loading: true, error: null } as Partial<(typeof initialState)['packages']>);
      const items = await resetPackagesService();
      patchResource('packages', { items, loading: false, error: null, loaded: true } as Partial<(typeof initialState)['packages']>);
      return true;
    } catch (err) {
      patchResource('packages', { loading: false, error: getErrorMessage(err), loaded: true } as Partial<(typeof initialState)['packages']>);
      return false;
    }
  }, [patchResource]);

  const upsertCategory = useCallback(async (payload: Category) => {
    try {
      const updated = await upsertCategoryService(payload);
      setState((prev) => {
        const exists = prev.categories.items.some((item) => item.id === payload.id);
        return {
          ...prev,
          categories: {
            ...prev.categories,
            items: exists
              ? prev.categories.items.map((item) => (item.id === payload.id ? updated : item))
              : [...prev.categories.items, updated],
            loading: false,
            error: null,
            loaded: true,
          },
        };
      });
      return true;
    } catch (err) {
      patchResource('categories', { error: getErrorMessage(err), loading: false, loaded: true } as Partial<(typeof initialState)['categories']>);
      return false;
    }
  }, [patchResource]);

  const removeCategory = useCallback(async (id: Category['id']) => {
    try {
      await removeCategoryService(id);
      setState((prev) => ({
        ...prev,
        categories: {
          ...prev.categories,
          items: prev.categories.items.filter((item) => item.id !== id),
          loading: false,
          error: null,
          loaded: true,
        },
      }));
      return true;
    } catch (err) {
      patchResource('categories', { error: getErrorMessage(err), loading: false, loaded: true } as Partial<(typeof initialState)['categories']>);
      return false;
    }
  }, [patchResource]);

  const resetCategories = useCallback(async () => {
    try {
      patchResource('categories', { loading: true, error: null } as Partial<(typeof initialState)['categories']>);
      const items = await resetCategoriesService();
      patchResource('categories', { items, loading: false, error: null, loaded: true } as Partial<(typeof initialState)['categories']>);
      return true;
    } catch (err) {
      patchResource('categories', { loading: false, error: getErrorMessage(err), loaded: true } as Partial<(typeof initialState)['categories']>);
      return false;
    }
  }, [patchResource]);

  const updateContacts = useCallback(async (payload: typeof baseContacts) => {
    try {
      const existingId = stateRef.current.contacts.items?.id;
      const updated = await saveContactsService(payload, existingId);
      patchResource('contacts', { items: updated, loading: false, error: null, loaded: true } as Partial<(typeof initialState)['contacts']>);
      return true;
    } catch (err) {
      patchResource('contacts', { loading: false, error: getErrorMessage(err), loaded: true } as Partial<(typeof initialState)['contacts']>);
      return false;
    }
  }, [patchResource]);

  const resetContacts = useCallback(async () => {
    try {
      patchResource('contacts', { loading: true, error: null } as Partial<(typeof initialState)['contacts']>);
      const updated = await resetContactsService();
      patchResource('contacts', { items: updated, loading: false, error: null, loaded: true } as Partial<(typeof initialState)['contacts']>);
      return true;
    } catch (err) {
      patchResource('contacts', { loading: false, error: getErrorMessage(err), loaded: true } as Partial<(typeof initialState)['contacts']>);
      return false;
    }
  }, [patchResource]);

  const addCase = useCallback(async (payload: Omit<CaseItem, 'services'> & { services: string[] }) => {
    try {
      const created = await addCaseService(payload);
      setState((prev) => ({
        ...prev,
        cases: {
          ...prev.cases,
          items: [created, ...prev.cases.items],
          loading: false,
          error: null,
          loaded: true,
        },
      }));
      return true;
    } catch (err) {
      patchResource('cases', { error: getErrorMessage(err), loading: false, loaded: true } as Partial<(typeof initialState)['cases']>);
      return false;
    }
  }, [patchResource]);

  const updateCase = useCallback(async (slug: string, payload: Partial<Omit<CaseItem, 'services'>> & { services?: string[] }) => {
    try {
      const updated = await updateCaseService(slug, payload);
      setState((prev) => ({
        ...prev,
        cases: {
          ...prev.cases,
          items: prev.cases.items.map((item) => (item.slug === slug ? updated : item)),
          loading: false,
          error: null,
          loaded: true,
        },
      }));
      return true;
    } catch (err) {
      patchResource('cases', { error: getErrorMessage(err), loading: false, loaded: true } as Partial<(typeof initialState)['cases']>);
      return false;
    }
  }, [patchResource]);

  const removeCase = useCallback(async (slug: string) => {
    try {
      await removeCaseService(slug);
      setState((prev) => ({
        ...prev,
        cases: {
          ...prev.cases,
          items: prev.cases.items.filter((item) => item.slug !== slug),
          loading: false,
          error: null,
          loaded: true,
        },
      }));
      return true;
    } catch (err) {
      patchResource('cases', { error: getErrorMessage(err), loading: false, loaded: true } as Partial<(typeof initialState)['cases']>);
      return false;
    }
  }, [patchResource]);

  const resetCases = useCallback(async () => {
    try {
      patchResource('cases', { loading: true, error: null } as Partial<(typeof initialState)['cases']>);
      const items = await resetCasesService();
      patchResource('cases', { items, loading: false, error: null, loaded: true } as Partial<(typeof initialState)['cases']>);
      return true;
    } catch (err) {
      patchResource('cases', { loading: false, error: getErrorMessage(err), loaded: true } as Partial<(typeof initialState)['cases']>);
      return false;
    }
  }, [patchResource]);

  const clearLeads = useCallback(async () => {
    try {
      await clearLeadsService();
      patchResource('leads', { items: [], loading: false, error: null, loaded: true } as Partial<(typeof initialState)['leads']>);
      return true;
    } catch (err) {
      patchResource('leads', { loading: false, error: getErrorMessage(err), loaded: true } as Partial<(typeof initialState)['leads']>);
      return false;
    }
  }, [patchResource]);

  const value = useMemo<AdminDataContextValue>(() => ({
    packages: state.packages,
    categories: state.categories,
    contacts: state.contacts,
    leads: state.leads,
    cases: state.cases,
    ensurePackages,
    ensureCategories,
    ensureContacts,
    ensureLeads,
    ensureCases,
    upsertPackage,
    removePackage,
    resetPackages,
    upsertCategory,
    removeCategory,
    resetCategories,
    updateContacts,
    resetContacts,
    addCase,
    updateCase,
    removeCase,
    resetCases,
    clearLeads,
  }), [
    state,
    ensurePackages,
    ensureCategories,
    ensureContacts,
    ensureLeads,
    ensureCases,
    upsertPackage,
    removePackage,
    resetPackages,
    upsertCategory,
    removeCategory,
    resetCategories,
    updateContacts,
    resetContacts,
    addCase,
    updateCase,
    removeCase,
    resetCases,
    clearLeads,
  ]);

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
};

export const useAdminData = () => {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData must be used within AdminDataProvider');
  return ctx;
};
