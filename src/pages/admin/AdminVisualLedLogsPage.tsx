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

type TabId = 'overview' | 'results' | 'backgrounds' | 'events';

const copy = {
  ru: {
    title: 'Логи Visual LED',
    subtitle: 'Компактный просмотр сессий, фонов и результатов',
    reload: 'Обновить',
    search: 'Поиск по IP / URL / session key',
    sessions: 'Сессии',
    events: 'События',
    backgrounds: 'Фоны',
    client: 'Клиент',
    summary: 'Сводка',
    choose: 'Выберите сессию слева',
    noSessions: 'Сессии пока не найдены',
    unauthorized: 'Нет доступа к логам (нужна роль admin)',
    tabs: {
      overview: 'Обзор',
      results: 'Результаты',
      backgrounds: 'Фоны',
      events: 'События',
    },
    cards: {
      screens: 'Экранов',
      scenes: 'Сцен',
      duration: 'Длительность',
      assistApplied: 'Assist применен',
      reportScope: 'Экспорт',
      reportLink: 'Ссылка отчета',
      reportSharedAt: 'Поделен',
    },
    noBackgrounds: 'Фоны в этой сессии не загружались',
    noEvents: 'Событий нет',
    open: 'Открыть',
  },
  en: {
    title: 'Visual LED logs',
    subtitle: 'Compact sessions, backgrounds, and results view',
    reload: 'Reload',
    search: 'Search by IP / URL / session key',
    sessions: 'Sessions',
    events: 'Events',
    backgrounds: 'Backgrounds',
    client: 'Client',
    summary: 'Summary',
    choose: 'Select a session on the left',
    noSessions: 'No sessions yet',
    unauthorized: 'No access to logs (admin role required)',
    tabs: {
      overview: 'Overview',
      results: 'Results',
      backgrounds: 'Backgrounds',
      events: 'Events',
    },
    cards: {
      screens: 'Screens',
      scenes: 'Scenes',
      duration: 'Duration',
      assistApplied: 'Assist applied',
      reportScope: 'Export scope',
      reportLink: 'Report link',
      reportSharedAt: 'Shared at',
    },
    noBackgrounds: 'No backgrounds were uploaded in this session',
    noEvents: 'No events',
    open: 'Open',
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

const AdminVisualLedLogsPage = () => {
  const { adminLocale } = useI18n();
  const ui = copy[adminLocale];
  const locale = adminLocale === 'ru' ? 'ru-RU' : 'en-US';

  const [search, setSearch] = useState('');
  const [sessions, setSessions] = useState<VisualLedSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<VisualLedSession | null>(null);
  const [events, setEvents] = useState<VisualLedEvent[]>([]);
  const [assets, setAssets] = useState<VisualLedAsset[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(ui.unauthorized);
      const response = await fetch('/api/visual-led-logs/sessions?limit=120&offset=0', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `HTTP ${response.status}`);
      }
      const payload = await response.json();
      const items = (payload.items || []) as VisualLedSession[];
      setSessions(items);
      if (items.length && !selectedId) {
        setSelectedId(items[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [selectedId, ui.unauthorized]);

  const loadSessionDetails = useCallback(async (sessionId: string) => {
    setDetailsLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error(ui.unauthorized);
      const response = await fetch(`/api/visual-led-logs/session?id=${encodeURIComponent(sessionId)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `HTTP ${response.status}`);
      }
      const payload = await response.json();
      setSelectedSession(payload.session as VisualLedSession);
      setEvents((payload.events || []) as VisualLedEvent[]);
      setAssets((payload.assets || []) as VisualLedAsset[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session details');
    } finally {
      setDetailsLoading(false);
    }
  }, [ui.unauthorized]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (!selectedId) return;
    setActiveTab('overview');
    void loadSessionDetails(selectedId);
  }, [selectedId, loadSessionDetails]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((item) => {
      const haystack = [
        item.session_key,
        item.client_ip || '',
        item.page_url || '',
        item.referrer || '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [search, sessions]);

  const insights = useMemo(() => {
    const summary = selectedSession?.summary || {};
    const screens = asNumber(summary.screens);
    const scenes = asNumber(summary.scenes);
    const duration = asNumber(summary.duration_sec ?? selectedSession?.duration_sec);

    const assistAppliedCount = events.filter((event) => event.event_type === 'assist_applied').length;
    const screenCreatedCount = events.filter((event) => event.event_type === 'screen_created').length;
    const screenUpdatedCount = events.filter((event) => event.event_type === 'screen_updated').length;
    const backgroundUploadedCount = events.filter((event) => event.event_type === 'background_uploaded').length;

    const lastReportExport = [...events]
      .reverse()
      .find((event) => event.event_type === 'report_exported');
    const lastReportShared = [...events]
      .reverse()
      .find((event) => event.event_type === 'report_shared' && event.payload?.status === 'success');

    return {
      screens,
      scenes,
      duration,
      assistAppliedCount,
      screenCreatedCount,
      screenUpdatedCount,
      backgroundUploadedCount,
      reportScope: asString(lastReportExport?.payload?.scope),
      reportUrl: asString(lastReportShared?.payload?.url),
      reportSharedAt: lastReportShared?.ts || null,
      summary,
    };
  }, [selectedSession, events]);

  const tabButtons: Array<{ id: TabId; label: string; count?: number }> = [
    { id: 'overview', label: ui.tabs.overview },
    { id: 'results', label: ui.tabs.results },
    { id: 'backgrounds', label: ui.tabs.backgrounds, count: assets.length },
    { id: 'events', label: ui.tabs.events, count: events.length },
  ];

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
          <LoadingState title={ui.sessions} />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[340px,1fr]">
            <div className="card max-h-[74vh] overflow-y-auto p-3">
              <div className="mb-2 text-sm font-semibold text-white">{ui.sessions}</div>
              {filtered.length === 0 ? (
                <EmptyState title={ui.noSessions} />
              ) : (
                <div className="space-y-2">
                  {filtered.map((session) => {
                    const active = session.id === selectedId;
                    const summary = session.summary || {};
                    const sessionScreens = asNumber(summary.screens);
                    const sessionScenes = asNumber(summary.scenes);
                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => setSelectedId(session.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                          active
                            ? 'border-brand-400 bg-brand-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/30'
                        }`}
                      >
                        <div className="text-[11px] text-slate-400">{session.session_key}</div>
                        <div className="mt-1 text-sm text-white">
                          {new Date(session.started_at).toLocaleString(locale)}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-400">
                          <span>{session.client_ip || 'IP?'}</span>
                          {sessionScenes !== null ? <span>S:{sessionScenes}</span> : null}
                          {sessionScreens !== null ? <span>LED:{sessionScreens}</span> : null}
                          {session.duration_sec !== null ? <span>{session.duration_sec}s</span> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {!selectedId ? (
                <div className="card p-6 text-slate-300">{ui.choose}</div>
              ) : detailsLoading ? (
                <LoadingState title={ui.events} />
              ) : (
                <>
                  <div className="card p-3">
                    <div className="mb-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
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
                        <div className="text-sm font-semibold text-white">
                          {insights.duration !== null ? `${insights.duration}s` : '-'}
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wide text-slate-500">{ui.cards.assistApplied}</div>
                        <div className="text-sm font-semibold text-white">{insights.assistAppliedCount}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {tabButtons.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`rounded-full border px-3 py-1.5 text-xs transition ${
                            activeTab === tab.id
                              ? 'border-brand-500/50 bg-brand-500/15 text-white'
                              : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'
                          }`}
                        >
                          {tab.label}
                          {typeof tab.count === 'number' ? ` (${tab.count})` : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeTab === 'overview' ? (
                    <div className="card p-4">
                      <div className="mb-3 text-sm font-semibold text-white">{ui.client}</div>
                      {selectedSession ? (
                        <div className="grid gap-2 text-sm md:grid-cols-2">
                          <div className="text-slate-300">Session: {selectedSession.session_key}</div>
                          <div className="text-slate-300">IP: {selectedSession.client_ip || '-'}</div>
                          <div className="text-slate-300">Started: {new Date(selectedSession.started_at).toLocaleString(locale)}</div>
                          <div className="text-slate-300">Duration: {selectedSession.duration_sec ?? '-'} sec</div>
                          <div className="text-slate-300 md:col-span-2 break-all">URL: {selectedSession.page_url || '-'}</div>
                          <div className="text-slate-300 md:col-span-2 break-all">UA: {selectedSession.user_agent || '-'}</div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {activeTab === 'results' ? (
                    <div className="card p-4">
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

                      <div className="mt-3">
                        <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">{ui.summary}</div>
                        <pre className="max-h-56 overflow-auto rounded-lg border border-white/10 bg-slate-950/70 p-3 text-xs text-slate-200">
                          {JSON.stringify(insights.summary || {}, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'backgrounds' ? (
                    <div className="card p-4">
                      {assets.length === 0 ? (
                        <EmptyState title={ui.noBackgrounds} />
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {assets.map((asset) => (
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
                              {asset.preview_url ? (
                                <a
                                  href={asset.preview_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-flex rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                                >
                                  {ui.open}
                                </a>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {activeTab === 'events' ? (
                    <div className="card p-4">
                      {events.length === 0 ? (
                        <EmptyState title={ui.noEvents} />
                      ) : (
                        <div className="max-h-[58vh] space-y-2 overflow-y-auto">
                          {events.map((entry) => (
                            <div key={entry.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-2 text-xs">
                              <div className="flex flex-wrap gap-2 text-slate-400">
                                <span>{new Date(entry.ts).toLocaleString(locale)}</span>
                                <span>{entry.scene_id || '-'}</span>
                                <span>{entry.screen_id || '-'}</span>
                              </div>
                              <div className="font-medium text-white">{entry.event_type}</div>
                              <pre className="mt-1 overflow-auto text-slate-300">{JSON.stringify(entry.payload || {}, null, 2)}</pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminVisualLedLogsPage;
