import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Copy, ExternalLink } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { EmptyState, LoadingState } from '../../components/admin/ui';
import { useI18n } from '../../context/I18nContext';
import { loadVisualLedSession } from '../../services/visualLedLogs';
import {
  browserFromUserAgent,
  buildEventFeed,
  buildInsights,
  deviceKindFromUserAgent,
  formatDurationCompact,
  shortSessionId,
} from '../../lib/visualLedLogs';
import type {
  VisualLedAsset,
  VisualLedEvent,
  VisualLedSession,
} from '../../types/visualLedLogs';

type TabKey = 'overview' | 'events' | 'backgrounds' | 'reports' | 'raw';

const copy = {
  ru: {
    back: '← Назад к ленте',
    notFound: 'Сессия не найдена',
    loading: 'Загружаем сессию',
    copy: 'Скопировать',
    copied: 'Скопировано',
    tabs: {
      overview: 'Обзор',
      events: 'События',
      backgrounds: 'Фоны',
      reports: 'Отчёты',
      raw: 'Raw JSON',
    },
    identity: {
      heading: 'Идентификация',
      sessionKey: 'Session key',
      shortId: 'Short ID',
      admin: 'Админ',
      anon: 'Аноним',
      started: 'Начало',
      ended: 'Конец',
      duration: 'Длительность',
      pageUrl: 'Страница',
      referrer: 'Referrer',
      ip: 'IP',
      browser: 'Браузер',
      device: 'Устройство',
      userAgent: 'User Agent',
      timezone: 'Таймзона',
      acceptLanguage: 'Accept-Language',
      utm: 'UTM',
      viewport: 'Viewport',
      screen: 'Screen',
      deviceInfo: 'Device info',
      adminUserId: 'Admin user id',
    },
    cards: {
      screens: 'Экранов',
      scenes: 'Сцен',
      duration: 'Длительность',
      assistApplied: 'Assist применён',
      screenCreated: 'Создано экранов',
      screenUpdated: 'Обновлено экранов',
      backgroundUploaded: 'Загружено фонов',
      reportScope: 'Scope отчёта',
      reportSharedAt: 'Отчёт поделен',
      reportLink: 'Ссылка отчёта',
      open: 'Открыть',
    },
    empty: {
      backgrounds: 'Фоны не загружались',
      events: 'Событий нет',
      reports: 'Отчёты в этой сессии не шерились',
    },
  },
  en: {
    back: '← Back to feed',
    notFound: 'Session not found',
    loading: 'Loading session',
    copy: 'Copy',
    copied: 'Copied',
    tabs: {
      overview: 'Overview',
      events: 'Events',
      backgrounds: 'Backgrounds',
      reports: 'Reports',
      raw: 'Raw JSON',
    },
    identity: {
      heading: 'Identity',
      sessionKey: 'Session key',
      shortId: 'Short ID',
      admin: 'Admin',
      anon: 'Anonymous',
      started: 'Started',
      ended: 'Ended',
      duration: 'Duration',
      pageUrl: 'Page',
      referrer: 'Referrer',
      ip: 'IP',
      browser: 'Browser',
      device: 'Device',
      userAgent: 'User Agent',
      timezone: 'Timezone',
      acceptLanguage: 'Accept-Language',
      utm: 'UTM',
      viewport: 'Viewport',
      screen: 'Screen',
      deviceInfo: 'Device info',
      adminUserId: 'Admin user id',
    },
    cards: {
      screens: 'Screens',
      scenes: 'Scenes',
      duration: 'Duration',
      assistApplied: 'Assist applied',
      screenCreated: 'Screens created',
      screenUpdated: 'Screens updated',
      backgroundUploaded: 'Backgrounds uploaded',
      reportScope: 'Report scope',
      reportSharedAt: 'Report shared at',
      reportLink: 'Report link',
      open: 'Open',
    },
    empty: {
      backgrounds: 'No backgrounds uploaded',
      events: 'No events',
      reports: 'No shared reports in this session',
    },
  },
} as const;

const eventTypeColors: Record<string, string> = {
  assist_applied: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  report_shared: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  report_exported: 'bg-sky-500/10 text-sky-200 border-sky-500/20',
  screen_created: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  screen_updated: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',
  screen_deleted: 'bg-red-500/15 text-red-300 border-red-500/30',
  scene_created: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  scene_updated: 'bg-violet-500/10 text-violet-200 border-violet-500/20',
  background_uploaded: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
};

const eventBadgeClass = (type: string) =>
  eventTypeColors[type] ?? 'bg-slate-700/40 text-slate-300 border-slate-600/40';

