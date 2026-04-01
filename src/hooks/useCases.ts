import { useCasesQuery, useCreateCaseMutation, useUpdateCaseMutation, useDeleteCaseMutation, useResetCasesMutation } from '../queries';
import { mapCaseFromDB } from '../lib/mappers';
import type { CaseItem } from '../data/cases';

export const useCases = () => {
  const { data: casesRaw, isLoading, error } = useCasesQuery();
  const createMutation = useCreateCaseMutation();
  const updateMutation = useUpdateCaseMutation();
  const deleteMutation = useDeleteCaseMutation();
  const resetMutation = useResetCasesMutation();

  const cases: CaseItem[] = casesRaw?.map(mapCaseFromDB) ?? [];

  const addCase = async (payload: Omit<CaseItem, 'services'> & { services: string[] }) => {
    try {
      await createMutation.mutateAsync(payload as Parameters<typeof createMutation.mutateAsync>[0]);
      return true;
    } catch {
      return false;
    }
  };

  const updateCase = async (slug: string, payload: Partial<Omit<CaseItem, 'services'>> & { services?: string[] }) => {
    try {
      await updateMutation.mutateAsync({ slug, ...payload } as Parameters<typeof updateMutation.mutateAsync>[0]);
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
