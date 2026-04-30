import { adminLeadsContent as adminLeadsContentStatic, getAdminLeadsContent } from '../../../content/pages/adminLeads';
import type { LeadDeliveryLogEntry } from '../../../types/leads';

export let adminLeadsContent = adminLeadsContentStatic;
export let localeTag = 'ru-RU';

export type AdminLeadsContent = ReturnType<typeof getAdminLeadsContent>;

export const formatStatusLabel = (status?: string) => {
  switch (status) {
    case 'queued':
      return adminLeadsContent.statusLabels.queued;
    case 'processing':
      return adminLeadsContent.statusLabels.processing;
    case 'delivered':
      return adminLeadsContent.statusLabels.delivered;
    case 'partial':
      return adminLeadsContent.statusLabels.partial;
    case 'failed':
      return adminLeadsContent.statusLabels.failed;
    default:
      return status || adminLeadsContent.statusLabels.newFallback;
  }
};

export const entryStatusLabel = (status: LeadDeliveryLogEntry['status']) =>
  adminLeadsContent.entryStatusLabels[status];

export const channelLabel = (channel: LeadDeliveryLogEntry['channel']) =>
  adminLeadsContent.channelLabels[channel];

export const statusClasses: Record<string, string> = {
  queued: 'border-slate-400/30 bg-slate-400/10 text-slate-200',
  processing: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  delivered: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
  partial: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  failed: 'border-red-400/30 bg-red-400/10 text-red-100',
  default: 'border-white/10 bg-white/[0.04] text-slate-200',
};

export const entryStatusClasses: Record<LeadDeliveryLogEntry['status'], string> = {
  pending: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
  warning: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  error: 'border-red-400/30 bg-red-400/10 text-red-100',
};

export const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(localeTag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(localeTag, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

export const formatShortDate = (value: string) =>
  new Date(value).toLocaleDateString(localeTag, {
    day: '2-digit',
    month: 'short',
  });

export const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString(localeTag, {
    hour: '2-digit',
    minute: '2-digit',
  });

export const notifyLeadReadStateChanged = () => {
  window.dispatchEvent(new Event('future-screen:leads-read-state-changed'));
};

export const setAdminLeadsRuntime = (content: AdminLeadsContent, adminLocale: string) => {
  adminLeadsContent = content;
  localeTag = adminLocale === 'ru' ? 'ru-RU' : 'en-US';
};
