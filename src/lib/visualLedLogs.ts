import type {
  ReportShareItem,
  VisualLedEvent,
  VisualLedSession,
} from '../types/visualLedLogs';

export const asNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

export const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export function formatDurationCompact(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return '—';
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

export function browserFromUserAgent(userAgent: string | null): string {
  const ua = (userAgent || '').toLowerCase();
  if (!ua) return 'Unknown';
  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera';
  if (ua.includes('chrome/') && !ua.includes('edg/')) return 'Chrome';
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
  if (ua.includes('firefox/')) return 'Firefox';
  return 'Other';
}

export function deviceKindFromUserAgent(userAgent: string | null): 'mobile' | 'tablet' | 'desktop' {
  const ua = (userAgent || '').toLowerCase();
  if (!ua) return 'desktop';
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobile|iphone|android/.test(ua)) return 'mobile';
  return 'desktop';
}

/** Short human-readable session id: last 6 chars of session_key. */
export function shortSessionId(sessionKey: string): string {
  return sessionKey.slice(-6).toUpperCase();
}

export function buildEventFeed(events: VisualLedEvent[]): Array<VisualLedEvent & {
  scope: string | null;
  url: string | null;
}> {
  return [...events]
    .sort((a, b) => b.ts.localeCompare(a.ts))
    .map((event) => ({
      ...event,
      scope: asString(event.payload?.scope) || asString(event.payload?.export_scope),
      url: asString(event.payload?.url),
    }));
}

export interface SessionInsights {
  screens: number | null;
  scenes: number | null;
  duration: number | null;
  assistAppliedCount: number;
  screenCreatedCount: number;
  screenUpdatedCount: number;
  backgroundUploadedCount: number;
  reportScope: string | null;
  reportUrl: string | null;
  reportSharedAt: string | null;
  reportShares: ReportShareItem[];
  summary: Record<string, unknown>;
}

export function buildInsights(session: VisualLedSession, events: VisualLedEvent[]): SessionInsights {
  const summary = session.summary || {};
  const screens = asNumber(summary.screens);
  const scenes = asNumber(summary.scenes);
  const duration = asNumber(summary.duration_sec ?? session.duration_sec);

  const assistAppliedCount = events.filter((e) => e.event_type === 'assist_applied').length;
  const screenCreatedByEvent = events.filter((e) => e.event_type === 'screen_created').length;
  const screenUpdatedCount = events.filter((e) => e.event_type === 'screen_updated').length;
  const backgroundUploadedByEvent = events.filter((e) => e.event_type === 'background_uploaded').length;
  const summaryScreens = asNumber(summary.screens);
  const summaryBackgrounds = asNumber(summary.backgrounds);

  const lastReportExport = [...events].reverse().find((e) => e.event_type === 'report_exported');
  const lastReportShared = [...events]
    .reverse()
    .find((e) => e.event_type === 'report_shared' && e.payload?.status === 'success');

  const reportShares: ReportShareItem[] = events
    .filter((e) => e.event_type === 'report_shared' && e.payload?.status === 'success')
    .map((e) => {
      const metrics = asRecord(e.payload?.metrics);
      return {
        id: e.id,
        at: e.ts,
        url: asString(e.payload?.url) || '',
        scope: asString(e.payload?.export_scope),
        previewImage: asString(e.payload?.preview_image),
        screensCurrent: asNumber(metrics?.screens_current),
        scenesTotal: asNumber(metrics?.scenes_total),
        backgroundsTotal: asNumber(metrics?.backgrounds_total),
      };
    })
    .filter((item) => item.url)
    .sort((a, b) => b.at.localeCompare(a.at));

  const lastShare = reportShares[0] ?? null;

  return {
    screens,
    scenes,
    duration,
    assistAppliedCount,
    screenCreatedCount: Math.max(screenCreatedByEvent, summaryScreens ?? 0, lastShare?.screensCurrent ?? 0),
    screenUpdatedCount,
    backgroundUploadedCount: Math.max(
      backgroundUploadedByEvent,
      summaryBackgrounds ?? 0,
      lastShare?.backgroundsTotal ?? 0,
    ),
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

/** Fast feed-side flags derived from the list-level `summary` blob + column data. */
export interface SessionFlags {
  hasBackgrounds: boolean;
  hasSharedReport: boolean;
  hasAssist: boolean;
}

export function extractSessionFlags(session: VisualLedSession): SessionFlags {
  const summary = session.summary || {};
  const bg = asNumber(summary.backgrounds) ?? 0;
  const report = asString(summary.report_url);
  const assist = asNumber(summary.assist_applied_count) ?? asNumber(summary.assist_applied);
  return {
    hasBackgrounds: bg > 0,
    hasSharedReport: Boolean(report),
    hasAssist: (assist ?? 0) > 0,
  };
}

/** Bucket label for grouping sessions in the feed. */
export type DateBucket = 'today' | 'yesterday' | 'thisWeek' | 'earlier';

export function dateBucketFor(iso: string, now: Date = new Date()): DateBucket {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 'earlier';
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400_000;
  const weekAgo = today - 7 * 86400_000;
  if (t >= today) return 'today';
  if (t >= yesterday) return 'yesterday';
  if (t >= weekAgo) return 'thisWeek';
  return 'earlier';
}
