import { useCasesQuery, useCreateCaseMutation, useUpdateCaseMutation, useDeleteCaseMutation, useResetCasesMutation } from '../queries';
import { mapCaseFromDB, mapCaseToDB } from '../lib/mappers';
import type { Database } from '../lib/database.types';
import type { CaseItem } from '../data/cases';
import type { Locale } from '../i18n/types';

type CaseRow = Database['public']['Tables']['cases']['Row'];

const hasText = (value: string | null | undefined): boolean => typeof value === 'string' && value.trim().length > 0;

const isCaseFallbackFromRu = (row: CaseRow, locale: Locale): boolean => {
  if (locale !== 'en') return false;

  return (
    (hasText(row.title) && !hasText(row.title_en)) ||
    (hasText(row.city) && !hasText(row.city_en)) ||
    (hasText(row.date) && !hasText(row.date_en)) ||
    (hasText(row.format) && !hasText(row.format_en)) ||
    (hasText(row.summary) && !hasText(row.summary_en)) ||
    (hasText(row.metrics) && !hasText(row.metrics_en))
  );
};

export const useCases = (locale: Locale = 'ru', fallbackToRu = true) => {
  const { data: casesRaw, isLoading, error } = useCasesQuery(locale);
  const createMutation = useCreateCaseMutation(locale);
  const updateMutation = useUpdateCaseMutation(locale);
  const deleteMutation = useDeleteCaseMutation();
  const resetMutation = useResetCasesMutation();

  const cases: CaseItem[] = casesRaw?.map((row) => mapCaseFromDB(row, locale, fallbackToRu)) ?? [];
  const getEditorCase = (slug: string): CaseItem | null => {
    const row = casesRaw?.find((item) => item.slug === slug);
    return row ? mapCaseFromDB(row, locale, false) : null;
  };
  const fallbackBySlug = Object.fromEntries(
    (casesRaw ?? []).map((row) => [row.slug, isCaseFallbackFromRu(row, locale)])
  ) as Record<string, boolean>;

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
    getEditorCase,
    fallbackBySlug,
    loading: isLoading,
    error: error?.message ?? null,
    addCase,
    updateCase,
    deleteCase,
    resetToDefault,
  };
};
