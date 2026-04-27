import { useEffect, useMemo, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
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
import { Button, ConfirmModal, FilterPills, Input } from '../../components/admin/ui';
import { useI18n } from '../../context/I18nContext';
import { adminLeadsContent as adminLeadsContentStatic, getAdminLeadsContent } from '../../content/pages/adminLeads';
import { useLeads } from '../../hooks/useLeads';
import { countByPreset, humanizeLeadSource, matchesPreset, type LeadQuickPreset, type SourceLabelDict } from '../../lib/leadFilters';
import type { LeadDeliveryLogEntry, LeadLog } from '../../types/leads';

let adminLeadsContent = adminLeadsContentStatic;
let localeTag = 'ru-RU';

type AdminLeadsContent = ReturnType<typeof getAdminLeadsContent>;

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

const channelLabel = (channel: LeadDeliveryLogEntry['channel']) =>
  adminLeadsContent.channelLabels[channel];

const statusClasses: Record<string, string> = {
  queued: 'border-slate-400/30 bg-slate-400/10 text-slate-200',
  processing: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  delivered: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
  partial: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  failed: 'border-red-400/30 bg-red-400/10 text-red-100',
  default: 'border-white/10 bg-white/[0.04] text-slate-200',
};

const entryStatusClasses: Record<LeadDeliveryLogEntry['status'], string> = {
  pending: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
  warning: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  error: 'border-red-400/30 bg-red-400/10 text-red-100',
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
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-white">{adminLeadsContent.logModal.title}</div>
            <div className="mt-1 truncate text-sm text-slate-400">
              {log.name} <span className="text-slate-600">·</span> {log.phone}
            </div>
            {log.requestId ? (
              <div className="mt-1 truncate font-mono text-xs text-slate-500">
                {adminLeadsContent.requestId.label}: {log.requestId}
              </div>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {adminLeadsContent.logModal.close}
          </Button>
        </div>

        <div className="max-h-[calc(85vh-80px)] space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 md:grid-cols-3">
            <LogSummaryCard label={adminLeadsContent.logModal.cards.status} value={formatStatusLabel(log.status)} />
            <LogSummaryCard label={adminLeadsContent.logModal.cards.created} value={formatDateTime(log.timestamp)} />
            <LogSummaryCard label={adminLeadsContent.logModal.cards.steps} value={entries.length} />
          </div>

          {entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
              {adminLeadsContent.logModal.empty}
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <div key={`${entry.at}-${entry.step}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full border px-2 py-0.5 font-medium ${entryStatusClasses[entry.status]}`}>
                      {entryStatusLabel(entry.status)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-slate-900 px-2 py-0.5 text-slate-300">
                      {channelLabel(entry.channel)}
                    </span>
                    <span className="text-slate-500">{formatDateTime(entry.at)}</span>
                    <span className="text-slate-500">· {entry.step}</span>
                  </div>
                  <div className="mt-2 text-sm text-white">{entry.message}</div>
                  {entry.details ? (
                    <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-300">
                      {entry.details}
                    </div>
                  ) : null}
                  {entry.meta && Object.keys(entry.meta).length > 0 ? (
                    <div className="mt-2 grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
                      {Object.entries(entry.meta).map(([key, value]) => (
                        <div key={key} className="rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 text-xs">
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

const LogSummaryCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
    <div className="text-[11px] font-semibold uppercase tracking-normal text-slate-500">{label}</div>
    <div className="mt-1 text-sm font-medium text-white">{value}</div>
  </div>
);

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
              <div className="text-xs font-medium uppercase tracking-normal text-slate-500">{adminLeadsContent.detailsDrawer.title}</div>
              <h2 className="mt-1 truncate text-xl font-semibold text-white">{log.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClass}`}>
                  {formatStatusLabel(log.status)}
                </span>
                <span className="rounded-md border border-emerald-300/15 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-100">{log.source}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              title={adminLeadsContent.detailsDrawer.close}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/10 active:scale-[0.96]"
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
                <span className="font-mono text-slate-200">{log.requestId}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <DrawerSection title={adminLeadsContent.detailsDrawer.sections.contacts}>
            <div className="grid gap-2">
              {contacts.map((item) => (
                item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm transition hover:bg-white/[0.06]"
                  >
                    <span className="text-slate-500">{item.label}</span>
                    <span className="truncate text-right text-white">{item.value}</span>
                  </a>
                ) : (
                  <div key={item.label} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="truncate text-right text-white">{item.value}</span>
                  </div>
                )
              ))}
            </div>
          </DrawerSection>

          <DrawerSection title={adminLeadsContent.detailsDrawer.sections.origin}>
            {origins.length > 0 ? (
              <div className="grid gap-2">
                {origins.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm transition hover:bg-white/[0.06]"
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
              <EmptyInline>{adminLeadsContent.leadCard.fields.noOrigin}</EmptyInline>
            )}
          </DrawerSection>

          <DrawerSection title={adminLeadsContent.detailsDrawer.sections.request}>
            {requestDetails.length > 0 ? (
              <div className="grid gap-2">
                {requestDetails.map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                    <div className="text-xs text-slate-500">{item.label}</div>
                    <div className="mt-1 whitespace-pre-wrap text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyInline>{adminLeadsContent.leadCard.fields.noDetails}</EmptyInline>
            )}
          </DrawerSection>

          {extraEntries.length > 0 ? (
            <DrawerSection title={adminLeadsContent.detailsDrawer.sections.extra}>
              <div className="grid gap-2 sm:grid-cols-2">
                {extraEntries.map(([key, value]) => (
                  <div key={key} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                    <div className="text-xs text-slate-500">{key}</div>
                    <div className="mt-1 text-white">{value}</div>
                  </div>
                ))}
              </div>
            </DrawerSection>
          ) : null}

          <DrawerSection
            title={adminLeadsContent.detailsDrawer.sections.delivery}
            action={(
              <button
                type="button"
                onClick={() => onOpenLog(log)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-slate-200 transition hover:bg-white/10 active:scale-[0.98]"
              >
                <ClipboardList size={13} />
                {adminLeadsContent.detailsDrawer.actions.openLog}
              </button>
            )}
          >
            {latestEntries.length > 0 ? (
              <div className="space-y-2">
                {latestEntries.map((entry, index) => (
                  <div key={`${entry.at}-${entry.step}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded-full border px-2 py-0.5 font-medium ${entryStatusClasses[entry.status]}`}>
                        {entryStatusLabel(entry.status)}
                      </span>
                      <span className="text-slate-500">{channelLabel(entry.channel)}</span>
                      <span className="text-slate-500">{formatDateTime(entry.at)}</span>
                    </div>
                    <div className="mt-1 text-sm text-white">{entry.message}</div>
                    {entry.details ? <div className="mt-1 text-xs text-slate-400">{entry.details}</div> : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyInline>{adminLeadsContent.leadCard.fields.noLog}</EmptyInline>
            )}
          </DrawerSection>
        </div>
      </aside>
    </div>
  );
};

const DrawerSection = ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) => (
  <section>
    <div className="mb-2 flex items-center justify-between gap-3">
      <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">{title}</div>
      {action}
    </div>
    {children}
  </section>
);

const EmptyInline = ({ children }: { children: ReactNode }) => (
  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-slate-500">
    {children}
  </div>
);

const LeadRow = ({
  log,
  onOpenDetails,
  onOpenLog,
  onDelete,
  deleteTitle,
  selected,
  onToggleSelect,
  channelLabelText,
}: {
  log: LeadLog;
  onOpenDetails: (log: LeadLog) => void;
  onOpenLog: (log: LeadLog) => void;
  onDelete: (log: LeadLog) => void;
  deleteTitle: string;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  channelLabelText: string;
}) => {
  const time = formatTime(log.timestamp);
  const lastEntry = log.deliveryLog?.[log.deliveryLog.length - 1];
  const statusClass = statusClasses[log.status ?? 'default'] ?? statusClasses.default;
  const hasDetails = Boolean(log.city || log.date || log.format || log.comment || (log.extra && Object.keys(log.extra).length > 0));
  const origin = log.pagePath || log.referrer || '';

  return (
    <article
      className={`cursor-pointer border-b border-white/10 transition last:border-b-0 focus-within:bg-white/[0.04] hover:bg-white/[0.03] ${
        selected ? 'bg-emerald-400/[0.07]' : ''
      }`}
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
      <div className="grid gap-3 px-3 py-3 xl:grid-cols-[28px_minmax(170px,1fr)_minmax(190px,1fr)_minmax(180px,0.9fr)_minmax(230px,1.2fr)_minmax(170px,0.9fr)_76px] xl:items-center">
        <label
          className="flex h-full items-start pt-0.5"
          onClick={(event) => event.stopPropagation()}
        >
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer accent-emerald-400"
            checked={selected}
            onChange={() => onToggleSelect(log.id)}
            aria-label={`select ${log.name}`}
          />
        </label>

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            {!log.readAt ? <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-300" aria-hidden="true" /> : null}
            <div className="truncate text-sm font-semibold text-white">{log.name}</div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-emerald-300/15 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-100">{log.source}</span>
            <span className="text-xs text-slate-500">{formatShortDate(log.timestamp)} · {time}</span>
          </div>
          {log.requestId ? (
            <div className="mt-1 truncate font-mono text-xs text-slate-500">
              {adminLeadsContent.requestId.label}: {log.requestId}
            </div>
          ) : null}
        </div>

        <div className="min-w-0 space-y-0.5 text-xs">
          <a href={`tel:${log.phone}`} onClick={(event) => event.stopPropagation()} className="flex items-center gap-2 text-white hover:text-emerald-100">
            <Phone size={13} className="text-slate-500" />
            <span className="truncate">{log.phone}</span>
          </a>
          {log.email ? (
            <a href={`mailto:${log.email}`} onClick={(event) => event.stopPropagation()} className="flex items-center gap-2 text-slate-300 hover:text-emerald-100">
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
          {!log.phone && !log.email && !log.telegram ? (
            <div className="text-slate-500">{adminLeadsContent.leadCard.fields.noContact}</div>
          ) : null}
        </div>

        <div className="min-w-0 text-xs">
          <div className="truncate font-medium text-slate-200">{channelLabelText}</div>
          <div className="mt-0.5 truncate text-[11px] text-slate-500">
            {origin || adminLeadsContent.leadCard.fields.noOrigin}
          </div>
          {log.referrer && log.pagePath ? (
            <div className="truncate text-[11px] text-slate-500">
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
                    <span key={key} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-300">
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
                {channelLabel(lastEntry.channel)} · {formatTime(lastEntry.at)}
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-slate-200 transition hover:bg-white/10 active:scale-[0.96]"
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/30 bg-red-500/10 text-red-100 transition hover:border-red-400/60 hover:bg-red-500/15 active:scale-[0.96]"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
};

const StatStripItem = ({ label, value, hint, Icon, tone = 'text-emerald-200' }: {
  label: string;
  value: string | number;
  hint: string;
  Icon: LucideIcon;
  tone?: string;
}) => (
  <div className="group min-h-[112px] p-4 transition hover:bg-white/[0.03]">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">{label}</div>
        <div className="mt-2 font-mono text-3xl font-semibold leading-none text-white">{value}</div>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition group-hover:border-emerald-300/25 group-hover:text-emerald-200">
        <Icon size={18} />
      </div>
    </div>
    <div className={`mt-3 text-xs font-medium ${tone}`}>{hint}</div>
  </div>
);

const ErrorPanel = ({ title, description }: { title: string; description: string }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">
    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
    <div>
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-red-100/75">{description}</div>
    </div>
  </div>
);

const LeadsSkeleton = ({ content }: { content: AdminLeadsContent }) => (
  <div className="space-y-6" aria-busy="true">
    <div>
      <div className="text-sm text-slate-400">{content.loading.title}</div>
      <div className="mt-1 text-xs text-slate-500">{content.loading.description}</div>
    </div>
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45">
      <div className="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="min-h-[112px] p-4">
            <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
            <div className="mt-5 h-8 w-16 animate-pulse rounded-lg bg-white/10" />
            <div className="mt-4 h-3 w-32 animate-pulse rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    </div>
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <div className="h-4 w-36 animate-pulse rounded-full bg-white/10" />
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
        <div className="h-10 animate-pulse rounded-xl bg-white/10" />
        <div className="h-10 animate-pulse rounded-xl bg-white/10" />
      </div>
    </div>
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="border-b border-white/10 px-3 py-3 last:border-b-0">
          <div className="grid gap-3 xl:grid-cols-[28px_minmax(170px,1fr)_minmax(190px,1fr)_minmax(180px,0.9fr)_minmax(230px,1.2fr)_minmax(170px,0.9fr)_76px]">
            <div className="h-4 w-4 animate-pulse rounded bg-white/10" />
            <div className="h-10 animate-pulse rounded-xl bg-white/10" />
            <div className="h-10 animate-pulse rounded-xl bg-white/10" />
            <div className="h-10 animate-pulse rounded-xl bg-white/10" />
            <div className="h-10 animate-pulse rounded-xl bg-white/10" />
            <div className="h-10 animate-pulse rounded-xl bg-white/10" />
            <div className="h-8 animate-pulse rounded-lg bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const EmptyLeadsPanel = ({ title, description }: { title: string; description: string }) => (
  <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-slate-950/35 px-6 py-10 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-emerald-200">
      <Inbox size={20} />
    </div>
    <div>
      <div className="text-base font-semibold text-white">{title}</div>
      <div className="mt-1 max-w-md text-sm text-slate-400">{description}</div>
    </div>
  </div>
);

const AdminLeadsPage = () => {
  const { adminLocale } = useI18n();
  const pageContent = getAdminLeadsContent(adminLocale);
  adminLeadsContent = pageContent;
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
  const [quickPreset, setQuickPreset] = useState<LeadQuickPreset>('all');
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(() => new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const sourceDict: SourceLabelDict = useMemo(() => ({
    paths: pageContent.sourceLabels.paths,
    sources: pageContent.sourceLabels.sources,
    fallback: (raw) => raw || pageContent.sourceLabels.unknown,
  }), [pageContent]);

  const deleteCopy = pageContent.deleteModal;

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

      // Avoid CSV injection in spreadsheet apps while preserving exact data.
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
        return matchesQuery && matchesSource && matchesPreset(lead, quickPreset);
      }),
    [debouncedFilter, leads, selectedSource, quickPreset],
  );

  const presetCounts = useMemo(() => countByPreset(leads), [leads]);

  useEffect(() => {
    setBulkSelected((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(filteredLogs.map((l) => l.id));
      const next = new Set<string>();
      prev.forEach((id) => visible.has(id) && next.add(id));
      return next.size === prev.size ? prev : next;
    });
  }, [filteredLogs]);

  const toggleBulk = (id: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => setBulkSelected(new Set(filteredLogs.map((l) => l.id)));
  const clearBulk = () => setBulkSelected(new Set());

  const handleBulkMarkRead = async () => {
    const targets = filteredLogs.filter((l) => bulkSelected.has(l.id) && !l.readAt);
    if (targets.length === 0) return;
    setBulkSubmitting(true);
    try {
      const results = await Promise.all(targets.map((l) => markRead(l.id)));
      const ok = results.filter(Boolean).length;
      if (ok > 0) {
        toast.success(adminLeadsContent.bulk.markedRead(ok));
        notifyLeadReadStateChanged();
      }
      if (ok < targets.length) {
        toast.error(adminLeadsContent.bulk.error);
      }
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    const ids = Array.from(bulkSelected);
    if (ids.length === 0) return;
    setBulkSubmitting(true);
    try {
      const results = await Promise.all(ids.map((id) => deleteLead(id)));
      const ok = results.filter(Boolean).length;
      if (ok > 0) toast.success(adminLeadsContent.bulk.success(ok));
      if (ok < ids.length) toast.error(adminLeadsContent.bulk.error);
      setBulkSelected(new Set());
      setBulkConfirmOpen(false);
    } finally {
      setBulkSubmitting(false);
    }
  };

  const logsByDate = filteredLogs.reduce<Record<string, LeadLog[]>>((acc, lead) => {
    const date = formatDate(lead.timestamp);
    if (!acc[date]) acc[date] = [];
    acc[date].push(lead);
    return acc;
  }, {});

  const statItems = [
    {
      label: pageContent.stats.total,
      value: stats.total,
      hint: pageContent.summary.shown(filteredLogs.length, leads.length),
      Icon: Inbox,
    },
    {
      label: pageContent.stats.today,
      value: stats.today,
      hint: pageContent.stats.todayHint,
      Icon: CalendarDays,
    },
    {
      label: pageContent.stats.sources,
      value: stats.sources,
      hint: pageContent.stats.sourcesHint,
      Icon: SlidersHorizontal,
    },
    {
      label: pageContent.stats.contactRate,
      value: `${stats.contactRate}%`,
      hint: stats.failed > 0 ? pageContent.stats.failedHint(stats.failed) : pageContent.stats.contactRateHint,
      Icon: Phone,
      tone: stats.failed > 0 ? 'text-amber-200' : 'text-emerald-200',
    },
  ];

  return (
    <AdminLayout title={pageContent.layout.title} subtitle={pageContent.layout.subtitle}>
      <ConfirmModal
        open={clearModalOpen}
        danger
        title={pageContent.confirm.clearTitle}
        description={pageContent.confirm.clearDescription}
        confirmText={pageContent.confirm.clearConfirm}
        cancelText={pageContent.confirm.cancel}
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
        cancelText={pageContent.confirm.cancel}
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
        <LeadsSkeleton content={pageContent} />
      ) : (
        <div className="space-y-6">
          {leadsError ? (
            <ErrorPanel title={pageContent.errors.title} description={`${pageContent.errors.prefix}: ${leadsError}`} />
          ) : null}

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45 shadow-[0_18px_44px_-32px_rgba(0,0,0,0.9)]">
            <div className="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
              {statItems.map((item) => (
                <StatStripItem key={item.label} {...item} />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 shadow-[0_18px_44px_-32px_rgba(0,0,0,0.9)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">{pageContent.toolbar.title}</div>
                <div className="mt-1 max-w-2xl text-xs text-slate-400">{pageContent.toolbar.subtitle}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={exportCSV}>
                  {pageContent.actions.exportCsv}
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<FileJson size={14} />} onClick={exportLogs}>
                  {pageContent.actions.exportJson}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Inbox size={14} />}
                  onClick={() => void handleMarkAllRead()}
                  loading={markAllReadSubmitting}
                  disabled={unreadCount === 0}
                >
                  {pageContent.actions.markAllRead}
                </Button>
                <Button variant="danger" size="sm" onClick={() => setClearModalOpen(true)}>
                  {pageContent.actions.clearAll}
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
              <label className="text-sm text-slate-200">
                <span className="mb-1.5 flex items-center gap-2">
                  <Search size={14} className="text-slate-500" />
                  {pageContent.filters.searchLabel}
                </span>
                <Input
                  type="text"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder={pageContent.filters.searchPlaceholder}
                />
              </label>
              <label className="text-sm text-slate-200">
                <span className="mb-1.5 flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-slate-500" />
                  {pageContent.filters.sourceLabel}
                </span>
                <select
                  value={selectedSource}
                  onChange={(event) => setSelectedSource(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-white transition focus:border-emerald-400 focus:outline-none"
                >
                  <option value="all">{pageContent.filters.sourceAll}</option>
                  {sources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              {filter.trim() ? <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{pageContent.chips.search(filter.trim())}</span> : null}
              {selectedSource !== 'all' ? (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{pageContent.chips.source(selectedSource)}</span>
              ) : null}
              {filter.trim() || selectedSource !== 'all' ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300 transition hover:text-white active:scale-[0.98]"
                >
                  {pageContent.chips.reset}
                </button>
              ) : null}
            </div>

            <FilterPills
              className="mt-3"
              title={pageContent.quickPresets.title}
              active={quickPreset}
              onChange={(preset) => setQuickPreset(preset)}
              pills={[
                { value: 'all', label: pageContent.quickPresets.all, count: presetCounts.all },
                { value: 'unread', label: pageContent.quickPresets.unread, count: presetCounts.unread },
                { value: 'today', label: pageContent.quickPresets.today, count: presetCounts.today },
                { value: 'week', label: pageContent.quickPresets.week, count: presetCounts.week },
                { value: 'failed', label: pageContent.quickPresets.failed, count: presetCounts.failed },
              ]}
            />
          </section>

          {bulkSelected.size > 0 && (
            <div className="sticky top-3 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-400/25 bg-slate-950/95 px-3 py-2 text-xs text-emerald-100 shadow-2xl shadow-black/30 backdrop-blur">
              <span className="font-semibold">{pageContent.bulk.selected(bulkSelected.size)}</span>
              <button
                type="button"
                onClick={selectAllVisible}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-slate-200 transition hover:border-white/30 hover:text-white active:scale-[0.98]"
              >
                {pageContent.bulk.selectAllVisible}
              </button>
              <button
                type="button"
                onClick={clearBulk}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-slate-200 transition hover:border-white/30 hover:text-white active:scale-[0.98]"
              >
                {pageContent.bulk.clear}
              </button>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleBulkMarkRead()}
                  disabled={bulkSubmitting}
                  className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-white transition hover:bg-white/10 disabled:opacity-60 active:scale-[0.98]"
                >
                  {pageContent.bulk.markRead}
                </button>
                <button
                  type="button"
                  onClick={() => setBulkConfirmOpen(true)}
                  disabled={bulkSubmitting}
                  className="rounded-lg border border-red-400/35 bg-red-500/15 px-2.5 py-1 font-medium text-red-100 transition hover:bg-red-500/20 disabled:opacity-60 active:scale-[0.98]"
                >
                  {pageContent.bulk.delete}
                </button>
              </div>
            </div>
          )}

          <ConfirmModal
            open={bulkConfirmOpen}
            danger
            title={pageContent.bulk.confirmTitle(bulkSelected.size)}
            description={pageContent.bulk.confirmDescription}
            confirmText={pageContent.bulk.delete}
            cancelText={pageContent.confirm.cancel}
            confirmDisabled={bulkSubmitting}
            onCancel={() => setBulkConfirmOpen(false)}
            onConfirm={handleBulkDeleteConfirm}
          />

          {filteredLogs.length === 0 ? (
            <EmptyLeadsPanel
              title={leads.length === 0 ? pageContent.empty.noLeadsTitle : pageContent.empty.notFoundTitle}
              description={leads.length === 0 ? pageContent.empty.noLeadsDescription : pageContent.empty.notFoundDescription}
            />
          ) : (
            <div className="space-y-5">
              {Object.entries(logsByDate).map(([date, dateLogs]) => (
                <section key={date}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-300">{date}</div>
                    <div className="font-mono text-xs text-slate-500">{dateLogs.length}</div>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35 shadow-[0_18px_44px_-32px_rgba(0,0,0,0.9)]">
                    <div className="hidden border-b border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold uppercase tracking-normal text-slate-500 xl:grid xl:grid-cols-[28px_minmax(170px,1fr)_minmax(190px,1fr)_minmax(180px,0.9fr)_minmax(230px,1.2fr)_minmax(170px,0.9fr)_76px]">
                      <span />
                      <span>{pageContent.table.client}</span>
                      <span>{pageContent.table.contacts}</span>
                      <span>{pageContent.channelLabel}</span>
                      <span>{pageContent.table.request}</span>
                      <span>{pageContent.table.delivery}</span>
                      <span className="text-right">{pageContent.table.actions}</span>
                    </div>
                    {dateLogs.map((log) => (
                      <LeadRow
                        key={log.id}
                        log={log}
                        onOpenDetails={handleOpenDetails}
                        onOpenLog={handleOpenLog}
                        onDelete={setDeleteTarget}
                        deleteTitle={deleteCopy.action}
                        selected={bulkSelected.has(log.id)}
                        onToggleSelect={toggleBulk}
                        channelLabelText={humanizeLeadSource(log, sourceDict)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminLeadsPage;
