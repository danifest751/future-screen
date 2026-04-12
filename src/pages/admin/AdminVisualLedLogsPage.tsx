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
};

const copy = {
  ru: {
    title: 'Логи Visual LED',
    subtitle: 'Сессии, события пользователя и данные расчета',
    reload: 'Обновить',
    search: 'Поиск по IP / URL / session key',
    sessions: 'Сессии',
    events: 'События',
    assets: 'Фоны и файлы',
    client: 'Клиент',
    summary: 'Итог сессии',
    choose: 'Выбери сессию слева для просмотра деталей',
    noSessions: 'Сессии пока не найдены',
    unauthorized: 'Нет доступа к логам (нужна роль admin)',
  },
  en: {
    title: 'Visual LED logs',
    subtitle: 'Sessions, user actions, and calculation details',
    reload: 'Reload',
    search: 'Search by IP / URL / session key',
    sessions: 'Sessions',
    events: 'Events',
    assets: 'Backgrounds and files',
    client: 'Client',
    summary: 'Session summary',
    choose: 'Select a session on the left to view details',
    noSessions: 'No sessions yet',
    unauthorized: 'No access to logs (admin role required)',
  },
} as const;

async function getAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.access_token || null;
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
          <div className="grid gap-4 xl:grid-cols-[380px,1fr]">
            <div className="card max-h-[70vh] overflow-y-auto p-3">
              <div className="mb-2 text-sm font-semibold text-white">{ui.sessions}</div>
              {filtered.length === 0 ? (
                <EmptyState title={ui.noSessions} />
              ) : (
                <div className="space-y-2">
                  {filtered.map((session) => {
                    const active = session.id === selectedId;
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
                        <div className="text-xs text-slate-400">{session.session_key}</div>
                        <div className="mt-1 text-sm text-white">
                          {new Date(session.started_at).toLocaleString(locale)}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {session.client_ip || 'IP?'} · {session.timezone || 'timezone?'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {!selectedId ? (
                <div className="card p-6 text-slate-300">{ui.choose}</div>
              ) : detailsLoading ? (
                <LoadingState title={ui.events} />
              ) : (
                <>
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

                  <div className="card p-4">
                    <div className="mb-3 text-sm font-semibold text-white">{ui.summary}</div>
                    <pre className="max-h-52 overflow-auto rounded-lg border border-white/10 bg-slate-950/70 p-3 text-xs text-slate-200">
                      {JSON.stringify(selectedSession?.summary || {}, null, 2)}
                    </pre>
                  </div>

                  <div className="card p-4">
                    <div className="mb-3 text-sm font-semibold text-white">
                      {ui.events}: {events.length}
                    </div>
                    <div className="max-h-64 space-y-2 overflow-y-auto">
                      {events.map((entry) => (
                        <div key={entry.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-2 text-xs">
                          <div className="text-slate-400">{new Date(entry.ts).toLocaleString(locale)}</div>
                          <div className="font-medium text-white">{entry.event_type}</div>
                          <pre className="mt-1 overflow-auto text-slate-300">{JSON.stringify(entry.payload || {}, null, 2)}</pre>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card p-4">
                    <div className="mb-3 text-sm font-semibold text-white">
                      {ui.assets}: {assets.length}
                    </div>
                    <div className="max-h-56 space-y-2 overflow-y-auto">
                      {assets.map((asset) => (
                        <div key={asset.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-2 text-xs text-slate-300">
                          <div className="text-white">{asset.file_name}</div>
                          <div>{asset.storage_bucket}/{asset.storage_path}</div>
                          <div>{asset.mime_type || '-'} · {asset.size_bytes ?? '-'} bytes</div>
                        </div>
                      ))}
                    </div>
                  </div>
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
