import { describe, expect, it } from 'vitest';
import { countByPreset, humanizeLeadSource, matchesPreset, type SourceLabelDict } from './leadFilters';
import type { LeadLog } from '../types/leads';

const mkLead = (overrides: Partial<LeadLog>): LeadLog => ({
  id: overrides.id ?? 'l-1',
  source: overrides.source ?? 'site_form',
  name: overrides.name ?? 'Anon',
  phone: overrides.phone ?? '+7…',
  timestamp: overrides.timestamp ?? new Date().toISOString(),
  ...overrides,
});

// Use local-time Date constructors so the test is independent of the
// runner's timezone — startOfDay() in the implementation works in local
// time, which is correct for an admin UI but breaks UTC-string fixtures.
const localISO = (year: number, monthIdx: number, day: number, hour = 12, minute = 0) =>
  new Date(year, monthIdx, day, hour, minute).toISOString();

describe('matchesPreset', () => {
  const now = new Date(2026, 3, 26, 12, 0); // 26 April 2026, local noon

  it('all всегда true', () => {
    expect(matchesPreset(mkLead({}), 'all', now)).toBe(true);
  });

  it('unread = readAt отсутствует', () => {
    expect(matchesPreset(mkLead({ readAt: undefined }), 'unread', now)).toBe(true);
    expect(matchesPreset(mkLead({ readAt: localISO(2026, 3, 26, 11) }), 'unread', now)).toBe(false);
  });

  it('today = timestamp с начала текущего дня', () => {
    expect(matchesPreset(mkLead({ timestamp: localISO(2026, 3, 26, 5) }), 'today', now)).toBe(true);
    expect(matchesPreset(mkLead({ timestamp: localISO(2026, 3, 25, 23, 59) }), 'today', now)).toBe(false);
  });

  it('week = последние 7 дней включительно', () => {
    expect(matchesPreset(mkLead({ timestamp: localISO(2026, 3, 20, 12) }), 'week', now)).toBe(true);
    expect(matchesPreset(mkLead({ timestamp: localISO(2026, 3, 19, 0, 1) }), 'week', now)).toBe(false);
  });

  it('failed = status failed/partial', () => {
    expect(matchesPreset(mkLead({ status: 'failed' }), 'failed', now)).toBe(true);
    expect(matchesPreset(mkLead({ status: 'partial' }), 'failed', now)).toBe(true);
    expect(matchesPreset(mkLead({ status: 'delivered' }), 'failed', now)).toBe(false);
  });
});

describe('countByPreset', () => {
  it('считает все пресеты по списку', () => {
    const now = new Date(2026, 3, 26, 12, 0);
    const leads = [
      mkLead({ id: 'a', timestamp: localISO(2026, 3, 26, 10), readAt: undefined, status: 'delivered' }),
      mkLead({ id: 'b', timestamp: localISO(2026, 3, 25, 10), readAt: localISO(2026, 3, 25, 11), status: 'failed' }),
      mkLead({ id: 'c', timestamp: localISO(2026, 3, 19, 10), readAt: undefined, status: 'partial' }),
    ];
    expect(countByPreset(leads, now)).toEqual({
      all: 3,
      unread: 2,
      today: 1,
      week: 2,
      failed: 2,
    });
  });
});

describe('humanizeLeadSource', () => {
  const dict: SourceLabelDict = {
    paths: { '/': 'Главная', '/admin/services': 'Услуги' },
    sources: { hero_form: 'Форма Hero', callback: 'Обратный звонок' },
    fallback: (raw) => raw || '—',
  };

  it('source-ключ имеет приоритет', () => {
    expect(humanizeLeadSource(mkLead({ source: 'hero_form', pagePath: '/' }), dict)).toBe('Форма Hero');
  });

  it('падает на путь когда source неизвестен', () => {
    expect(humanizeLeadSource(mkLead({ source: 'unknown', pagePath: '/admin/services' }), dict)).toBe('Услуги');
  });

  it('нормализует слэш в конце пути и query', () => {
    expect(humanizeLeadSource(mkLead({ source: 'unknown', pagePath: '/admin/services/?utm=x' }), dict)).toBe('Услуги');
  });

  it('фолбэк когда ничего не подошло', () => {
    expect(humanizeLeadSource(mkLead({ source: 'weird', pagePath: '/no-such' }), dict)).toBe('weird');
  });

  it('пустой source и pagePath — возвращает fallback("")', () => {
    expect(humanizeLeadSource(mkLead({ source: '', pagePath: undefined }), dict)).toBe('—');
  });
});
