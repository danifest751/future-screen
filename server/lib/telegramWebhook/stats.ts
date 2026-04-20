import { getSupabaseClient } from './supabaseClient.js';
import { sendTelegramMessage } from './telegramApi.js';

export const YEKT_OFFSET_MINUTES = 5 * 60;

export const toYektLocal = (date: Date): Date =>
  new Date(date.getTime() + YEKT_OFFSET_MINUTES * 60 * 1000);

export const toUtcFromYektLocal = (date: Date): Date =>
  new Date(date.getTime() - YEKT_OFFSET_MINUTES * 60 * 1000);

export const getStatsPeriodStarts = (now: Date = new Date()) => {
  const local = toYektLocal(now);

  const dayStartLocal = new Date(local);
  dayStartLocal.setUTCHours(0, 0, 0, 0);

  const weekStartLocal = new Date(dayStartLocal);
  const weekDayMonBased = (weekStartLocal.getUTCDay() + 6) % 7;
  weekStartLocal.setUTCDate(weekStartLocal.getUTCDate() - weekDayMonBased);

  const monthStartLocal = new Date(dayStartLocal);
  monthStartLocal.setUTCDate(1);

  return {
    now,
    dayStart: toUtcFromYektLocal(dayStartLocal),
    weekStart: toUtcFromYektLocal(weekStartLocal),
    monthStart: toUtcFromYektLocal(monthStartLocal),
  };
};

export const inStatsPeriod = (date: Date, start: Date, end: Date): boolean =>
  date >= start && date <= end;

export const sendVisualizationStats = async (chatId: number): Promise<void> => {
  try {
    const periods = getStatsPeriodStarts();
    const supabase = getSupabaseClient();

    const [{ data: sessions, error: sessionsError }, { data: events, error: eventsError }] =
      await Promise.all([
        supabase
          .from('visual_led_sessions')
          .select('started_at, duration_sec')
          .gte('started_at', periods.monthStart.toISOString()),
        supabase
          .from('visual_led_events')
          .select('ts, event_type, payload')
          .in('event_type', ['report_shared', 'background_uploaded', 'assist_applied'])
          .gte('ts', periods.monthStart.toISOString()),
      ]);

    if (sessionsError) throw sessionsError;
    if (eventsError) throw eventsError;

    const ranges = [
      { label: 'Сегодня', start: periods.dayStart },
      { label: 'Неделя', start: periods.weekStart },
      { label: 'Месяц', start: periods.monthStart },
    ] as const;

    const now = periods.now;
    const rows = ranges.map((range) => {
      const sessionsInRange = (sessions || []).filter((item) =>
        inStatsPeriod(new Date(item.started_at), range.start, now),
      );
      const eventsInRange = (events || []).filter((item) =>
        inStatsPeriod(new Date(item.ts), range.start, now),
      );

      const sharedReports = eventsInRange.filter(
        (item) =>
          item.event_type === 'report_shared' &&
          typeof item.payload === 'object' &&
          item.payload !== null &&
          (item.payload as Record<string, unknown>).status === 'success',
      ).length;
      const backgrounds = eventsInRange.filter(
        (item) => item.event_type === 'background_uploaded',
      ).length;
      const assistApplied = eventsInRange.filter(
        (item) => item.event_type === 'assist_applied',
      ).length;

      const durationValues = sessionsInRange
        .map((item) => item.duration_sec)
        .filter(
          (value): value is number =>
            typeof value === 'number' && Number.isFinite(value) && value >= 0,
        );
      const avgDuration =
        durationValues.length > 0
          ? Math.round(
              durationValues.reduce((acc, value) => acc + value, 0) / durationValues.length,
            )
          : 0;

      return {
        label: range.label,
        sessions: sessionsInRange.length,
        sharedReports,
        backgrounds,
        assistApplied,
        avgDuration,
      };
    });

    const message =
      '📊 <b>Отчет по визуализациям</b>\n<i>Asia/Yekaterinburg</i>\n\n' +
      rows
        .map(
          (row) =>
            `<b>${row.label}</b>\n` +
            `• Сессии: <b>${row.sessions}</b>\n` +
            `• Поделились отчетом: <b>${row.sharedReports}</b>\n` +
            `• Загружено фонов: <b>${row.backgrounds}</b>\n` +
            `• Assist применен: <b>${row.assistApplied}</b>\n` +
            `• Ср. длительность: <b>${row.avgDuration}s</b>`,
        )
        .join('\n\n');

    await sendTelegramMessage(chatId, message);
  } catch (err) {
    console.error('[Stats] failed:', err);
    await sendTelegramMessage(chatId, '❌ Не удалось собрать статистику. Попробуйте позже.');
  }
};
