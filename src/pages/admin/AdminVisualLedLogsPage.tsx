import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, RefreshCcw, UserCog, Image as ImageIcon, Share2, Wand2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Button, EmptyState, Input, LoadingState } from '../../components/admin/ui';
import { useI18n } from '../../context/I18nContext';
import { loadVisualLedSessions } from '../../services/visualLedLogs';
import {
  asNumber,
  browserFromUserAgent,
  dateBucketFor,
  deviceKindFromUserAgent,
  extractSessionFlags,
  formatDurationCompact,
  shortSessionId,
  type DateBucket,
} from '../../lib/visualLedLogs';
import type { VisualLedSession } from '../../types/visualLedLogs';

const PAGE_SIZE = 50;

const copy = {
  ru: {
    title: 'Логи Visual LED',
    subtitle: 'Лента визуализаций с группировкой по дням',
    reload: 'Обновить',
    loadMore: 'Загрузить ещё',
    search: 'Поиск по IP / URL / session',
    unauthorized: 'Нет доступа (нужна роль admin)',
    noSessions: 'Сессий не найдено',
    stats: {
      shown: (n: number, total: number) => `показано ${n} из ${total}`,
    },
    filters: {
      heading: 'Фильтры',
      adminOnly: 'Только админ',
      hasBackgrounds: 'С фонами',
      hasReport: 'С отчётом',
      hasAssist: 'С assist',
      resetAll: 'Сбросить',
    },
    buckets: {
      today: 'Сегодня',
      yesterday: 'Вчера',
      thisWeek: 'На этой неделе',
      earlier: 'Раньше',
    } satisfies Record<DateBucket, string>,
    row: {
      scenes: (n: number) => `${n} сц`,
      screens: (n: number) => `${n} LED`,
      events: (n: number) => `${n} соб`,
      backgrounds: (n: number) => `${n} BG`,
      admin: 'Админ',
      assist: 'Assist',
      shared: 'Отчёт',
      anon: 'Аноним',
      ipUnknown: 'IP неизвестен',
      openDetail: 'Открыть',
    },
  },
  en: {
    title: 'Visual LED logs',
    subtitle: 'Session feed grouped by day',
    reload: 'Refresh',
    loadMore: 'Load more',
    search: 'Search by IP / URL / session',
    unauthorized: 'No access (admin role required)',
    noSessions: 'No sessions',
    stats: {
      shown: (n: number, total: number) => `${n} of ${total}`,
    },
    filters: {
      heading: 'Filters',
      adminOnly: 'Admin only',
      hasBackgrounds: 'With backgrounds',
      hasReport: 'With report',
      hasAssist: 'With assist',
      resetAll: 'Reset',
    },
    buckets: {
      today: 'Today',
      yesterday: 'Yesterday',
      thisWeek: 'This week',
      earlier: 'Earlier',
    } satisfies Record<DateBucket, string>,
    row: {
      scenes: (n: number) => `${n} sc`,
      screens: (n: number) => `${n} LED`,
      events: (n: number) => `${n} ev`,
      backgrounds: (n: number) => `${n} BG`,
      admin: 'Admin',
      assist: 'Assist',
      shared: 'Report',
      anon: 'Anon',
      ipUnknown: 'IP unknown',
      openDetail: 'Open',
    },
  },
} as const;

