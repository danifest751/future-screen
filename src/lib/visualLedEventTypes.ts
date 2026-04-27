// Metadata for every event type emitted by the visualizer
// (public/visual-led/index.html → queueVisualLedEvent). Centralising
// here so the logs UI gets consistent colors, categories, and
// translations without string-matching in components.

export type VisualLedEventCategory =
  | 'session'
  | 'screen'
  | 'scene'
  | 'asset'
  | 'assist'
  | 'report'
  | 'project'
  | 'other';

export interface VisualLedEventMeta {
  key: string;
  category: VisualLedEventCategory;
  /** Tailwind class pair: bg/border + text colors for inline badges. */
  badgeClass: string;
  /** Hex color for timeline dots / charts. */
  color: string;
  labelRu: string;
  labelEn: string;
}

const category: Record<VisualLedEventCategory, { color: string; badge: string }> = {
  session: { color: '#60a5fa', badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  screen: { color: '#34d399', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  scene: { color: '#2dd4bf', badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
  asset: { color: '#67e8f9', badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  assist: { color: '#fbbf24', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  report: { color: '#38bdf8', badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  project: { color: '#fb7185', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  other: { color: '#94a3b8', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};

const EVENT_META: VisualLedEventMeta[] = [
  // session
  { key: 'session_started', category: 'session', ...meta('session'), labelRu: 'Сессия началась', labelEn: 'Session started' },
  { key: 'session_ended', category: 'session', ...meta('session'), labelRu: 'Сессия закрыта', labelEn: 'Session ended' },

  // screens
  { key: 'screen_created', category: 'screen', ...meta('screen'), labelRu: 'Экран создан', labelEn: 'Screen created' },
  { key: 'screen_updated', category: 'screen', ...meta('screen'), labelRu: 'Экран изменён', labelEn: 'Screen updated' },
  { key: 'screen_renamed', category: 'screen', ...meta('screen'), labelRu: 'Экран переименован', labelEn: 'Screen renamed' },
  { key: 'screen_deleted', category: 'screen', ...deletedMeta(), labelRu: 'Экран удалён', labelEn: 'Screen deleted' },

  // scenes
  { key: 'scene_created', category: 'scene', ...meta('scene'), labelRu: 'Сцена создана', labelEn: 'Scene created' },
  { key: 'scene_renamed', category: 'scene', ...meta('scene'), labelRu: 'Сцена переименована', labelEn: 'Scene renamed' },
  { key: 'scene_switched', category: 'scene', ...meta('scene'), labelRu: 'Сцена выбрана', labelEn: 'Scene switched' },
  { key: 'scene_copied_to_clipboard', category: 'scene', ...meta('scene'), labelRu: 'Сцена скопирована', labelEn: 'Scene copied' },

  // assets / backgrounds
  { key: 'background_uploaded', category: 'asset', ...meta('asset'), labelRu: 'Фон загружен', labelEn: 'Background uploaded' },
  { key: 'background_selected', category: 'asset', ...meta('asset'), labelRu: 'Фон выбран', labelEn: 'Background selected' },
  { key: 'scale_set', category: 'asset', ...meta('asset'), labelRu: 'Масштаб задан', labelEn: 'Scale set' },

  // assist
  { key: 'assist_analyze_started', category: 'assist', ...meta('assist'), labelRu: 'Assist: анализ запущен', labelEn: 'Assist: analysis started' },
  { key: 'assist_analyze_result', category: 'assist', ...meta('assist'), labelRu: 'Assist: результат', labelEn: 'Assist: result' },
  { key: 'assist_applied', category: 'assist', ...meta('assist'), labelRu: 'Assist применён', labelEn: 'Assist applied' },
  { key: 'assist_rejected', category: 'assist', ...deletedMeta(), labelRu: 'Assist отклонён', labelEn: 'Assist rejected' },

  // reports
  { key: 'report_exported', category: 'report', ...meta('report'), labelRu: 'Отчёт экспортирован', labelEn: 'Report exported' },
  { key: 'report_open_requested', category: 'report', ...meta('report'), labelRu: 'Запрос открытия отчёта', labelEn: 'Report open requested' },
  { key: 'report_shared', category: 'report', ...meta('report'), labelRu: 'Отчёт расшарен', labelEn: 'Report shared' },

  // project
  { key: 'project_saved', category: 'project', ...meta('project'), labelRu: 'Проект сохранён', labelEn: 'Project saved' },
  { key: 'project_loaded', category: 'project', ...meta('project'), labelRu: 'Проект загружен', labelEn: 'Project loaded' },
  { key: 'project_save_failed', category: 'project', ...deletedMeta(), labelRu: 'Ошибка сохранения проекта', labelEn: 'Project save failed' },
  { key: 'project_load_failed', category: 'project', ...deletedMeta(), labelRu: 'Ошибка загрузки проекта', labelEn: 'Project load failed' },
];

function meta(cat: VisualLedEventCategory): { badgeClass: string; color: string } {
  return { badgeClass: category[cat].badge, color: category[cat].color };
}

// Failed/deleted events use red regardless of category.
function deletedMeta(): { badgeClass: string; color: string } {
  return {
    badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
    color: '#f87171',
  };
}

const EVENT_META_BY_KEY: Record<string, VisualLedEventMeta> = Object.fromEntries(
  EVENT_META.map((item) => [item.key, item]),
);

export const ALL_EVENT_META = EVENT_META;

/** Always returns something — falls back to an "other" entry for unknown types. */
export function getEventMeta(eventType: string): VisualLedEventMeta {
  const hit = EVENT_META_BY_KEY[eventType];
  if (hit) return hit;
  return {
    key: eventType,
    category: 'other',
    badgeClass: category.other.badge,
    color: category.other.color,
    labelRu: eventType,
    labelEn: eventType,
  };
}

export function getEventLabel(eventType: string, locale: 'ru' | 'en'): string {
  const meta = getEventMeta(eventType);
  return locale === 'ru' ? meta.labelRu : meta.labelEn;
}
