import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
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
      <div className="relative max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <div className="text-lg font-semibold text-white">{adminLeadsContent.logModal.title}</div>
            <div className="mt-1 text-sm text-slate-400">
              {log.name} · {log.phone}
            </div>
            {log.requestId ? (
              <div className="mt-1 text-xs text-slate-500">{adminLeadsContent.requestId.label}: {log.requestId}</div>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {adminLeadsContent.logModal.close}
          </Button>
        </div>

        <div className="max-h-[calc(85vh-88px)] space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">{adminLeadsContent.logModal.cards.status}</div>
              <div className="mt-2 text-sm font-medium text-white">{formatStatusLabel(log.status)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">{adminLeadsContent.logModal.cards.created}</div>
              <div className="mt-2 text-sm font-medium text-white">{formatDateTime(log.timestamp)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">{adminLeadsContent.logModal.cards.steps}</div>
              <div className="mt-2 text-sm font-medium text-white">{entries.length}</div>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-400">
              {adminLeadsContent.logModal.empty}
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, index) => (
                <div key={`${entry.at}-${entry.step}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${entryStatusClasses[entry.status]}`}
                    >
                      {entryStatusLabel(entry.status)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-slate-900 px-2.5 py-1 text-xs text-slate-300">
                      {channelLabels[entry.channel]}
                    </span>
                    <span className="text-xs text-slate-500">{formatDateTime(entry.at)}</span>
                  </div>
                  <div className="mt-3 text-sm font-medium text-white">{entry.message}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">{entry.step}</div>
                  {entry.details ? (
                    <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-300">
                      {entry.details}
                    </div>
                  ) : null}
                  {entry.meta && Object.keys(entry.meta).length > 0 ? (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {Object.entries(entry.meta).map(([key, value]) => (
                        <div key={key} className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-xs">
                          <span className="text-slate-500">{key}:</span>{' '}
                          <span className="text-slate-300">{value}</span>
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

const LeadCard = ({
  log,
  onOpenLog,
}: {
  log: LeadLog;
  onOpenLog: (log: LeadLog) => void;
}) => {
  const time = new Date(log.timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const lastEntry = log.deliveryLog?.[log.deliveryLog.length - 1];
  const statusClass = statusClasses[log.status ?? 'default'] ?? statusClasses.default;

  return (
    <div className="card border-l-4 border-l-brand-500">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold text-white">{log.name}</span>
            <span className="rounded bg-brand-500/10 px-2 py-0.5 text-xs text-brand-100">{log.source}</span>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}>
              {formatStatusLabel(log.status)}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">{time}</div>
          {log.requestId ? <div className="mt-1 text-xs text-slate-500">{adminLeadsContent.requestId.label}: {log.requestId}</div> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => onOpenLog(log)}>
            {adminLeadsContent.leadCard.actions.log}
          </Button>
          {log.pagePath ? (
            <a
              href={log.pagePath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
            >
              {adminLeadsContent.leadCard.actions.page}
            </a>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 text-sm md:grid-cols-2">
        <div>
          <span className="text-slate-400">{adminLeadsContent.leadCard.fields.phone}:</span>{' '}
          <a href={`tel:${log.phone}`} className="text-white hover:text-brand-100">
            {log.phone}
          </a>
        </div>
        {log.email ? (
          <div>
            <span className="text-slate-400">{adminLeadsContent.leadCard.fields.email}:</span>{' '}
            <a href={`mailto:${log.email}`} className="text-white hover:text-brand-100">
              {log.email}
            </a>
          </div>
        ) : null}
        {log.telegram ? (
          <div>
            <span className="text-slate-400">{adminLeadsContent.leadCard.fields.telegram}:</span>{' '}
            <span className="text-white">{log.telegram}</span>
          </div>
        ) : null}
        {log.city ? (
          <div>
            <span className="text-slate-400">{adminLeadsContent.leadCard.fields.city}:</span>{' '}
            <span className="text-white">{log.city}</span>
          </div>
        ) : null}
        {log.date ? (
          <div>
            <span className="text-slate-400">{adminLeadsContent.leadCard.fields.date}:</span>{' '}
            <span className="text-white">{log.date}</span>
          </div>
        ) : null}
        {log.format ? (
          <div>
            <span className="text-slate-400">{adminLeadsContent.leadCard.fields.format}:</span>{' '}
            <span className="text-white">{log.format}</span>
          </div>
        ) : null}
      </div>

      {lastEntry ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">{adminLeadsContent.leadCard.fields.lastStep}</div>
          <div className="mt-1 text-white">{lastEntry.message}</div>
          <div className="mt-1 text-xs text-slate-500">
            {channelLabels[lastEntry.channel]} · {formatDateTime(lastEntry.at)}
          </div>
        </div>
      ) : null}

      {log.extra && Object.keys(log.extra).length > 0 ? (
        <div className="mt-3 rounded-lg bg-white/5 p-3">
          <div className="mb-2 text-xs font-semibold text-slate-400">{adminLeadsContent.leadCard.fields.details}</div>
          <div className="grid gap-1 text-xs md:grid-cols-2">
            {Object.entries(log.extra).map(([key, value]) => (
              <div key={key}>
                <span className="text-slate-500">{key}:</span>{' '}
                <span className="text-slate-300">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {log.comment ? (
        <div className="mt-3 rounded-lg bg-white/5 p-3 text-sm">
          <span className="text-slate-400">{adminLeadsContent.leadCard.fields.comment}:</span>{' '}
          <span className="text-slate-300">{log.comment}</span>
        </div>
      ) : null}
    </div>
  );
};

const AdminLeadsPage = () => {
  const { adminLocale } = useI18n();
  adminLeadsContent = getAdminLeadsContent(adminLocale);
  localeTag = adminLocale === 'ru' ? 'ru-RU' : 'en-US';
  const { leads, loading, error: leadsError, clearLeads } = useLeads();
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState(filter);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearSubmitting, setClearSubmitting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LeadLog | null>(null);

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
      if (ok) toast.success(adminLeadsContent.toasts.clearSuccess);
      else toast.error(adminLeadsContent.toasts.clearError);
    } finally {
      setClearSubmitting(false);
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

      const rows = leads.map((lead) => [
        lead.id,
        lead.requestId ?? '',
        new Date(lead.timestamp).toLocaleDateString(localeTag),
        new Date(lead.timestamp).toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' }),
        lead.source,
        lead.status ?? '',
        lead.name,
        lead.phone,
        lead.email ?? '',
        lead.telegram ?? '',
        lead.city ?? '',
        lead.date ?? '',
        lead.format ?? '',
        `"${(lead.comment ?? '').replace(/"/g, '""')}"`,
      ]);

      const content = [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
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

      <LeadLogModal log={selectedLog} onClose={() => setSelectedLog(null)} />

      {loading ? (
        <div className="mb-4">
          <LoadingState title={adminLeadsContent.loading.title} description={adminLeadsContent.loading.description} />
        </div>
      ) : null}
      {leadsError ? <div className="mb-4 text-sm text-red-400">{adminLeadsContent.errors.prefix}: {leadsError}</div> : null}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-slate-400">
          <span className="font-semibold text-white">{adminLeadsContent.summary.shown(filteredLogs.length, leads.length)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={exportCSV}>
            {adminLeadsContent.actions.exportCsv}
          </Button>
          <Button variant="secondary" size="sm" onClick={exportLogs}>
            {adminLeadsContent.actions.exportJson}
          </Button>
          <Button variant="danger" size="sm" onClick={() => setClearModalOpen(true)}>
            {adminLeadsContent.actions.clearAll}
          </Button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
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

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate-200">
          {adminLeadsContent.filters.searchLabel}
          <Input
            type="text"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={adminLeadsContent.filters.searchPlaceholder}
          />
        </label>
        <label className="text-sm text-slate-200">
          {adminLeadsContent.filters.sourceLabel}
          <select
            value={selectedSource}
            onChange={(event) => setSelectedSource(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
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

      {filteredLogs.length === 0 ? (
        <EmptyState
          icon="..."
          title={leads.length === 0 ? adminLeadsContent.empty.noLeadsTitle : adminLeadsContent.empty.notFoundTitle}
          description={
            leads.length === 0
              ? adminLeadsContent.empty.noLeadsDescription
              : adminLeadsContent.empty.notFoundDescription
          }
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(logsByDate).map(([date, dateLogs]) => (
            <div key={date}>
              <div className="mb-3 text-sm font-semibold text-slate-400">{date}</div>
              <div className="grid gap-4">
                {dateLogs.map((log) => (
                  <LeadCard key={log.id} log={log} onOpenLog={setSelectedLog} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminLeadsPage;