const CopyButton = ({ value, label }: { value: string; label: string }) => {
  const [copied, setCopied] = useState(false);
  const onClick = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    }).catch(() => undefined);
  }, [value]);
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="inline-flex items-center gap-1 rounded border border-white/10 bg-slate-900/60 px-1.5 py-0.5 text-[10px] text-slate-300 hover:border-white/30 hover:text-white"
    >
      <Copy className="h-3 w-3" />
      {copied ? 'ok' : 'copy'}
    </button>
  );
};

const IdentityRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-start gap-3 py-1.5 text-xs">
    <dt className="w-32 shrink-0 font-mono text-slate-500">{label}</dt>
    <dd className="min-w-0 flex-1 break-words text-slate-200">{children}</dd>
  </div>
);

const renderJsonIfPresent = (value: Record<string, unknown> | null | undefined): string | null => {
  if (!value) return null;
  if (Object.keys(value).length === 0) return null;
  return JSON.stringify(value);
};

const AdminVisualLedSessionPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { adminLocale } = useI18n();
  const ui = copy[adminLocale];
  const localeTag = adminLocale === 'ru' ? 'ru-RU' : 'en-US';

  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as TabKey) || 'overview';
  const setTab = (next: TabKey) => {
    const sp = new URLSearchParams(searchParams);
    if (next === 'overview') sp.delete('tab');
    else sp.set('tab', next);
    setSearchParams(sp, { replace: true });
  };

  const [session, setSession] = useState<VisualLedSession | null>(null);
  const [events, setEvents] = useState<VisualLedEvent[]>([]);
  const [assets, setAssets] = useState<VisualLedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadVisualLedSession(sessionId)
      .then((detail) => {
        if (cancelled) return;
        setSession(detail.session);
        setEvents(detail.events);
        setAssets(detail.assets);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load session');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const insights = useMemo(
    () => (session ? buildInsights(session, events) : null),
    [events, session],
  );

  const eventFeed = useMemo(() => buildEventFeed(events), [events]);

  const title = session
    ? `${ui.identity.shortId} ${shortSessionId(session.session_key)}`
    : ui.loading;
  const subtitle = session
    ? `${new Date(session.started_at).toLocaleString(localeTag)} · ${formatDurationCompact(session.duration_sec)}`
    : '';

  const startedStr = session
    ? new Date(session.started_at).toLocaleString(localeTag)
    : '—';
  const endedStr = session?.ended_at ? new Date(session.ended_at).toLocaleString(localeTag) : '—';
  const browser = browserFromUserAgent(session?.user_agent ?? null);
  const device = deviceKindFromUserAgent(session?.user_agent ?? null);

  const tabButtonClass = (active: boolean) =>
    `rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition ${
      active
        ? 'border-brand-400 text-white'
        : 'border-transparent text-slate-400 hover:border-white/20 hover:text-white'
    }`;

  return (
    <AdminLayout title={title} subtitle={subtitle}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          to="/admin/visual-led-logs"
          className="inline-flex items-center gap-1 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {ui.back}
        </Link>
      </div>

      {loading ? <LoadingState title={ui.loading} /> : null}
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {!loading && !session && !error ? <EmptyState title={ui.notFound} /> : null}

      {session && !loading ? (
        <div className="space-y-4">
          {/* Identity block — everything we know about the session */}
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                {ui.identity.heading}
              </h2>
              <div className="flex items-center gap-2">
                {session.is_admin ? (
                  <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-200">
                    {ui.identity.admin}
                  </span>
                ) : (
                  <span className="rounded-full border border-white/10 bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                    {ui.identity.anon}
                  </span>
                )}
              </div>
            </div>
            <dl className="grid gap-x-8 md:grid-cols-2">
              <div>
                <IdentityRow label={ui.identity.shortId}>
                  <span className="font-mono text-sm font-semibold text-sky-200">
                    #{shortSessionId(session.session_key)}
                  </span>
                </IdentityRow>
                <IdentityRow label={ui.identity.sessionKey}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs">{session.session_key}</span>
                    <CopyButton value={session.session_key} label={ui.copy} />
                  </span>
                </IdentityRow>
                <IdentityRow label={ui.identity.started}>{startedStr}</IdentityRow>
                <IdentityRow label={ui.identity.ended}>{endedStr}</IdentityRow>
                <IdentityRow label={ui.identity.duration}>
                  {formatDurationCompact(session.duration_sec)}
                </IdentityRow>
                <IdentityRow label={ui.identity.pageUrl}>
                  {session.page_url ? (
                    <a
                      href={session.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 break-all text-sky-300 hover:text-sky-200"
                    >
                      {session.page_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </IdentityRow>
                <IdentityRow label={ui.identity.referrer}>
                  {session.referrer ? (
                    <span className="break-all text-slate-300">{session.referrer}</span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </IdentityRow>
              </div>
              <div>
                <IdentityRow label={ui.identity.ip}>
                  {session.client_ip ? (
                    <span className="font-mono text-slate-200">{session.client_ip}</span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </IdentityRow>
                <IdentityRow label={ui.identity.browser}>{browser}</IdentityRow>
                <IdentityRow label={ui.identity.device}>{device}</IdentityRow>
                <IdentityRow label={ui.identity.timezone}>
                  {session.timezone || <span className="text-slate-500">—</span>}
                </IdentityRow>
                <IdentityRow label={ui.identity.acceptLanguage}>
                  {session.accept_language || <span className="text-slate-500">—</span>}
                </IdentityRow>
                <IdentityRow label={ui.identity.userAgent}>
                  <span className="break-all text-[11px] text-slate-400">
                    {session.user_agent || '—'}
                  </span>
                </IdentityRow>
                {(() => {
                  const utm = renderJsonIfPresent(session.utm ?? null);
                  return utm ? (
                    <IdentityRow label={ui.identity.utm}>
                      <code className="break-all text-[11px] text-slate-300">{utm}</code>
                    </IdentityRow>
                  ) : null;
                })()}
                {(() => {
                  const vp = renderJsonIfPresent(session.viewport ?? null);
                  return vp ? (
                    <IdentityRow label={ui.identity.viewport}>
                      <code className="break-all text-[11px] text-slate-300">{vp}</code>
                    </IdentityRow>
                  ) : null;
                })()}
                {(() => {
                  const sc = renderJsonIfPresent(session.screen ?? null);
                  return sc ? (
                    <IdentityRow label={ui.identity.screen}>
                      <code className="break-all text-[11px] text-slate-300">{sc}</code>
                    </IdentityRow>
                  ) : null;
                })()}
                {(() => {
                  const dv = renderJsonIfPresent(session.device ?? null);
                  return dv ? (
                    <IdentityRow label={ui.identity.deviceInfo}>
                      <code className="break-all text-[11px] text-slate-300">{dv}</code>
                    </IdentityRow>
                  ) : null;
                })()}
                {session.admin_user_id ? (
                  <IdentityRow label={ui.identity.adminUserId}>
                    <span className="font-mono text-[11px] text-slate-300">
                      {session.admin_user_id}
                    </span>
                  </IdentityRow>
                ) : null}
              </div>
            </dl>
          </div>

          {/* Tabs */}
          <div className="border-b border-white/10">
            <nav className="flex flex-wrap gap-1">
              <button onClick={() => setTab('overview')} className={tabButtonClass(tab === 'overview')}>
                {ui.tabs.overview}
              </button>
              <button onClick={() => setTab('events')} className={tabButtonClass(tab === 'events')}>
                {ui.tabs.events}
                <span className="ml-1.5 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono">
                  {events.length}
                </span>
              </button>
              <button
                onClick={() => setTab('backgrounds')}
                className={tabButtonClass(tab === 'backgrounds')}
              >
                {ui.tabs.backgrounds}
                <span className="ml-1.5 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono">
                  {assets.length}
                </span>
              </button>
              <button onClick={() => setTab('reports')} className={tabButtonClass(tab === 'reports')}>
                {ui.tabs.reports}
                <span className="ml-1.5 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono">
                  {insights?.reportShares.length ?? 0}
                </span>
              </button>
              <button onClick={() => setTab('raw')} className={tabButtonClass(tab === 'raw')}>
                {ui.tabs.raw}
              </button>
            </nav>
          </div>

          {tab === 'overview' && insights && (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label={ui.cards.screens} value={insights.screens ?? '—'} />
                <StatCard label={ui.cards.scenes} value={insights.scenes ?? '—'} />
                <StatCard
                  label={ui.cards.duration}
                  value={formatDurationCompact(insights.duration)}
                />
                <StatCard label={ui.cards.assistApplied} value={insights.assistAppliedCount} />
                <StatCard
                  label={ui.cards.screenCreated}
                  value={insights.screenCreatedCount}
                />
                <StatCard
                  label={ui.cards.screenUpdated}
                  value={insights.screenUpdatedCount}
                />
                <StatCard
                  label={ui.cards.backgroundUploaded}
                  value={insights.backgroundUploadedCount}
                />
                <StatCard
                  label={ui.cards.reportScope}
                  value={insights.reportScope || '—'}
                />
              </div>

              {insights.reportUrl ? (
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 text-sm">
                  <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
                    {ui.cards.reportLink}
                  </div>
                  <a
                    href={insights.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 break-all text-sky-300 hover:text-sky-200"
                  >
                    {insights.reportUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {insights.reportSharedAt ? (
                    <div className="mt-2 text-xs text-slate-400">
                      {ui.cards.reportSharedAt}:{' '}
                      {new Date(insights.reportSharedAt).toLocaleString(localeTag)}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}

          {tab === 'events' && (
            <div className="space-y-2">
              {eventFeed.length === 0 ? (
                <EmptyState title={ui.empty.events} />
              ) : (
                eventFeed.map((e) => <EventRow key={e.id} entry={e} localeTag={localeTag} />)
              )}
            </div>
          )}

          {tab === 'backgrounds' && (
            <div>
              {assets.length === 0 ? (
                <EmptyState title={ui.empty.backgrounds} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {assets.map((asset) => (
                    <div key={asset.id} className="rounded-xl border border-white/10 bg-slate-900/50 p-2">
                      {asset.preview_url ? (
                        <img
                          src={asset.preview_url}
                          alt={asset.file_name}
                          className="h-36 w-full rounded-md border border-white/10 object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-36 w-full items-center justify-center rounded-md border border-dashed border-white/15 text-xs text-slate-500">
                          preview unavailable
                        </div>
                      )}
                      <div className="mt-2 space-y-0.5 text-xs text-slate-300">
                        <div className="truncate font-medium text-white">{asset.file_name}</div>
                        <div className="text-slate-500">
                          {asset.mime_type || '—'}
                          {asset.size_bytes ? ` · ${(asset.size_bytes / 1024).toFixed(1)} KB` : ''}
                        </div>
                        <div className="truncate text-[10px] text-slate-500">
                          {asset.storage_path}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'reports' && insights && (
            <div>
              {insights.reportShares.length === 0 ? (
                <EmptyState title={ui.empty.reports} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {insights.reportShares.map((share) => (
                    <div key={share.id} className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                      {share.previewImage ? (
                        <img
                          src={share.previewImage}
                          alt="report preview"
                          className="h-32 w-full rounded-md border border-white/10 object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-32 w-full items-center justify-center rounded-md border border-dashed border-white/15 text-xs text-slate-500">
                          preview unavailable
                        </div>
                      )}
                      <div className="mt-2 space-y-0.5 text-xs text-slate-300">
                        <div>{new Date(share.at).toLocaleString(localeTag)}</div>
                        <div>
                          scope: {share.scope || '—'} · S: {share.scenesTotal ?? '—'} · LED:{' '}
                          {share.screensCurrent ?? '—'} · BG: {share.backgroundsTotal ?? '—'}
                        </div>
                      </div>
                      <a
                        href={share.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                      >
                        {ui.cards.open}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'raw' && (
            <div className="space-y-3">
              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">summary</div>
                <pre className="max-h-96 overflow-auto rounded-xl border border-white/10 bg-slate-950/70 p-3 text-xs text-slate-200">
                  {JSON.stringify(session.summary || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </AdminLayout>
  );
};

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
    <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-0.5 text-lg font-semibold text-white">{value}</div>
  </div>
);

const EventRow = ({
  entry,
  localeTag,
}: {
  entry: VisualLedEvent & { scope: string | null; url: string | null };
  localeTag: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs"
      >
        <span className="w-36 shrink-0 font-mono text-slate-400">
          {new Date(entry.ts).toLocaleString(localeTag, {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${eventBadgeClass(entry.event_type)}`}
        >
          {entry.event_type}
        </span>
        <span className="min-w-0 flex-1 truncate text-slate-300">
          {entry.scope ? `scope=${entry.scope}` : null}
          {entry.scope && entry.scene_id ? ' · ' : null}
          {entry.scene_id ? `scene=${entry.scene_id}` : null}
          {(entry.scope || entry.scene_id) && entry.screen_id ? ' · ' : null}
          {entry.screen_id ? `screen=${entry.screen_id}` : null}
          {entry.url ? (
            <span className="ml-2 truncate text-sky-300">{entry.url}</span>
          ) : null}
        </span>
      </button>
      {open ? (
        <pre className="max-h-64 overflow-auto border-t border-white/10 bg-slate-950/60 p-3 text-[11px] text-slate-200">
          {JSON.stringify(entry.payload || {}, null, 2)}
        </pre>
      ) : null}
    </div>
  );
};

export default AdminVisualLedSessionPage;
