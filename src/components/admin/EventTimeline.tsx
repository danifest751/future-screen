import { useMemo, useState } from 'react';
import { getEventMeta } from '../../lib/visualLedEventTypes';
import { formatDurationCompact } from '../../lib/visualLedLogs';
import type { VisualLedEvent } from '../../types/visualLedLogs';

interface EventTimelineProps {
  events: VisualLedEvent[];
  startedAt: string;
  endedAt: string | null;
  locale: 'ru' | 'en';
  localeTag: string;
  onEventClick?: (event: VisualLedEvent) => void;
}

interface Marker {
  event: VisualLedEvent;
  leftPct: number;
  color: string;
  label: string;
}

/**
 * Horizontal timeline of session events. Each dot is positioned by its
 * offset from `startedAt` as a fraction of the total span. Dots are
 * colored by event category. Hover opens a tooltip; click (if
 * `onEventClick` provided) is delegated to the caller (e.g. to scroll
 * the events list).
 */
const EventTimeline = ({
  events,
  startedAt,
  endedAt,
  locale,
  localeTag,
  onEventClick,
}: EventTimelineProps) => {
  const startMs = new Date(startedAt).getTime();
  // If ended_at is null (session still open or never closed) fall back to
  // the last event's timestamp, or start + 1 minute.
  const fallbackEnd = events.length > 0
    ? new Date(events[events.length - 1]?.ts ?? startedAt).getTime()
    : startMs + 60_000;
  const endMs = endedAt ? new Date(endedAt).getTime() : fallbackEnd;
  const span = Math.max(endMs - startMs, 1);

  const markers = useMemo<Marker[]>(
    () =>
      events
        .map((event) => {
          const t = new Date(event.ts).getTime();
          if (!Number.isFinite(t)) return null;
          const leftPct = ((t - startMs) / span) * 100;
          const clamped = Math.max(0, Math.min(100, leftPct));
          const meta = getEventMeta(event.event_type);
          return {
            event,
            leftPct: clamped,
            color: meta.color,
            label: locale === 'ru' ? meta.labelRu : meta.labelEn,
          };
        })
        .filter((x): x is Marker => x !== null),
    [events, locale, span, startMs],
  );

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const startLabel = new Date(startedAt).toLocaleTimeString(localeTag, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const endLabel = endedAt
    ? new Date(endedAt).toLocaleTimeString(localeTag, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '·';

  const durationLabel = formatDurationCompact(Math.round(span / 1000));

  if (events.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 shadow-2xl shadow-black/10">
      <div className="mb-2 flex items-baseline justify-between text-[11px] text-slate-500">
        <span className="font-mono">{startLabel}</span>
        <span className="uppercase tracking-wide">
          {locale === 'ru' ? 'Таймлайн' : 'Timeline'} · {durationLabel} · {events.length}{' '}
          {locale === 'ru' ? 'соб' : 'ev'}
        </span>
        <span className="font-mono">{endLabel}</span>
      </div>
      <div className="relative h-10">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
        <div className="absolute left-0 top-1/2 h-3 w-px -translate-y-1/2 bg-white/20" />
        <div className="absolute right-0 top-1/2 h-3 w-px -translate-y-1/2 bg-white/20" />
        {markers.map((marker, idx) => {
          const active = hoveredIdx === idx;
          return (
            <button
              key={marker.event.id}
              type="button"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx((prev) => (prev === idx ? null : prev))}
              onClick={() => onEventClick?.(marker.event)}
              title={`${marker.label}\n${new Date(marker.event.ts).toLocaleString(localeTag)}`}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-150 active:scale-125"
              style={{ left: `${marker.leftPct}%` }}
            >
              <span
                className={`block rounded-full border transition-all ${
                  active ? 'h-3 w-3 border-white/60' : 'h-2 w-2 border-transparent'
                }`}
                style={{ backgroundColor: marker.color }}
              />
            </button>
          );
        })}
        {hoveredIdx !== null && markers[hoveredIdx] ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/15 bg-slate-950/95 px-2 py-1 text-[10px] text-slate-200 shadow-xl shadow-black/20"
            style={{
              left: `${markers[hoveredIdx].leftPct}%`,
              bottom: '100%',
              marginBottom: '6px',
            }}
          >
            <div className="font-medium text-white">{markers[hoveredIdx].label}</div>
            <div className="font-mono text-slate-400">
              {new Date(markers[hoveredIdx].event.ts).toLocaleTimeString(localeTag, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EventTimeline;
