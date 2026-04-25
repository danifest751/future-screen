import type { LeadLog } from '../types/leads';

export type LeadQuickPreset = 'all' | 'unread' | 'today' | 'week' | 'failed';

const startOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const daysAgo = (date: Date, days: number): Date => {
  const d = startOfDay(date);
  d.setDate(d.getDate() - days);
  return d;
};

export const matchesPreset = (lead: LeadLog, preset: LeadQuickPreset, now: Date = new Date()): boolean => {
  switch (preset) {
    case 'all':
      return true;
    case 'unread':
      return !lead.readAt;
    case 'today':
      return new Date(lead.timestamp) >= startOfDay(now);
    case 'week':
      return new Date(lead.timestamp) >= daysAgo(now, 6); // last 7 days inclusive
    case 'failed':
      return lead.status === 'failed' || lead.status === 'partial';
    default:
      return true;
  }
};

export const countByPreset = (leads: LeadLog[], now: Date = new Date()): Record<LeadQuickPreset, number> => ({
  all: leads.length,
  unread: leads.filter((l) => matchesPreset(l, 'unread', now)).length,
  today: leads.filter((l) => matchesPreset(l, 'today', now)).length,
  week: leads.filter((l) => matchesPreset(l, 'week', now)).length,
  failed: leads.filter((l) => matchesPreset(l, 'failed', now)).length,
});

/**
 * Map a raw `pagePath` like "/admin/services" or `source` like
 * "callback_form" to a short, admin-readable channel label.
 *
 * The source field is already free-form (it's whatever the form sets);
 * what we add is a *normalization layer* so that admins see "Главная"
 * instead of "/" or "Хедер" instead of "header_button". Falls back to
 * the original value when no rule matches.
 */
export interface SourceLabelDict {
  paths: Record<string, string>;
  sources: Record<string, string>;
  fallback: (raw: string) => string;
}

export const humanizeLeadSource = (lead: LeadLog, dict: SourceLabelDict): string => {
  const sourceKey = lead.source?.trim().toLowerCase() ?? '';
  if (sourceKey && dict.sources[sourceKey]) return dict.sources[sourceKey];

  const pathKey = (lead.pagePath ?? '').split('?')[0].split('#')[0].replace(/\/+$/, '').toLowerCase();
  if (pathKey === '' && lead.pagePath !== undefined) {
    if (dict.paths['/']) return dict.paths['/'];
  }
  if (pathKey && dict.paths[pathKey]) return dict.paths[pathKey];

  return dict.fallback(lead.source || lead.pagePath || '');
};
