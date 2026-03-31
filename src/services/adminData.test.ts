import { describe, it, expect } from 'vitest';
import {
  mapPackageFromDB,
  mapPackageToDB,
  mapCategoryFromDB,
  mapCategoryToDB,
  mapContactsFromDB,
  mapContactsToDB,
  sanitizeServices,
} from './adminData';

describe('mapPackageFromDB', () => {
  it('converts snake_case to camelCase', () => {
    const row = {
      id: 1,
      name: 'Лайт',
      for_formats: ['выставка', 'презентация'],
      includes: ['LED', 'Звук'],
      options: ['Доставка'],
      price_hint: 'от 50 000',
    };

    const result = mapPackageFromDB(row as any);

    expect(result).toEqual({
      id: 1,
      name: 'Лайт',
      forFormats: ['выставка', 'презентация'],
      includes: ['LED', 'Звук'],
      options: ['Доставка'],
      priceHint: 'от 50 000',
    });
  });

  it('handles null options', () => {
    const row = {
      id: 2,
      name: 'Медиум',
      for_formats: ['форум'],
      includes: ['LED'],
      options: null,
      price_hint: 'от 100 000',
    };

    const result = mapPackageFromDB(row as any);
    expect(result.options).toBeNull();
  });
});

describe('mapPackageToDB', () => {
  it('converts camelCase to snake_case', () => {
    const pkg = {
      id: 1,
      name: 'Лайт',
      forFormats: ['выставка'],
      includes: ['LED'],
      options: ['Доставка'],
      priceHint: 'от 50 000',
    };

    const result = mapPackageToDB(pkg);

    expect(result).toEqual({
      id: 1,
      name: 'Лайт',
      for_formats: ['выставка'],
      includes: ['LED'],
      options: ['Доставка'],
      price_hint: 'от 50 000',
    });
  });

  it('handles string id conversion', () => {
    const pkg = {
      id: '123',
      name: 'Test',
      forFormats: [],
      includes: [],
      priceHint: '',
    };

    const result = mapPackageToDB(pkg);
    expect(result.id).toBe(123);
  });
});

describe('mapCategoryFromDB', () => {
  it('converts snake_case to camelCase', () => {
    const row = {
      id: 1,
      title: 'Свет',
      short_description: 'Описание',
      bullets: ['пункт1', 'пункт2'],
      page_path: '/rent/light',
    };

    const result = mapCategoryFromDB(row as any);

    expect(result).toEqual({
      id: 1,
      title: 'Свет',
      shortDescription: 'Описание',
      bullets: ['пункт1', 'пункт2'],
      pagePath: '/rent/light',
    });
  });
});

describe('mapCategoryToDB', () => {
  it('converts camelCase to snake_case', () => {
    const cat = {
      id: 1,
      title: 'Свет',
      shortDescription: 'Описание',
      bullets: ['пункт1'],
      pagePath: '/rent/light',
    };

    const result = mapCategoryToDB(cat);

    expect(result).toEqual({
      id: 1,
      title: 'Свет',
      short_description: 'Описание',
      bullets: ['пункт1'],
      page_path: '/rent/light',
    });
  });
});

describe('mapContactsFromDB', () => {
  it('converts snake_case to camelCase', () => {
    const row = {
      id: 1,
      phones: ['+79121234567'],
      emails: ['test@example.com'],
      address: 'Екатеринбург',
      working_hours: '10:00-20:00',
    };

    const result = mapContactsFromDB(row as any);

    expect(result).toEqual({
      id: 1,
      phones: ['+79121234567'],
      emails: ['test@example.com'],
      address: 'Екатеринбург',
      workingHours: '10:00-20:00',
    });
  });

  it('handles null values', () => {
    const row = {
      phones: null,
      emails: null,
      address: null,
      working_hours: null,
    };

    const result = mapContactsFromDB(row as any);

    expect(result.phones).toEqual([]);
    expect(result.emails).toEqual([]);
    expect(result.address).toBe('');
    expect(result.workingHours).toBe('');
  });
});

describe('mapContactsToDB', () => {
  it('converts camelCase to snake_case', () => {
    const contacts = {
      id: 1,
      phones: ['+79121234567'],
      emails: ['test@example.com'],
      address: 'Екатеринбург',
      workingHours: '10:00-20:00',
    };

    const result = mapContactsToDB(contacts as any);

    expect(result).toEqual({
      id: 1,
      phones: ['+79121234567'],
      emails: ['test@example.com'],
      address: 'Екатеринбург',
      working_hours: '10:00-20:00',
    });
  });
});

describe('sanitizeServices', () => {
  it('filters and normalizes services', () => {
    const input = [' LED ', 'SOUND', 'invalid', 'light', ''];
    const result = sanitizeServices(input);

    expect(result).toEqual(['led', 'sound', 'light']);
  });

  it('returns empty array for invalid services', () => {
    const input = ['invalid', 'unknown', ''];
    const result = sanitizeServices(input);

    expect(result).toEqual([]);
  });

  it('accepts all valid services', () => {
    const input = ['led', 'sound', 'light', 'video', 'stage', 'support'];
    const result = sanitizeServices(input);

    expect(result).toEqual(['led', 'sound', 'light', 'video', 'stage', 'support']);
  });
});
