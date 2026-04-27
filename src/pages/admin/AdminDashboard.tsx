import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Clock3,
  FileText,
  FolderOpen,
  Inbox,
  MapPin,
  Package,
  Palette,
  Phone,
  PhoneCall,
  Settings2,
  Tag,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { ConfirmModal } from '../../components/admin/ui';
import { useI18n } from '../../context/I18nContext';
import { getAdminContentIndexContent } from '../../content/pages/adminContentIndex';
import { getAdminDashboardContent } from '../../content/pages/adminDashboard';
import { useLeads } from '../../hooks/useLeads';
import type { LeadLog } from '../../types/leads';

const iconMap: Record<string, LucideIcon> = {
  package: Package,
  tag: Tag,
  phone: Phone,
  folderOpen: FolderOpen,
  inbox: Inbox,
  palette: Palette,
  fileText: FileText,
};

type AdminDashboardContent = ReturnType<typeof getAdminDashboardContent>;

const AdminDashboard = () => {
  const { adminLocale } = useI18n();
  const adminDashboardContent = getAdminDashboardContent(adminLocale);
  const adminContentIndexContent = getAdminContentIndexContent(adminLocale);
  const localeTag = adminLocale === 'ru' ? 'ru-RU' : 'en-US';
  const { leads: logs, loading, error, deleteLead } = useLeads();
  const [deleteTarget, setDeleteTarget] = useState<LeadLog | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const deleteCopy = adminDashboardContent.deleteModal;

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayLogs = logs.filter((item) => new Date(item.timestamp) >= today);
    const weekLogs = logs.filter((item) => new Date(item.timestamp) >= weekAgo);
    const monthLogs = logs.filter((item) => new Date(item.timestamp) >= monthAgo);

    const bySource = logs.reduce((acc, log) => {
      acc[log.source] = (acc[log.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCity = logs
      .filter((item) => item.city)
      .reduce((acc, log) => {
        acc[log.city!] = (acc[log.city!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const withContacts = logs.filter((item) => item.email || item.telegram).length;

    return {
      total: logs.length,
      today: todayLogs.length,
      week: weekLogs.length,
      month: monthLogs.length,
      withContacts,
      contactRate: logs.length > 0 ? Math.round((withContacts / logs.length) * 100) : 0,
      bySource,
      byCity,
      topCities: Object.entries(byCity)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    };
  }, [logs]);

  const sortedSourceEntries = useMemo(
    () => Object.entries(stats.bySource).sort((a, b) => b[1] - a[1]) as Array<[string, number]>,
    [stats.bySource],
  );

  const recentLogs = useMemo(() => {
    return [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 10);
  }, [logs]);

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

  const statItems = [
    {
      title: adminDashboardContent.stats.total,
      value: stats.total,
      Icon: Inbox,
      hint: stats.today > 0
        ? `+${stats.today} ${adminDashboardContent.stats.todaySuffix}`
        : adminDashboardContent.stats.noNew,
      tone: stats.today > 0 ? 'text-emerald-300' : 'text-slate-500',
    },
    {
      title: adminDashboardContent.stats.week,
      value: stats.week,
      Icon: CalendarDays,
      hint: `${stats.today} ${adminDashboardContent.stats.todaySuffix}`,
      tone: 'text-slate-300',
    },
    {
      title: adminDashboardContent.stats.month,
      value: stats.month,
      Icon: BarChart3,
      hint: `${stats.withContacts} ${adminDashboardContent.stats.withContactsSuffix}`,
      tone: 'text-slate-300',
    },
    {
      title: adminDashboardContent.stats.conversion,
      value: `${stats.contactRate}%`,
      Icon: PhoneCall,
      hint: adminDashboardContent.stats.fromTotal(stats.withContacts, stats.total),
      tone: stats.contactRate >= 50 ? 'text-emerald-300' : 'text-amber-300',
    },
  ];

  return (
    <AdminLayout
      title={adminDashboardContent.layout.title}
      subtitle={adminDashboardContent.layout.subtitle}
    >
      <ConfirmModal
        open={Boolean(deleteTarget)}
        danger
        title={deleteCopy.title}
        description={deleteTarget ? deleteCopy.description(deleteTarget.name) : ''}
        confirmText={deleteCopy.action}
        cancelText={deleteCopy.cancel}
        confirmDisabled={deleteSubmitting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      {loading ? (
        <DashboardSkeleton label={adminDashboardContent.state.loading} />
      ) : (
        <div className="space-y-6">
          {error && (
            <ErrorPanel
              title={adminDashboardContent.state.errorTitle}
              description={`${adminDashboardContent.state.errorPrefix} ${error}`}
            />
          )}

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45 shadow-[0_18px_44px_-32px_rgba(0,0,0,0.9)]">
            <div className="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
              {statItems.map((item) => (
                <StatMetric key={item.title} {...item} />
              ))}
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35 shadow-[0_18px_44px_-32px_rgba(0,0,0,0.9)]">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-white">{adminDashboardContent.sections.recentLeads}</h3>
                </div>
                <Link
                  to="/admin/leads"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:border-emerald-300/40 hover:bg-emerald-400/15 active:scale-[0.98]"
                >
                  {adminDashboardContent.sections.allLeads}
                  <ArrowRight size={13} />
                </Link>
              </div>

              {recentLogs.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {recentLogs.map((log) => (
                    <LeadRow
                      key={log.id}
                      log={log}
                      localeTag={localeTag}
                      content={adminDashboardContent}
                      onDelete={() => setDeleteTarget(log)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyRecent content={adminDashboardContent} />
              )}
            </section>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 shadow-[0_18px_44px_-32px_rgba(0,0,0,0.9)]">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">{adminDashboardContent.sections.contentHub}</h3>
                    <p className="mt-1 text-xs text-slate-500">{adminContentIndexContent.layout.subtitle}</p>
                  </div>
                  <Settings2 size={17} className="text-emerald-300" />
                </div>
                <div className="space-y-1.5">
                  {adminContentIndexContent.sections.slice(0, 6).map((section) => {
                    const Icon = iconMap[section.icon] ?? FileText;
                    return (
                      <Link
                        key={section.to}
                        to={section.to}
                        className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 transition hover:border-white/10 hover:bg-white/[0.04] active:scale-[0.99]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                          <Icon size={15} className="text-slate-300 group-hover:text-emerald-200" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-white">{section.title}</span>
                          <span className="block truncate text-xs text-slate-500">{section.desc}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>

              <MetricListPanel
                title={adminDashboardContent.sections.sources}
                emptyText={adminDashboardContent.sections.noData}
                items={sortedSourceEntries}
                total={stats.total}
              />

              <CityPanel
                title={adminDashboardContent.sections.cities}
                emptyText={adminDashboardContent.sections.noData}
                items={stats.topCities}
              />
            </aside>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const StatMetric = ({
  title,
  value,
  Icon,
  hint,
  tone,
}: {
  title: string;
  value: number | string;
  Icon: LucideIcon;
  hint: string;
  tone: string;
}) => (
  <div className="group min-h-[118px] p-4 transition hover:bg-white/[0.03] sm:p-5">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">{title}</div>
        <div className="mt-2 font-mono text-3xl font-semibold leading-none text-white">{value}</div>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition group-hover:border-emerald-300/25 group-hover:text-emerald-200">
        <Icon size={18} />
      </div>
    </div>
    <div className={`mt-3 text-xs font-medium ${tone}`}>{hint}</div>
  </div>
);

const LeadRow = ({
  log,
  localeTag,
  content,
  onDelete,
}: {
  log: LeadLog;
  localeTag: string;
  content: AdminDashboardContent;
  onDelete: () => void;
}) => {
  const date = new Date(log.timestamp);
  const contactLine = [log.phone, log.email, log.city].filter(Boolean).join(` ${content.lead.separator} `);

  return (
    <div className="grid gap-3 px-4 py-3.5 transition hover:bg-white/[0.03] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-5">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-white">{log.name}</span>
          <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-slate-300">
            {log.source.split(' (')[0]}
          </span>
        </div>
        <div className="mt-1 truncate text-xs text-slate-400">
          {contactLine || content.lead.noContact}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 sm:justify-end">
        <Clock3 size={13} className="text-slate-600" />
        <span>
          {date.toLocaleDateString(localeTag, { day: 'numeric', month: 'short' })}
        </span>
        <span className="text-slate-600">{content.lead.separator}</span>
        <span>
          {date.toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <button
        type="button"
        onClick={onDelete}
        title={content.deleteModal.action}
        aria-label={content.deleteModal.action}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-400/25 bg-red-500/10 text-red-100 transition hover:border-red-300/50 hover:bg-red-500/15 active:scale-[0.96]"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

const MetricListPanel = ({
  title,
  emptyText,
  items,
  total,
}: {
  title: string;
  emptyText: string;
  items: Array<[string, number]>;
  total: number;
}) => (
  <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 shadow-[0_18px_44px_-32px_rgba(0,0,0,0.9)]">
    <h3 className="text-base font-semibold text-white">{title}</h3>
    <div className="mt-4 space-y-3">
      {items.map(([source, count]) => (
        <div key={source} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-sm text-slate-300">{source}</span>
            <span className="font-mono text-sm font-semibold text-white">{count}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
      {items.length === 0 && <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-sm text-slate-500">{emptyText}</div>}
    </div>
  </section>
);

const CityPanel = ({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: Array<[string, number]>;
}) => (
  <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 shadow-[0_18px_44px_-32px_rgba(0,0,0,0.9)]">
    <h3 className="text-base font-semibold text-white">{title}</h3>
    <div className="mt-4 space-y-2">
      {items.map(([city, count], index) => (
        <div key={city} className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 hover:bg-white/[0.03]">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] font-mono text-[11px] font-semibold text-slate-300">
              {index + 1}
            </span>
            <MapPin size={13} className="shrink-0 text-slate-600" />
            <span className="truncate text-sm text-slate-300">{city}</span>
          </div>
          <span className="font-mono text-sm font-semibold text-white">{count}</span>
        </div>
      ))}
      {items.length === 0 && <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-sm text-slate-500">{emptyText}</div>}
    </div>
  </section>
);

const EmptyRecent = ({ content }: { content: AdminDashboardContent }) => (
  <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-emerald-200">
      <Inbox size={20} />
    </div>
    <div>
      <div className="text-base font-semibold text-white">{content.sections.emptyRecentTitle}</div>
      <div className="mt-1 max-w-md text-sm text-slate-400">{content.sections.emptyRecentDescription}</div>
    </div>
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

const DashboardSkeleton = ({ label }: { label: string }) => (
  <div className="space-y-6" aria-busy="true">
    <div className="text-sm text-slate-400">{label}</div>
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45">
      <div className="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="min-h-[118px] p-5">
            <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
            <div className="mt-5 h-8 w-16 animate-pulse rounded-lg bg-white/10" />
            <div className="mt-4 h-3 w-32 animate-pulse rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    </div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
      <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
        <div className="h-4 w-36 animate-pulse rounded-full bg-white/10" />
        <div className="mt-5 space-y-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_32px] sm:items-center">
              <div>
                <div className="h-4 w-48 animate-pulse rounded-full bg-white/10" />
                <div className="mt-2 h-3 w-72 max-w-full animate-pulse rounded-full bg-white/10" />
              </div>
              <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
              <div className="h-8 w-8 animate-pulse rounded-lg bg-white/10" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((__, itemIndex) => (
                <div key={itemIndex} className="h-8 animate-pulse rounded-xl bg-white/10" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default AdminDashboard;
