import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Button, EmptyState, Input, LoadingState } from '../../components/admin/ui';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../context/I18nContext';

type VisualLedSession = {
  id: string;
  session_key: string;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  page_url: string | null;
  referrer: string | null;
  client_ip: string | null;
  user_agent: string | null;
  timezone: string | null;
  is_admin: boolean;
  summary: Record<string, unknown>;
};

type VisualLedEvent = {
  id: number;
  ts: string;
  event_type: string;
  scene_id: string | null;
  screen_id: string | null;
  payload: Record<string, unknown>;
};

type VisualLedAsset = {
  id: string;
  created_at: string;
  asset_type: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_bucket: string;
  storage_path: string;
  meta: Record<string, unknown>;
  preview_url?: string | null;
};

type ReportShareItem = {
  id: number;
  at: string;
  url: string;
  scope: string | null;
  previewImage: string | null;
  screensCurrent: number | null;
  scenesTotal: number | null;
  backgroundsTotal: number | null;
};

type SessionDetailsState = {
  session: VisualLedSession | null;
  events: VisualLedEvent[];
  assets: VisualLedAsset[];
  loading: boolean;
  error: string | null;
};

type EventFeedItem = VisualLedEvent & { scope: string | null; url: string | null };

const copy = {
  ru: {
    title: 'Логи Visual LED',
    subtitle: 'Лента визуализаций с раскрытием деталей по клику',
    reload: 'Обновить',
    search: 'Поиск по IP / URL / session key',
    feed: 'Лента визуализаций',
    noSessions: 'Сессии пока не найдены',
    unauthorized: 'Нет доступа к логам (нужна роль admin)',
    events: 'События',
    backgrounds: 'Фоны',
    summary: 'Сводка',
    open: 'Открыть',
    visualization: 'Визуализация',
    cards: {
      screens: 'Экранов',
      scenes: 'Сцен',
      duration: 'Длительность',
      assistApplied: 'Assist применен',
      reportScope: 'Экспорт',
      reportLink: 'Ссылка отчета',
      reportSharedAt: 'Поделен',
      sharedReports: 'Ссылки на отчеты',
      noSharedReports: 'Шеринг отчета в этой сессии не выполнялся',
    },
    noBackgrounds: 'Фоны в этой сессии не загружались',
    noEvents: 'Событий нет',
  },
  en: {
    title: 'Visual LED logs',
    subtitle: 'Visualization feed with expandable details',
    reload: 'Reload',
    search: 'Search by IP / URL / session key',
    feed: 'Visualizations feed',
    noSessions: 'No sessions yet',
    unauthorized: 'No access to logs (admin role required)',
    events: 'Events',
    backgrounds: 'Backgrounds',
    summary: 'Summary',
    open: 'Open',
    visualization: 'Visualization',
    cards: {
      screens: 'Screens',
      scenes: 'Scenes',
      duration: 'Duration',
      assistApplied: 'Assist applied',
      reportScope: 'Export scope',
      reportLink: 'Report link',
      reportSharedAt: 'Shared at',
      sharedReports: 'Shared report links',
      noSharedReports: 'No shared report links in this session',
    },
    noBackgrounds: 'No backgrounds were uploaded in this session',
    noEvents: 'No events',
  },
} as const;

