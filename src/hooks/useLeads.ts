import {
  useLeadsQuery,
  useClearLeadsMutation,
  useDeleteLeadMutation,
  useMarkAllLeadsReadMutation,
  useMarkLeadReadMutation,
} from '../queries';
import { mapLeadFromDB } from '../lib/mappers';
import type { LeadLog } from '../types/leads';

export const useLeads = () => {
  const { data: leadsPage, isLoading, error } = useLeadsQuery();
  const clearMutation = useClearLeadsMutation();
  const deleteMutation = useDeleteLeadMutation();
  const markAllReadMutation = useMarkAllLeadsReadMutation();
  const markReadMutation = useMarkLeadReadMutation();

  const leads: LeadLog[] = leadsPage?.items.map(mapLeadFromDB) ?? [];

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

  const markAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  };

  const markRead = async (id: string) => {
    try {
      await markReadMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return {
    leads,
    total: leadsPage?.total ?? leads.length,
    loading: isLoading,
    error: error?.message ?? null,
    loadLeads: async () => {}, // React Query loads leads automatically.
    clearLeads,
    deleteLead,
    markAllRead,
    markRead,
  };
};