const FilterChip = ({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: JSX.Element;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
      active
        ? 'border-brand-400 bg-brand-500/15 text-white'
        : 'border-white/10 bg-slate-900/40 text-slate-300 hover:border-white/30 hover:text-white'
    }`}
  >
    {icon}
    {children}
  </button>
);

const AdminVisualLedLogsPage = () => {
  const { adminLocale } = useI18n();
  const ui = copy[adminLocale];
  const localeTag = adminLocale === 'ru' ? 'ru-RU' : 'en-US';

  const [search, setSearch] = useState('');
  const [sessions, setSessions] = useState<VisualLedSession[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterAdmin, setFilterAdmin] = useState(false);
  const [filterBackgrounds, setFilterBackgrounds] = useState(false);
  const [filterReport, setFilterReport] = useState(false);
  const [filterAssist, setFilterAssist] = useState(false);

  const reset = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await loadVisualLedSessions({ limit: PAGE_SIZE, offset: 0 });
      setSessions(page.items);
      setTotal(page.total);
      setOffset(page.items.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : ui.unauthorized);
    } finally {
      setLoading(false);
    }
  }, [ui.unauthorized]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading) return;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await loadVisualLedSessions({ limit: PAGE_SIZE, offset });
      setSessions((prev) => {
        const seen = new Set(prev.map((s) => s.id));
        const next = page.items.filter((item) => !seen.has(item.id));
        return [...prev, ...next];
      });
      setTotal(page.total);
      setOffset((prev) => prev + page.items.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : ui.unauthorized);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, offset, ui.unauthorized]);

  useEffect(() => {
    void reset();
  }, [reset]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((session) => {
      if (filterAdmin && !session.is_admin) return false;
      const flags = extractSessionFlags(session);
      if (filterBackgrounds && !flags.hasBackgrounds) return false;
      if (filterReport && !flags.hasSharedReport) return false;
      if (filterAssist && !flags.hasAssist) return false;

      if (!q) return true;
      const haystack = [
        session.session_key,
        session.client_ip || '',
        session.page_url || '',
        session.referrer || '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [filterAdmin, filterAssist, filterBackgrounds, filterReport, search, sessions]);

  // Group filtered sessions into date buckets (preserve the upstream
  // `started_at DESC` order within each bucket).
  const grouped = useMemo(() => {
    const now = new Date();
    const byBucket: Record<DateBucket, VisualLedSession[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: [],
    };
    for (const session of filtered) {
      byBucket[dateBucketFor(session.started_at, now)].push(session);
    }
    return byBucket;
  }, [filtered]);

  const activeFilters =
    (filterAdmin ? 1 : 0) +
    (filterBackgrounds ? 1 : 0) +
    (filterReport ? 1 : 0) +
    (filterAssist ? 1 : 0);

  const resetFilters = () => {
    setFilterAdmin(false);
    setFilterBackgrounds(false);
    setFilterReport(false);
    setFilterAssist(false);
    setSearch('');
  };

  return (
    <AdminLayout title={ui.title} subtitle={ui.subtitle}>
      <div className="space-y-4">
        {/* Search + filters toolbar */}
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={ui.search}
              className="max-w-md flex-1 min-w-[240px]"
            />
            <Button onClick={() => void reset()} disabled={loading}>
              <RefreshCcw className="mr-1 inline h-3.5 w-3.5" />
              {ui.reload}
            </Button>
            <div className="ml-auto text-xs text-slate-400">
              {ui.stats.shown(filtered.length, total)}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              {ui.filters.heading}:
            </span>
            <FilterChip
              active={filterAdmin}
              onClick={() => setFilterAdmin((v) => !v)}
              icon={<UserCog className="h-3 w-3" />}
            >
              {ui.filters.adminOnly}
            </FilterChip>
            <FilterChip
              active={filterBackgrounds}
              onClick={() => setFilterBackgrounds((v) => !v)}
              icon={<ImageIcon className="h-3 w-3" />}
            >
              {ui.filters.hasBackgrounds}
            </FilterChip>
            <FilterChip
              active={filterReport}
              onClick={() => setFilterReport((v) => !v)}
              icon={<Share2 className="h-3 w-3" />}
            >
              {ui.filters.hasReport}
            </FilterChip>
            <FilterChip
              active={filterAssist}
              onClick={() => setFilterAssist((v) => !v)}
              icon={<Wand2 className="h-3 w-3" />}
            >
              {ui.filters.hasAssist}
            </FilterChip>
            {activeFilters > 0 || search ? (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-1 text-xs text-slate-400 underline-offset-2 hover:text-white hover:underline"
              >
                {ui.filters.resetAll}
              </button>
            ) : null}
          </div>

          {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}
        </div>

        {loading && sessions.length === 0 ? (
          <LoadingState title={ui.title} />
        ) : filtered.length === 0 ? (
          <EmptyState title={ui.noSessions} />
        ) : (
          <div className="space-y-6">
            {(Object.keys(grouped) as DateBucket[]).map((bucket) => {
              const items = grouped[bucket];
              if (items.length === 0) return null;
              return (
                <section key={bucket}>
                  <header className="mb-2 flex items-baseline gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      {ui.buckets[bucket]}
                    </h3>
                    <span className="text-xs text-slate-500">({items.length})</span>
                  </header>
                  <div className="space-y-2">
                    {items.map((session) => (
                      <SessionRow
                        key={session.id}
                        session={session}
                        localeTag={localeTag}
                        rowCopy={ui.row}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {sessions.length < total ? (
          <div className="flex justify-center pt-2">
            <Button onClick={() => void loadMore()} disabled={loadingMore}>
              {loadingMore ? '…' : ui.loadMore}
            </Button>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
};

interface RowCopy {
  scenes: (n: number) => string;
  screens: (n: number) => string;
  events: (n: number) => string;
  backgrounds: (n: number) => string;
  admin: string;
  assist: string;
  shared: string;
  anon: string;
  ipUnknown: string;
  openDetail: string;
}

const SessionRow = ({
  session,
  localeTag,
  rowCopy,
}: {
  session: VisualLedSession;
  localeTag: string;
  rowCopy: RowCopy;
}) => {
  const summary = session.summary || {};
  const scenes = asNumber(summary.scenes);
  const screens = asNumber(summary.screens);
  const events = asNumber(summary.events) ?? asNumber(summary.events_total);
  const backgrounds = asNumber(summary.backgrounds);
  const flags = extractSessionFlags(session);
  const browser = browserFromUserAgent(session.user_agent);
  const device = deviceKindFromUserAgent(session.user_agent);
  const startedAt = new Date(session.started_at);
  const timeLabel = startedAt.toLocaleTimeString(localeTag, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link
      to={`/admin/visual-led-logs/${encodeURIComponent(session.id)}`}
      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/30 p-3 text-sm transition hover:border-white/25 hover:bg-slate-900/60"
    >
      {/* Time + short id */}
      <div className="flex w-28 shrink-0 flex-col">
        <span className="font-mono text-xs text-slate-400">{timeLabel}</span>
        <span className="font-mono text-xs font-semibold text-sky-200">
          #{shortSessionId(session.session_key)}
        </span>
      </div>

      {/* Primary info: URL + metadata */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
          <span>{browser} · {device}</span>
          <span className="text-slate-500">·</span>
          <span className="font-mono text-slate-400">
            {session.client_ip || rowCopy.ipUnknown}
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300">{formatDurationCompact(session.duration_sec)}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-slate-400">
          {scenes !== null ? <MetricPill>{rowCopy.scenes(scenes)}</MetricPill> : null}
          {screens !== null ? <MetricPill>{rowCopy.screens(screens)}</MetricPill> : null}
          {events !== null ? <MetricPill>{rowCopy.events(events)}</MetricPill> : null}
          {backgrounds !== null && backgrounds > 0 ? (
            <MetricPill>{rowCopy.backgrounds(backgrounds)}</MetricPill>
          ) : null}
          {session.page_url ? (
            <span className="ml-1 truncate text-[11px] text-slate-500">{session.page_url}</span>
          ) : null}
        </div>
      </div>

      {/* Flags */}
      <div className="flex shrink-0 items-center gap-1">
        {session.is_admin ? (
          <TagPill className="border-amber-400/40 bg-amber-500/10 text-amber-200">
            {rowCopy.admin}
          </TagPill>
        ) : null}
        {flags.hasAssist ? (
          <TagPill className="border-violet-400/40 bg-violet-500/10 text-violet-200">
            {rowCopy.assist}
          </TagPill>
        ) : null}
        {flags.hasSharedReport ? (
          <TagPill className="border-sky-400/40 bg-sky-500/10 text-sky-200">
            {rowCopy.shared}
          </TagPill>
        ) : null}
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-white" />
    </Link>
  );
};

const MetricPill = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded bg-slate-800/60 px-1.5 py-0.5 font-mono text-slate-300">{children}</span>
);

const TagPill = ({ className, children }: { className: string; children: React.ReactNode }) => (
  <span
    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${className}`}
  >
    {children}
  </span>
);

export default AdminVisualLedLogsPage;