async function getAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.access_token || null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function formatDurationCompact(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return '-';
  const total = Math.floor(seconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function browserFromUserAgent(userAgent: string | null): string {
  const ua = (userAgent || '').toLowerCase();
  if (!ua) return 'Unknown';
  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera';
  if (ua.includes('chrome/') && !ua.includes('edg/')) return 'Chrome';
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
  if (ua.includes('firefox/')) return 'Firefox';
  return 'Other';
}

function visualizationNumberFromSessionKey(sessionKey: string): string {
  let hash = 2166136261;
  for (let i = 0; i < sessionKey.length; i += 1) {
    hash ^= sessionKey.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const normalized = (hash >>> 0) % 1_000_000;
  return String(normalized).padStart(6, '0');
}

function buildEventFeed(events: VisualLedEvent[]): EventFeedItem[] {
  return [...events]
    .sort((a, b) => b.ts.localeCompare(a.ts))
    .map((event) => ({
      ...event,
      scope: asString(event.payload?.scope) || asString(event.payload?.export_scope),
      url: asString(event.payload?.url),
    }));
}

function buildInsights(session: VisualLedSession, events: VisualLedEvent[]) {
  const summary = session.summary || {};
  const screens = asNumber(summary.screens);
  const scenes = asNumber(summary.scenes);
  const duration = asNumber(summary.duration_sec ?? session.duration_sec);

  const assistAppliedCount = events.filter((event) => event.event_type === 'assist_applied').length;
  const screenCreatedByEvent = events.filter((event) => event.event_type === 'screen_created').length;
  const screenUpdatedCount = events.filter((event) => event.event_type === 'screen_updated').length;
  const backgroundUploadedByEvent = events.filter((event) => event.event_type === 'background_uploaded').length;
  const summaryScreens = asNumber(summary.screens);
  const summaryBackgrounds = asNumber(summary.backgrounds);

  const lastReportExport = [...events]
    .reverse()
    .find((event) => event.event_type === 'report_exported');
  const lastReportShared = [...events]
    .reverse()
    .find((event) => event.event_type === 'report_shared' && event.payload?.status === 'success');

  const reportShares: ReportShareItem[] = events
    .filter((event) => event.event_type === 'report_shared' && event.payload?.status === 'success')
    .map((event) => {
      const metrics = asRecord(event.payload?.metrics);
      return {
        id: event.id,
        at: event.ts,
        url: asString(event.payload?.url) || '',
        scope: asString(event.payload?.export_scope),
        previewImage: asString(event.payload?.preview_image),
        screensCurrent: asNumber(metrics?.screens_current),
        scenesTotal: asNumber(metrics?.scenes_total),
        backgroundsTotal: asNumber(metrics?.backgrounds_total),
      };
    })
    .filter((item) => item.url)
    .sort((a, b) => b.at.localeCompare(a.at));

  const lastShare = reportShares[0] ?? null;
  const summaryScreensFromShare = lastShare?.screensCurrent ?? null;
  const summaryBackgroundsFromShare = lastShare?.backgroundsTotal ?? null;

  return {
    screens,
    scenes,
    duration,
    assistAppliedCount,
    screenCreatedCount: Math.max(screenCreatedByEvent, summaryScreens ?? 0, summaryScreensFromShare ?? 0),
    screenUpdatedCount,
    backgroundUploadedCount: Math.max(backgroundUploadedByEvent, summaryBackgrounds ?? 0, summaryBackgroundsFromShare ?? 0),
    reportScope:
      asString(lastReportExport?.payload?.scope) ||
      asString(lastReportShared?.payload?.export_scope) ||
      asString(summary.report_export_scope),
    reportUrl: asString(lastReportShared?.payload?.url) || asString(summary.report_url),
    reportSharedAt: lastReportShared?.ts || null,
    reportShares,
    summary,
  };
}

const AdminVisualLedLogsPage = () => {
  const { adminLocale } = useI18n();
  const ui = copy[adminLocale];
  const locale = adminLocale === 'ru' ? 'ru-RU' : 'en-US';

  const [search, setSearch] = useState('');
  const [sessions, setSessions] = useState<VisualLedSession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [detailsBySessionId, setDetailsBySessionId] = useState<Record<string, SessionDetailsState>>({});
  const [expandedEvents, setExpandedEvents] = useState<Record<string, Record<number, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(ui.unauthorized);
      const response = await fetch('/api/visual-led-logs/sessions?limit=120&offset=0', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `HTTP ${response.status}`);
      }
      const payload = await response.json();
      setSessions((payload.items || []) as VisualLedSession[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [ui.unauthorized]);

  const loadSessionDetails = useCallback(async (sessionId: string) => {
    setDetailsBySessionId((prev) => ({
      ...prev,
      [sessionId]: {
        session: prev[sessionId]?.session || null,
        events: prev[sessionId]?.events || [],
        assets: prev[sessionId]?.assets || [],
        loading: true,
        error: null,
      },
    }));
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(ui.unauthorized);
      const response = await fetch(`/api/visual-led-logs/session?id=${encodeURIComponent(sessionId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `HTTP ${response.status}`);
      }
      const payload = await response.json();
      setDetailsBySessionId((prev) => ({
        ...prev,
        [sessionId]: {
          session: (payload.session as VisualLedSession) || null,
          events: (payload.events || []) as VisualLedEvent[],
          assets: (payload.assets || []) as VisualLedAsset[],
          loading: false,
          error: null,
        },
      }));
    } catch (err) {
      setDetailsBySessionId((prev) => ({
        ...prev,
        [sessionId]: {
          session: prev[sessionId]?.session || null,
          events: prev[sessionId]?.events || [],
          assets: prev[sessionId]?.assets || [],
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load session details',
        },
      }));
    }
  }, [ui.unauthorized]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((item) => {
      const haystack = [item.session_key, item.client_ip || '', item.page_url || '', item.referrer || '']
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [search, sessions]);

  return (
    <AdminLayout title={ui.title} subtitle={ui.subtitle}>
      <div className="space-y-4">
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={ui.search}
              className="max-w-xl"
            />
            <Button onClick={() => void loadSessions()}>{ui.reload}</Button>
          </div>
          {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}
        </div>

        {loading ? (
          <LoadingState title={ui.feed} />
        ) : (
          <div className="card p-3">
            <div className="mb-2 text-sm font-semibold text-white">{ui.feed}</div>
            {filtered.length === 0 ? (
              <EmptyState title={ui.noSessions} />
            ) : (
              <div className="space-y-2">
                {filtered.map((session) => {
                  const isExpanded = expandedSessionId === session.id;
                  const summary = session.summary || {};
                  const sessionScreens = asNumber(summary.screens);
                  const sessionScenes = asNumber(summary.scenes);
                  const visualNo = visualizationNumberFromSessionKey(session.session_key);
                  const details = detailsBySessionId[session.id];
                  const eventFeed = buildEventFeed(details?.events || []);
                  const insights = buildInsights(session, details?.events || []);
                  const eventExpandedMap = expandedEvents[session.id] || {};

                  return (
                    <div
                      key={session.id}
                      className={`rounded-lg border transition ${
                        isExpanded ? 'border-brand-400 bg-brand-500/10' : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedSessionId(null);
                            return;
                          }
                          setExpandedSessionId(session.id);
                          if (!details) void loadSessionDetails(session.id);
                        }}
                        className="w-full px-3 py-2 text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="inline-flex items-center rounded-md border border-white/15 bg-slate-950/70 px-2 py-0.5 text-[11px] font-semibold text-sky-200">
                            #{visualNo}
                          </div>
                          <div className="text-[11px] text-slate-400">{new Date(session.started_at).toLocaleString(locale)}</div>
                        </div>
                        <div className="mt-1 text-xs text-slate-300">{ui.visualization} #{visualNo}</div>
                        <div className="mt-1 text-[11px] text-slate-500 truncate">{session.session_key}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-300">
                          <span className="rounded bg-slate-900/70 px-1.5 py-0.5">{session.client_ip || 'IP?'}</span>
                          <span className="rounded bg-slate-900/70 px-1.5 py-0.5">{browserFromUserAgent(session.user_agent)}</span>
                          {sessionScenes !== null ? <span>S:{sessionScenes}</span> : null}
                          {sessionScreens !== null ? <span>LED:{sessionScreens}</span> : null}
                          {session.duration_sec !== null ? <span>{session.duration_sec}s</span> : null}
                        </div>
                      </button>

                      {isExpanded ? (
                        <div className="space-y-3 border-t border-white/10 px-3 pb-3 pt-2">
                          {details?.loading ? <LoadingState title={ui.events} /> : null}
                          {details?.error ? <div className="text-sm text-red-300">{details.error}</div> : null}

                          {!details?.loading && !details?.error ? (
                            <>
                              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2">
                                  <div className="text-[10px] uppercase tracking-wide text-slate-500">{ui.cards.screens}</div>
                                  <div className="text-sm font-semibold text-white">{insights.screens ?? '-'}</div>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2">
                                  <div className="text-[10px] uppercase tracking-wide text-slate-500">{ui.cards.scenes}</div>
                                  <div className="text-sm font-semibold text-white">{insights.scenes ?? '-'}</div>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2">
                                  <div className="text-[10px] uppercase tracking-wide text-slate-500">{ui.cards.duration}</div>
                                  <div className="text-sm font-semibold text-white">{formatDurationCompact(insights.duration)}</div>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2">
                                  <div className="text-[10px] uppercase tracking-wide text-slate-500">{ui.cards.assistApplied}</div>
                                  <div className="text-sm font-semibold text-white">{insights.assistAppliedCount}</div>
                                </div>
                              </div>

                              <div className="grid gap-2 text-sm md:grid-cols-2">
                                <div className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-300">
                                  {ui.cards.reportScope}: <span className="text-white">{insights.reportScope || '-'}</span>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-300">
                                  {ui.cards.reportSharedAt}:{' '}
                                  <span className="text-white">
                                    {insights.reportSharedAt ? new Date(insights.reportSharedAt).toLocaleString(locale) : '-'}
                                  </span>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-300">
                                  Screen created: <span className="text-white">{insights.screenCreatedCount}</span>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-300">
                                  Screen updated: <span className="text-white">{insights.screenUpdatedCount}</span>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-300 md:col-span-2">
                                  Background uploaded: <span className="text-white">{insights.backgroundUploadedCount}</span>
                                </div>
                                {insights.reportUrl ? (
                                  <div className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-300 md:col-span-2">
                                    <div className="mb-1">{ui.cards.reportLink}</div>
                                    <a
                                      href={insights.reportUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="break-all text-sky-300 hover:text-sky-200"
                                    >
                                      {insights.reportUrl}
                                    </a>
                                  </div>
                                ) : null}
                              </div>

                              <div>
                                <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">{ui.cards.sharedReports}</div>
                                {insights.reportShares.length === 0 ? (
                                  <div className="rounded-lg border border-dashed border-white/15 bg-slate-950/60 p-3 text-xs text-slate-400">
                                    {ui.cards.noSharedReports}
                                  </div>
                                ) : (
                                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {insights.reportShares.map((share) => (
                                      <div key={share.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-2">
                                        {share.previewImage ? (
                                          <img
                                            src={share.previewImage}
                                            alt="report preview"
                                            className="h-24 w-full rounded-md border border-white/10 object-cover"
                                            loading="lazy"
                                          />
                                        ) : (
                                          <div className="flex h-24 w-full items-center justify-center rounded-md border border-dashed border-white/15 text-xs text-slate-500">
                                            preview unavailable
                                          </div>
                                        )}
                                        <div className="mt-2 space-y-1 text-xs text-slate-300">
                                          <div>{new Date(share.at).toLocaleString(locale)}</div>
                                          <div>scope: {share.scope || '-'}</div>
                                          <div>S: {share.scenesTotal ?? '-'} · LED: {share.screensCurrent ?? '-'} · BG: {share.backgroundsTotal ?? '-'}</div>
                                        </div>
                                        <a
                                          href={share.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="mt-2 inline-flex rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                                        >
                                          {ui.open}
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div>
                                <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">{ui.backgrounds}</div>
                                {(details?.assets || []).length === 0 ? (
                                  <EmptyState title={ui.noBackgrounds} />
                                ) : (
                                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {(details?.assets || []).map((asset) => (
                                      <div key={asset.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-2">
                                        {asset.preview_url ? (
                                          <img
                                            src={asset.preview_url}
                                            alt={asset.file_name}
                                            className="h-28 w-full rounded-md border border-white/10 object-cover"
                                            loading="lazy"
                                          />
                                        ) : (
                                          <div className="flex h-28 w-full items-center justify-center rounded-md border border-dashed border-white/15 text-xs text-slate-500">
                                            preview unavailable
                                          </div>
                                        )}
                                        <div className="mt-2 text-xs text-slate-300">
                                          <div className="truncate font-medium text-white">{asset.file_name}</div>
                                          <div>{asset.mime_type || '-'}</div>
                                          <div>{asset.size_bytes ?? '-'} bytes</div>
                                          <div className="truncate text-slate-500">{asset.storage_path}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div>
                                <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">{ui.events}</div>
                                {eventFeed.length === 0 ? (
                                  <EmptyState title={ui.noEvents} />
                                ) : (
                                  <div className="max-h-[58vh] space-y-2 overflow-y-auto">
                                    {eventFeed.map((entry) => {
                                      const isEventExpanded = Boolean(eventExpandedMap[entry.id]);
                                      return (
                                        <button
                                          key={entry.id}
                                          type="button"
                                          onClick={() =>
                                            setExpandedEvents((prev) => ({
                                              ...prev,
                                              [session.id]: {
                                                ...(prev[session.id] || {}),
                                                [entry.id]: !isEventExpanded,
                                              },
                                            }))
                                          }
                                          className="w-full rounded-lg border border-white/10 bg-slate-950/60 p-2 text-left text-xs"
                                        >
                                          <div className="flex flex-wrap items-center gap-2 text-slate-400">
                                            <span>{new Date(entry.ts).toLocaleString(locale)}</span>
                                            <span>{entry.event_type}</span>
                                            <span>scene: {entry.scene_id || '-'}</span>
                                            <span>screen: {entry.screen_id || '-'}</span>
                                            {entry.scope ? <span>scope: {entry.scope}</span> : null}
                                          </div>
                                          {entry.url ? <div className="mt-1 truncate text-sky-300">{entry.url}</div> : null}
                                          {isEventExpanded ? (
                                            <pre className="mt-2 overflow-auto rounded-md border border-white/10 bg-slate-900/60 p-2 text-slate-300">
                                              {JSON.stringify(entry.payload || {}, null, 2)}
                                            </pre>
                                          ) : null}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              <div>
                                <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">{ui.summary}</div>
                                <pre className="max-h-56 overflow-auto rounded-lg border border-white/10 bg-slate-950/70 p-3 text-xs text-slate-200">
                                  {JSON.stringify(insights.summary || {}, null, 2)}
                                </pre>
                              </div>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminVisualLedLogsPage;
