import { useLeadsQuery, useClearLeadsMutation, useDeleteLeadMutation } from '../queries';
import { mapLeadFromDB } from '../lib/mappers';
import type { LeadLog } from '../types/leads';

export const useLeads = () => {
  const { data: leadsRaw, isLoading, error } = useLeadsQuery();
  const clearMutation = useClearLeadsMutation();
  const deleteMutation = useDeleteLeadMutation();

  const leads: LeadLog[] = leadsRaw?.map(mapLeadFromDB) ?? [];

  const clearLeads = async () => {
    try {
      await clearMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  };

  const deleteLead = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return {
    leads,
    loading: isLoading,
    error: error?.message ?? null,
    loadLeads: async () => {}, // React Query автоматически загружает
    clearLeads,
    deleteLead,
  };
};
