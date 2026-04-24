import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  ClipboardList,
  Download,
  ExternalLink,
  FileJson,
  Inbox,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useLeads } from '../../hooks/useLeads';
import type { LeadDeliveryLogEntry, LeadLog } from '../../types/leads';
import { Button, ConfirmModal, EmptyState, Input, LoadingState } from '../../components/admin/ui';
import { useI18n } from '../../context/I18nContext';
import { adminLeadsContent as adminLeadsContentStatic, getAdminLeadsContent } from '../../content/pages/adminLeads';

let adminLeadsContent = adminLeadsContentStatic;
let localeTag = 'ru-RU';

const formatStatusLabel = (status?: string) => {
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

const entryStatusLabel = (status: LeadDeliveryLogEntry['status']) =>
  adminLeadsContent.entryStatusLabels[status];

const statusClasses: Record<string, string> = {
  queued: 'border-slate-400/30 bg-slate-400/10 text-slate-200',
  processing: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  delivered: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
  partial: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  failed: 'border-red-400/30 bg-red-400/10 text-red-100',
  default: 'border-white/10 bg-white/5 text-slate-200',
};

const entryStatusClasses: Record<LeadDeliveryLogEntry['status'], string> = {
  pending: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
  warning: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  error: 'border-red-400/30 bg-red-400/10 text-red-100',
};

const channelLabels: Record<LeadDeliveryLogEntry['channel'], string> = {
  system: adminLeadsContent.channelLabels.system,
  api: adminLeadsContent.channelLabels.api,
  telegram: adminLeadsContent.channelLabels.telegram,
  email: adminLeadsContent.channelLabels.email,
  'client-email': adminLeadsContent.channelLabels['client-email'],
  database: adminLeadsContent.channelLabels.database,
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(localeTag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(localeTag, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const formatShortDate = (value: string) =>
  new Date(value).toLocaleDateString(localeTag, {
    day: '2-digit',
    month: 'short',
  });

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString(localeTag, {
    hour: '2-digit',
    minute: '2-digit',
  });

const notifyLeadReadStateChanged = () => {
  window.dispatchEvent(new Event('future-screen:leads-read-state-changed'));
};

const LeadLogModal = ({
  log,
  onClose,
}: {
  log: LeadLog | null;
  onClose: () => void;
}) => {
  if (!log) return null;

  const entries = [...(log.deliveryLog ?? [])].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="relative max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div>
            <div className="text-lg font-semibold text-white">{adminLeadsContent.logModal.title}</div>
            <div className="mt-1 text-sm text-slate-400">
              {log.name} · {log.phone}
            </div>
            {log.requestId ? (
              <div className="mt-1 text-xs text-slate-500">
                {adminLeadsContent.requestId.label}: {log.requestId}
              </div>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {adminLeadsContent.logModal.close}
          </Button>
        </div>

        <div className="max-h-[calc(85vh-80px)] space-y-4 overflow-y-auto px-6 py-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">{adminLeadsContent.logModal.cards.status}</div>
              <div className="text-sm font-medium text-white">{formatStatusLabel(log.status)}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">{adminLeadsContent.logModal.cards.created}</div>
              <div className="text-sm font-medium text-white">{formatDateTime(log.timestamp)}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">{adminLeadsContent.logModal.cards.steps}</div>
              <div className="text-sm font-medium text-white">{entries.length}</div>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              {adminLeadsContent.logModal.empty}
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <div key={`${entry.at}-${entry.step}-${index}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full border px-2 py-0.5 font-medium ${entryStatusClasses[entry.status]}`}>
                      {entryStatusLabel(entry.status)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-slate-900 px-2 py-0.5 text-slate-300">
                      {channelLabels[entry.channel]}
                    </span>
                    <span className="text-slate-500">{formatDateTime(entry.at)}</span>
                    <span className="text-slate-500">· {entry.step}</span>
                  </div>
                  <div className="mt-1 text-sm text-white">{entry.message}</div>
                  {entry.details ? (
                    <div className="mt-1 rounded border border-white/10 bg-slate-950/70 px-2 py-1 text-xs text-slate-300">
                      {entry.details}
                    </div>
                  ) : null}
                  {entry.meta && Object.keys(entry.meta).length > 0 ? (
                    <div className="mt-1 grid gap-1 md:grid-cols-2 xl:grid-cols-3">
                      {Object.entries(entry.meta).map(([key, value]) => (
                        <div key={key} className="rounded border border-white/10 bg-slate-950/70 px-2 py-1 text-xs">
                          <span className="text-slate-500">{key}:</span> <span className="text-slate-300">{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LeadDetailsDrawer = ({
  log,
  onClose,
  onOpenLog,
}: {
  log: LeadLog | null;
  onClose: () => void;
  onOpenLog: (log: LeadLog) => void;
}) => {
  if (!log) return null;

  const entries = [...(log.deliveryLog ?? [])].sort((a, b) => a.at.localeCompare(b.at));
  const latestEntries = entries.slice(-4).reverse();
  const statusClass = statusClasses[log.status ?? 'default'] ?? statusClasses.default;
  const extraEntries = Object.entries(log.extra ?? {});
  const contacts = [
    { label: adminLeadsContent.leadCard.fields.phone, value: log.phone, href: `tel:${log.phone}` },
    log.email ? { label: adminLeadsContent.leadCard.fields.email, value: log.email, href: `mailto:${log.email}` } : null,
    log.telegram ? { label: adminLeadsContent.leadCard.fields.telegram, value: log.telegram } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; href?: string }>;
  const requestDetails = [
    log.city ? { label: adminLeadsContent.leadCard.fields.city, value: log.city } : null,
    log.date ? { label: adminLeadsContent.leadCard.fields.date, value: log.date } : null,
    log.format ? { label: adminLeadsContent.leadCard.fields.format, value: log.format } : null,
    log.comment ? { label: adminLeadsContent.leadCard.fields.comment, value: log.comment } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  const origins = [
    log.pagePath ? { label: adminLeadsContent.detailsDrawer.fields.pagePath, value: log.pagePath, href: log.pagePath } : null,
    log.referrer ? { label: adminLeadsContent.detailsDrawer.fields.referrer, value: log.referrer, href: log.referrer } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; href: string }>;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/60"
        aria-label={adminLeadsContent.detailsDrawer.close}
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-slate-950 shadow-2xl">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase text-slate-500">{adminLeadsContent.detailsDrawer.title}</div>
              <h2 className="mt-1 truncate text-xl font-semibold text-white">{log.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClass}`}>
                  {formatStatusLabel(log.status)}
                </span>
                <span className="rounded-md bg-brand-500/10 px-2 py-0.5 text-[11px] text-brand-100">{log.source}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              title={adminLeadsContent.detailsDrawer.close}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
            <div>
              <span className="text-slate-500">{adminLeadsContent.detailsDrawer.fields.created}: </span>
              <span className="text-slate-200">{formatDateTime(log.timestamp)}</span>
            </div>
            {log.requestId ? (
              <div className="min-w-0 truncate">
                <span className="text-slate-500">{adminLeadsContent.requestId.label}: </span>
                <span className="text-slate-200">{log.requestId}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <section>
            <div className="mb-2 text-xs font-semibold uppercase text-slate-500">{adminLeadsContent.detailsDrawer.sections.contacts}</div>
            <div className="grid gap-2">
              {contacts.map((item) => (
                item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                  >
                    <span className="text-slate-500">{item.label}</span>
                    <span className="truncate text-right text-white">{item.value}</span>
                  </a>
                ) : (
                  <div key={item.label} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="truncate text-right text-white">{item.value}</span>
                  </div>
                )
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2 text-xs font-semibold uppercase text-slate-500">{adminLeadsContent.detailsDrawer.sections.origin}</div>
            {origins.length > 0 ? (
              <div className="grid gap-2">
                {origins.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                  >
                    <span className="text-slate-500">{item.label}</span>
                    <span className="flex min-w-0 items-center gap-2 text-right text-white">
                      <span className="truncate">{item.value}</span>
                      <ExternalLink size={13} className="shrink-0 text-slate-500" />
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-500">
                {adminLeadsContent.leadCard.fields.noOrigin}
              </div>
            )}
          </section>

          <section>
            <div className="mb-2 text-xs font-semibold uppercase text-slate-500">{adminLeadsContent.detailsDrawer.sections.request}</div>
            {requestDetails.length > 0 ? (
              <div className="grid gap-2">
                {requestDetails.map((item) => (
                  <div key={item.label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    <div className="text-xs text-slate-500">{item.label}</div>
                    <div className="mt-1 whitespace-pre-wrap text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-500">
                {adminLeadsContent.leadCard.fields.noDetails}
              </div>
            )}
          </section>

          {extraEntries.length > 0 ? (
            <section>
              <div className="mb-2 text-xs font-semibold uppercase text-slate-500">{adminLeadsContent.detailsDrawer.sections.extra}</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {extraEntries.map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    <div className="text-xs text-slate-500">{key}</div>
                    <div className="mt-1 text-white">{value}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-xs font-semibold uppercase text-slate-500">{adminLeadsContent.detailsDrawer.sections.delivery}</div>
              <button
                type="button"
                onClick={() => onOpenLog(log)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
              >
                <ClipboardList size={13} />
                {adminLeadsContent.detailsDrawer.actions.openLog}
              </button>
            </div>
            {latestEntries.length > 0 ? (
              <div className="space-y-2">
                {latestEntries.map((entry, index) => (
                  <div key={`${entry.at}-${entry.step}-${index}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded-full border px-2 py-0.5 font-medium ${entryStatusClasses[entry.status]}`}>
                        {entryStatusLabel(entry.status)}
                      </span>
                      <span className="text-slate-500">{channelLabels[entry.channel]}</span>
                      <span className="text-slate-500">{formatDateTime(entry.at)}</span>
                    </div>
                    <div className="mt-1 text-sm text-white">{entry.message}</div>
                    {entry.details ? <div className="mt-1 text-xs text-slate-400">{entry.details}</div> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-500">
                {adminLeadsContent.leadCard.fields.noLog}
              </div>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
};

const LeadCard = ({
  log,
  onOpenDetails,
  onOpenLog,
  onDelete,
  deleteTitle,
}: {
  log: LeadLog;
  onOpenDetails: (log: LeadLog) => void;
  onOpenLog: (log: LeadLog) => void;
  onDelete: (log: LeadLog) => void;
  deleteTitle: string;
}) => {
  const time = formatTime(log.timestamp);
  const lastEntry = log.deliveryLog?.[log.deliveryLog.length - 1];
  const statusClass = statusClasses[log.status ?? 'default'] ?? statusClasses.default;
  const hasDetails = Boolean(log.city || log.date || log.format || log.comment || (log.extra && Object.keys(log.extra).length > 0));
  const origin = log.pagePath || log.referrer || '';

  return (
    <article
      className="cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-slate-800/90 shadow-sm transition hover:border-brand-500/30 hover:bg-slate-800 focus-within:border-brand-500/30"
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetails(log)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetails(log);
        }
      }}
    >
      <div className="grid gap-3 px-3 py-2.5 xl:grid-cols-[minmax(170px,1fr)_minmax(190px,1fr)_minmax(180px,0.9fr)_minmax(230px,1.2fr)_minmax(170px,0.9fr)_76px] xl:items-center">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">{log.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-brand-500/10 px-2 py-0.5 text-[11px] text-brand-100">{log.source}</span>
            <span className="text-xs text-slate-500">{formatShortDate(log.timestamp)} · {time}</span>
          </div>
          {log.requestId ? (
            <div className="mt-1 truncate text-xs text-slate-500">
              {adminLeadsContent.requestId.label}: {log.requestId}
            </div>
          ) : null}
        </div>

        <div className="min-w-0 space-y-0.5 text-xs">
          <a href={`tel:${log.phone}`} onClick={(event) => event.stopPropagation()} className="flex items-center gap-2 text-white hover:text-brand-100">
            <Phone size={13} className="text-slate-500" />
            <span className="truncate">{log.phone}</span>
          </a>
          {log.email ? (
            <a href={`mailto:${log.email}`} onClick={(event) => event.stopPropagation()} className="flex items-center gap-2 text-slate-300 hover:text-brand-100">
              <Mail size={13} className="text-slate-500" />
              <span className="truncate">{log.email}</span>
            </a>
          ) : null}
          {log.telegram ? (
            <div className="flex items-center gap-2 text-slate-300">
              <MessageCircle size={13} className="text-slate-500" />
              <span className="truncate">{log.telegram}</span>
            </div>
          ) : null}
        </div>

        <div className="min-w-0 text-xs">
          <div className="truncate text-slate-300">{origin || adminLeadsContent.leadCard.fields.noOrigin}</div>
          {log.referrer && log.pagePath ? (
            <div className="mt-0.5 truncate text-[11px] text-slate-500">
              {adminLeadsContent.leadCard.fields.referrer}: {log.referrer}
            </div>
          ) : null}
        </div>

        <div className="min-w-0 space-y-0.5 text-xs">
          {hasDetails ? (
            <>
              {log.city ? (
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin size={13} className="text-slate-500" />
                  <span className="truncate">{log.city}</span>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                {log.date ? <span>{adminLeadsContent.leadCard.fields.date}: {log.date}</span> : null}
                {log.format ? <span>{adminLeadsContent.leadCard.fields.format}: {log.format}</span> : null}
              </div>
              {log.comment ? <div className="line-clamp-1 text-[11px] text-slate-400">{log.comment}</div> : null}
              {log.extra && Object.keys(log.extra).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(log.extra).slice(0, 3).map(([key, value]) => (
                    <span key={key} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <span className="text-xs text-slate-500">{adminLeadsContent.leadCard.fields.noDetails}</span>
          )}
        </div>

        <div className="min-w-0">
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClass}`}>
            {formatStatusLabel(log.status)}
          </span>
          {lastEntry ? (
            <div className="mt-1 text-xs">
              <div className="line-clamp-1 text-slate-300">{lastEntry.message}</div>
              <div className="mt-0.5 text-slate-500">
                {channelLabels[lastEntry.channel]} · {formatTime(lastEntry.at)}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-500">{adminLeadsContent.leadCard.fields.noLog}</div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 xl:justify-end">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenLog(log);
            }}
            title={adminLeadsContent.leadCard.actions.log}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
          >
            <ClipboardList size={14} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(log);
            }}
            title={deleteTitle}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/30 bg-red-500/10 text-red-100 hover:border-red-400/60"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
};

const LeadMetricCard = ({
  label,
  value,
  hint,
  Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  Icon: LucideIcon;
}) => (
  <div className="rounded-xl border border-white/10 bg-slate-800 p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-xs font-medium text-slate-400">{label}</div>
        <div className="mt-1 text-2xl font-bold text-white">{value}</div>
        <div className="mt-1 text-xs text-slate-500">{hint}</div>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10">
        <Icon size={18} className="text-brand-300" />
      </div>
    </div>
  </div>
);

const AdminLeadsPage = () => {
  const { adminLocale } = useI18n();
  adminLeadsContent = getAdminLeadsContent(adminLocale);
  localeTag = adminLocale === 'ru' ? 'ru-RU' : 'en-US';
  const { leads, loading, error: leadsError, clearLeads, deleteLead, markAllRead, markRead } = useLeads();
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState(filter);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearSubmitting, setClearSubmitting] = useState(false);
  const [markAllReadSubmitting, setMarkAllReadSubmitting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LeadLog | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeadLog | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const deleteCopy = adminLocale === 'ru'
    ? {
        title: 'Скрыть заявку?',
        description: (name: string) => `Заявка «${name}» будет скрыта из активного списка.`,
        action: 'Скрыть',
        success: 'Заявка скрыта',
        error: 'Не удалось скрыть заявку',
      }
    : {
        title: 'Hide lead?',
        description: (name: string) => `Lead "${name}" will be hidden from the active list.`,
        action: 'Hide',
        success: 'Lead hidden',
        error: 'Failed to hide lead',
      };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedFilter(filter);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [filter]);

  const handleClearConfirm = async () => {
    setClearSubmitting(true);
    try {
      const ok = await clearLeads();
      if (ok) {
        toast.success(adminLeadsContent.toasts.clearSuccess);
        setClearModalOpen(false);
      } else {
        toast.error(adminLeadsContent.toasts.clearError);
      }
    } finally {
      setClearSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      const ok = await deleteLead(deleteTarget.id);
      if (ok) {
        toast.success(deleteCopy.success);
        setDeleteTarget(null);
      } else {
        toast.error(deleteCopy.error);
      }
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkAllReadSubmitting(true);
    try {
      const ok = await markAllRead();
      if (ok) {
        toast.success(adminLeadsContent.toasts.markAllReadSuccess);
        notifyLeadReadStateChanged();
      } else {
        toast.error(adminLeadsContent.toasts.markAllReadError);
      }
    } finally {
      setMarkAllReadSubmitting(false);
    }
  };

  const handleOpenDetails = (log: LeadLog) => {
    setSelectedLead(log);
    if (!log.readAt) {
      void markRead(log.id).then((ok) => {
        if (ok) notifyLeadReadStateChanged();
      });
    }
  };

  const handleOpenLog = (log: LeadLog) => {
    setSelectedLog(log);
    if (!log.readAt) {
      void markRead(log.id).then((ok) => {
        if (ok) notifyLeadReadStateChanged();
      });
    }
  };

  const resetFilters = () => {
    setFilter('');
    setSelectedSource('all');
    setDebouncedFilter('');
  };

  const exportLogs = () => {
    try {
      const dataBlob = new Blob([JSON.stringify(leads, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(adminLeadsContent.toasts.exportJsonSuccess);
    } catch {
      toast.error(adminLeadsContent.toasts.exportJsonError);
    }
  };

  const exportCSV = () => {
    try {
      const headers = adminLeadsContent.csvHeaders;

      // M12: CSV injection. Excel / Google Sheets treat a cell that starts
      // with =, +, -, @, tab or CR as a formula. A lead whose name is
      // `=HYPERLINK("http://evil/",...)` would execute on open. Always
      // quote every cell, escape embedded quotes, and prefix the
      // dangerous leading characters with a single quote so spreadsheets
      // render them as text.
      const csvEscape = (value: unknown): string => {
        const str = value === null || value === undefined ? '' : String(value);
        const needsPrefix = /^[=+\-@\t\r]/.test(str);
        const safe = needsPrefix ? `'${str}` : str;
        return `"${safe.replace(/"/g, '""')}"`;
      };

      const rows = leads.map((lead) => [
        csvEscape(lead.id),
        csvEscape(lead.requestId ?? ''),
        csvEscape(new Date(lead.timestamp).toLocaleDateString(localeTag)),
        csvEscape(new Date(lead.timestamp).toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' })),
        csvEscape(lead.source),
        csvEscape(lead.status ?? ''),
        csvEscape(lead.name),
        csvEscape(lead.phone),
        csvEscape(lead.email ?? ''),
        csvEscape(lead.telegram ?? ''),
        csvEscape(lead.city ?? ''),
        csvEscape(lead.date ?? ''),
        csvEscape(lead.format ?? ''),
        csvEscape(lead.comment ?? ''),
      ]);

      const content = [headers.map(csvEscape).join(';'), ...rows.map((row) => row.join(';'))].join('\n');
      const dataBlob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(adminLeadsContent.toasts.exportCsvSuccess);
    } catch {
      toast.error(adminLeadsContent.toasts.exportCsvError);
    }
  };

  const sources = Array.from(new Set(leads.map((lead) => lead.source)));

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayLeads = leads.filter((lead) => new Date(lead.timestamp) >= today).length;
    const failedLeads = leads.filter((lead) => lead.status === 'failed').length;
    const withContacts = leads.filter((lead) => lead.email || lead.telegram).length;

    return {
      total: leads.length,
      today: todayLeads,
      sources: new Set(leads.map((lead) => lead.source)).size,
      failed: failedLeads,
      contactRate: leads.length > 0 ? Math.round((withContacts / leads.length) * 100) : 0,
    };
  }, [leads]);

  const unreadCount = useMemo(() => leads.filter((lead) => !lead.readAt).length, [leads]);

  const filteredLogs = useMemo(
    () =>
      leads.filter((lead) => {
        const query = debouncedFilter.trim().toLowerCase();
        const matchesQuery =
          !query ||
          lead.name.toLowerCase().includes(query) ||
          lead.phone.includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.city?.toLowerCase().includes(query) ||
          lead.requestId?.toLowerCase().includes(query);

        const matchesSource = selectedSource === 'all' || lead.source === selectedSource;
        return matchesQuery && matchesSource;
      }),
    [debouncedFilter, leads, selectedSource],
  );

  const logsByDate = filteredLogs.reduce<Record<string, LeadLog[]>>((acc, lead) => {
    const date = formatDate(lead.timestamp);
    if (!acc[date]) acc[date] = [];
    acc[date].push(lead);
    return acc;
  }, {});

  return (
    <AdminLayout title={adminLeadsContent.layout.title} subtitle={adminLeadsContent.layout.subtitle}>
      <ConfirmModal
        open={clearModalOpen}
        danger
        title={adminLeadsContent.confirm.clearTitle}
        description={adminLeadsContent.confirm.clearDescription}
        confirmText={adminLeadsContent.confirm.clearConfirm}
        cancelText={adminLeadsContent.confirm.cancel}
        confirmDisabled={clearSubmitting}
        onCancel={() => setClearModalOpen(false)}
        onConfirm={() => handleClearConfirm()}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        danger
        title={deleteCopy.title}
        description={deleteTarget ? deleteCopy.description(deleteTarget.name) : ''}
        confirmText={deleteCopy.action}
        cancelText={adminLeadsContent.confirm.cancel}
        confirmDisabled={deleteSubmitting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <LeadLogModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      <LeadDetailsDrawer
        log={selectedLead}
        onClose={() => setSelectedLead(null)}
        onOpenLog={(log) => {
          setSelectedLead(null);
          setSelectedLog(log);
        }}
      />

      {loading ? (
        <div className="mb-4">
          <LoadingState title={adminLeadsContent.loading.title} description={adminLeadsContent.loading.description} />
        </div>
      ) : null}
      {leadsError ? <div className="mb-4 text-sm text-red-400">{adminLeadsContent.errors.prefix}: {leadsError}</div> : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LeadMetricCard
          label={adminLeadsContent.stats.total}
          value={stats.total}
          hint={adminLeadsContent.summary.shown(filteredLogs.length, leads.length)}
          Icon={Inbox}
        />
        <LeadMetricCard
          label={adminLeadsContent.stats.today}
          value={stats.today}
          hint={adminLeadsContent.stats.todayHint}
          Icon={CalendarDays}
        />
        <LeadMetricCard
          label={adminLeadsContent.stats.sources}
          value={stats.sources}
          hint={adminLeadsContent.stats.sourcesHint}
          Icon={SlidersHorizontal}
        />
        <LeadMetricCard
          label={adminLeadsContent.stats.contactRate}
          value={`${stats.contactRate}%`}
          hint={stats.failed > 0 ? adminLeadsContent.stats.failedHint(stats.failed) : adminLeadsContent.stats.contactRateHint}
          Icon={Phone}
        />
      </div>

      <div className="mb-6 rounded-xl border border-white/10 bg-slate-800 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">{adminLeadsContent.toolbar.title}</div>
            <div className="mt-1 text-xs text-slate-400">{adminLeadsContent.toolbar.subtitle}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={exportCSV}>
              {adminLeadsContent.actions.exportCsv}
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<FileJson size={14} />} onClick={exportLogs}>
              {adminLeadsContent.actions.exportJson}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Inbox size={14} />}
              onClick={() => void handleMarkAllRead()}
              loading={markAllReadSubmitting}
              disabled={unreadCount === 0}
            >
              {adminLeadsContent.actions.markAllRead}
            </Button>
            <Button variant="danger" size="sm" onClick={() => setClearModalOpen(true)}>
              {adminLeadsContent.actions.clearAll}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
          <label className="text-sm text-slate-200">
            <span className="mb-1 flex items-center gap-2">
              <Search size={14} className="text-slate-500" />
              {adminLeadsContent.filters.searchLabel}
            </span>
            <Input
              type="text"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder={adminLeadsContent.filters.searchPlaceholder}
            />
          </label>
          <label className="text-sm text-slate-200">
            <span className="mb-1 flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-slate-500" />
              {adminLeadsContent.filters.sourceLabel}
            </span>
            <select
              value={selectedSource}
              onChange={(event) => setSelectedSource(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="all">{adminLeadsContent.filters.sourceAll}</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          {filter.trim() ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{adminLeadsContent.chips.search(filter.trim())}</span> : null}
          {selectedSource !== 'all' ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{adminLeadsContent.chips.source(selectedSource)}</span>
          ) : null}
          {filter.trim() || selectedSource !== 'all' ? (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300 hover:text-white"
            >
              {adminLeadsContent.chips.reset}
            </button>
          ) : null}
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={<Trash2 size={32} className="text-brand-400" />}
          title={leads.length === 0 ? adminLeadsContent.empty.noLeadsTitle : adminLeadsContent.empty.notFoundTitle}
          description={
            leads.length === 0
              ? adminLeadsContent.empty.noLeadsDescription
              : adminLeadsContent.empty.notFoundDescription
          }
        />
      ) : (
        <div className="space-y-5">
          {Object.entries(logsByDate).map(([date, dateLogs]) => (
            <section key={date}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-300">{date}</div>
                <div className="text-xs text-slate-500">{dateLogs.length}</div>
              </div>
              <div className="mb-1.5 hidden rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-500 xl:grid xl:grid-cols-[minmax(170px,1fr)_minmax(190px,1fr)_minmax(180px,0.9fr)_minmax(230px,1.2fr)_minmax(170px,0.9fr)_76px]">
                <span>{adminLeadsContent.table.client}</span>
                <span>{adminLeadsContent.table.contacts}</span>
                <span>{adminLeadsContent.table.origin}</span>
                <span>{adminLeadsContent.table.request}</span>
                <span>{adminLeadsContent.table.delivery}</span>
                <span className="text-right">{adminLeadsContent.table.actions}</span>
              </div>
              <div className="grid gap-2">
                {dateLogs.map((log) => (
                  <LeadCard
                    key={log.id}
                    log={log}
                    onOpenDetails={handleOpenDetails}
                    onOpenLog={handleOpenLog}
                    onDelete={setDeleteTarget}
                    deleteTitle={deleteCopy.action}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminLeadsPage;
