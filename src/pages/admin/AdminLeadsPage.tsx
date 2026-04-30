import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays, Download, FileJson, Inbox, Phone, Search, SlidersHorizontal } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Button, ConfirmModal, FilterPills, Input } from '../../components/admin/ui';
import { useI18n } from '../../context/I18nContext';
import { getAdminLeadsContent } from '../../content/pages/adminLeads';
import { useLeads } from '../../hooks/useLeads';
import { countByPreset, humanizeLeadSource, matchesPreset, type LeadQuickPreset, type SourceLabelDict } from '../../lib/leadFilters';
import type { LeadLog } from '../../types/leads';
import { LeadDetailsDrawer } from './leads/LeadDetailsDrawer';
import { LeadLogModal } from './leads/LeadLogModal';
import { LeadRow } from './leads/LeadRow';
import { EmptyLeadsPanel, ErrorPanel, LeadsSkeleton, StatStripItem } from './leads/LeadPagePanels';
import { adminLeadsContent, formatDate, localeTag, notifyLeadReadStateChanged, setAdminLeadsRuntime } from './leads/leadRuntime';

const AdminLeadsPage = () => {
  const { adminLocale } = useI18n();
  const pageContent = getAdminLeadsContent(adminLocale);
  setAdminLeadsRuntime(pageContent, adminLocale);
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
