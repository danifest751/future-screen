import { useCasesQuery, useCreateCaseMutation, useUpdateCaseMutation, useDeleteCaseMutation, useResetCasesMutation } from '../queries';
import { mapCaseFromDB, mapCaseToDB } from '../lib/mappers';
import type { CaseItem } from '../data/cases';
import type { Locale } from '../i18n/types';

export const useCases = (locale: Locale = 'ru') => {
  const { data: casesRaw, isLoading, error } = useCasesQuery(locale);
  const createMutation = useCreateCaseMutation(locale);
  const updateMutation = useUpdateCaseMutation(locale);
  const deleteMutation = useDeleteCaseMutation();
  const resetMutation = useResetCasesMutation();

  const cases: CaseItem[] = casesRaw?.map((row) => mapCaseFromDB(row, locale)) ?? [];

  const addCase = async (payload: Omit<CaseItem, 'services'> & { services: string[] }) => {
    try {
      const dbPayload = mapCaseToDB(payload, locale, true);
      await createMutation.mutateAsync(dbPayload as Parameters<typeof createMutation.mutateAsync>[0]);
      return true;
    } catch {
      return false;
    }
  };

  const updateCase = async (slug: string, payload: Partial<Omit<CaseItem, 'services'>> & { services?: string[] }) => {
    try {
      const dbPayload = mapCaseToDB({ ...payload, slug }, locale, false);
      await updateMutation.mutateAsync({ slug, ...dbPayload } as Parameters<typeof updateMutation.mutateAsync>[0]);
      return true;
    } catch {
      return false;
    }
  };

  const deleteCase = async (slug: string) => {
    try {
      await deleteMutation.mutateAsync(slug);
      return true;
    } catch {
      return false;
    }
  };

  const resetToDefault = async () => {
    try {
      await resetMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  };

  return {
    cases,
    loading: isLoading,
    error: error?.message ?? null,
    addCase,
    updateCase,
    deleteCase,
    resetToDefault,
  };
};
