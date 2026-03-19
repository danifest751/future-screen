import { useEffect } from 'react';
import type { LeadLog } from '../types/leads';
import { useAdminData } from '../context/AdminDataContext';

export const useLeads = () => {
  const { leads, ensureLeads, clearLeads } = useAdminData();

  useEffect(() => {
    void ensureLeads();
  }, [ensureLeads]);

  return {
    leads: leads.items,
    loading: leads.loading,
    error: leads.error,
    loadLeads: ensureLeads,
    clearLeads,
  };
};
