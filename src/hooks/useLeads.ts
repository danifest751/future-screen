import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { LeadLog } from '../types/leads';

type LeadRow = {
  id: string;
  created_at: string;
  source: string;
  name: string;
  phone: string;
  email: string | null;
  telegram: string | null;
  city: string | null;
  date: string | null;
  format: string | null;
  comment: string | null;
  extra: Record<string, string> | null;
  page_path: string | null;
  referrer: string | null;
  status: string | null;
};

const mapLeadFromDB = (row: LeadRow): LeadLog => ({
  id: row.id,
  timestamp: row.created_at,
  source: row.source,
  name: row.name,
  phone: row.phone,
  email: row.email ?? undefined,
  telegram: row.telegram ?? undefined,
  city: row.city ?? undefined,
  date: row.date ?? undefined,
  format: row.format ?? undefined,
  comment: row.comment ?? undefined,
  extra: row.extra ?? undefined,
  pagePath: row.page_path ?? undefined,
  referrer: row.referrer ?? undefined,
  status: row.status ?? undefined,
});

export const useLeads = () => {
  const [leads, setLeads] = useState<LeadLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load leads:', error);
        setError(error.message);
        setLeads([]);
      } else {
        setLeads((data ?? []).map((row) => mapLeadFromDB(row as LeadRow)));
        setError(null);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
      setError('Unknown error');
      setLeads([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const clearLeads = useCallback(async () => {
    try {
      const ids = leads.map((lead) => lead.id);
      if (!ids.length) return true;

      const { error } = await supabase.from('leads').delete().in('id', ids);
      if (error) {
        console.error('Failed to clear leads:', error);
        setError(error.message);
        return false;
      }

      setLeads([]);
      setError(null);
      return true;
    } catch (err) {
      console.error('Failed to clear leads:', err);
      setError('Unknown error');
      return false;
    }
  }, [leads]);

  return { leads, loading, error, loadLeads, clearLeads };
};
