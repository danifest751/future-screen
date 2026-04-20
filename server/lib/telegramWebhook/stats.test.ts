import { describe, it, expect } from 'vitest';
import {
  YEKT_OFFSET_MINUTES,
  getStatsPeriodStarts,
  inStatsPeriod,
  toUtcFromYektLocal,
  toYektLocal,
} from './stats.js';

describe('telegramWebhook/stats', () => {
  it('YEKT_OFFSET_MINUTES is 5 hours', () => {
    expect(YEKT_OFFSET_MINUTES).toBe(300);
  });

  describe('toYektLocal / toUtcFromYektLocal', () => {
    it('round-trip returns the original timestamp', () => {
      const original = new Date('2026-04-21T12:00:00.000Z');
      expect(toUtcFromYektLocal(toYektLocal(original)).toISOString()).toBe(
        original.toISOString(),
      );
    });

    it('toYektLocal shifts forward by 5 hours', () => {
      const utc = new Date('2026-04-21T00:00:00.000Z');
      expect(toYektLocal(utc).toISOString()).toBe('2026-04-21T05:00:00.000Z');
    });

    it('toUtcFromYektLocal shifts backward by 5 hours', () => {
      const local = new Date('2026-04-21T05:00:00.000Z');
      expect(toUtcFromYektLocal(local).toISOString()).toBe('2026-04-21T00:00:00.000Z');
    });
  });

  describe('getStatsPeriodStarts', () => {
    it('day start is midnight Yekaterinburg, expressed as UTC', () => {
      // 2026-04-21 14:30 UTC is 2026-04-21 19:30 YEKT → day start 2026-04-21T00:00 YEKT = 2026-04-20T19:00 UTC
      const now = new Date('2026-04-21T14:30:00.000Z');
      const { dayStart } = getStatsPeriodStarts(now);
      expect(dayStart.toISOString()).toBe('2026-04-20T19:00:00.000Z');
    });

    it('week start rolls back to Monday of the current YEKT week', () => {
      // 2026-04-21 is a Tuesday in YEKT → weekStart is Monday 2026-04-20 00:00 YEKT = 2026-04-19T19:00 UTC
      const now = new Date('2026-04-21T14:30:00.000Z');
      const { weekStart } = getStatsPeriodStarts(now);
      expect(weekStart.toISOString()).toBe('2026-04-19T19:00:00.000Z');
    });

    it('when YEKT local day is Sunday, weekStart is the previous Monday', () => {
      // 2026-04-26 is Sunday in YEKT → weekStart Monday 2026-04-20 00:00 YEKT = 2026-04-19T19:00 UTC
      const now = new Date('2026-04-26T12:00:00.000Z');
      const { weekStart } = getStatsPeriodStarts(now);
      expect(weekStart.toISOString()).toBe('2026-04-19T19:00:00.000Z');
    });

    it('month start is first day of the current YEKT month', () => {
      const now = new Date('2026-04-21T14:30:00.000Z');
      const { monthStart } = getStatsPeriodStarts(now);
      expect(monthStart.toISOString()).toBe('2026-03-31T19:00:00.000Z');
    });

    it('passes through the now it was called with', () => {
      const now = new Date('2026-04-21T14:30:00.000Z');
      expect(getStatsPeriodStarts(now).now).toBe(now);
    });
  });

  describe('inStatsPeriod', () => {
    const start = new Date('2026-04-21T00:00:00.000Z');
    const end = new Date('2026-04-21T23:59:59.000Z');

    it('returns true for values inside the range (inclusive on both sides)', () => {
      expect(inStatsPeriod(start, start, end)).toBe(true);
      expect(inStatsPeriod(end, start, end)).toBe(true);
      expect(inStatsPeriod(new Date('2026-04-21T12:00:00.000Z'), start, end)).toBe(true);
    });

    it('returns false for values outside the range', () => {
      expect(inStatsPeriod(new Date('2026-04-20T23:59:59.000Z'), start, end)).toBe(false);
      expect(inStatsPeriod(new Date('2026-04-22T00:00:01.000Z'), start, end)).toBe(false);
    });
  });
});
