import { expect } from 'vitest';
import {
  mapCaseFromDB,
  mapCategoryFromDB,
  mapPackageFromDB,
  mapLeadFromDB,
  mapContactsFromDB,
  mapCaseToDB,
  mapCategoryToDB,
  mapPackageToDB,
  mapContactsToDB,
  mapLeadToDB,
} from './mappers';

describe('mapCaseFromDB', () => {
  it('maps case row to app shape', () => {
    const row = {
      id: 1,
      slug: 'test-case',
      title: 'Тестовый кейс',
      title_en: null,
      city: 'Москва',
      city_en: null,
      date: '2024',
      date_en: null,
      format: 'Концерт',
      format_en: null,
      services: ['led', 'sound'],
      summary: 'Описание',
      summary_en: null,
      metrics: '1000 зрителей',
      metrics_en: null,
      images: ['img1.jpg', 'img2.jpg'],
      videos: ['video1.mp4'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const result = mapCaseFromDB(row);

    expect(result.slug).toBe('test-case');
    expect(result.title).toBe('Тестовый кейс');
    expect(result.city).toBe('Москва');
    expect(result.services).toEqual(['led', 'sound']);
    expect(result.images).toEqual(['img1.jpg', 'img2.jpg']);
    expect(result.videos).toEqual(['video1.mp4']);
  });

  it('handles nullable values', () => {
    const row = {
      id: 1,
      slug: 'test-case',
      title: 'Тестовый кейс',
      title_en: null,
      city: null,
      city_en: null,
      date: null,
      date_en: null,
      format: null,
      format_en: null,
      services: null,
      summary: null,
      summary_en: null,
      metrics: null,
      metrics_en: null,
      images: null,
      videos: null,
      created_at: null,
      updated_at: null,
    };

    const result = mapCaseFromDB(row);

    expect(result.city).toBe('');
    expect(result.services).toEqual([]);
    expect(result.images).toBeUndefined();
    expect(result.videos).toBeUndefined();
  });
});

describe('mapCaseToDB', () => {
  it('maps case item to db shape', () => {
    const caseItem = {
      slug: 'test-case',
      title: 'Тестовый кейс',
      city: 'Москва',
      date: '2024',
      format: 'Концерт',
      services: ['led', 'sound'],
      summary: 'Описание',
      metrics: '1000 зрителей',
      images: ['img1.jpg'],
      videos: ['video1.mp4'],
    };

    const result = mapCaseToDB(caseItem);

    expect(result.slug).toBe('test-case');
    expect(result.title).toBe('Тестовый кейс');
    expect(result.services).toEqual(['led', 'sound']);
  });

  it('maps EN locale fields and mirrors RU fields for inserts', () => {
    const result = mapCaseToDB(
      {
        slug: 'en-case',
        title: 'English title',
        city: 'London',
        date: '2026',
        format: 'Forum',
        summary: 'Summary',
        metrics: '42',
      },
      'en',
      true,
    );

    expect(result).toEqual(
      expect.objectContaining({
        slug: 'en-case',
        title: 'English title',
        city: 'London',
        date: '2026',
        format: 'Forum',
        summary: 'Summary',
        metrics: '42',
        title_en: 'English title',
      }),
    );
  });
});

describe('mapCategoryFromDB', () => {
  it('maps category row to app shape', () => {
    const row = {
      id: 1,
      title: 'Свет',
      title_en: null,
      short_description: 'Краткое описание',
      short_description_en: null,
      bullets: ['буллет 1', 'буллет 2'],
      bullets_en: null,
      page_path: '/rent/light',
      created_at: '2024-01-01T00:00:00Z',
    };

    const result = mapCategoryFromDB(row);

    expect(result.id).toBe(1);
    expect(result.title).toBe('Свет');
    expect(result.shortDescription).toBe('Краткое описание');
    expect(result.bullets).toEqual(['буллет 1', 'буллет 2']);
    expect(result.pagePath).toBe('/rent/light');
  });

  it('handles nullable values', () => {
    const row = {
      id: 1,
      title: 'Свет',
      title_en: null,
      short_description: null,
      short_description_en: null,
      bullets: null,
      bullets_en: null,
      page_path: null,
      created_at: null,
    };

    const result = mapCategoryFromDB(row);

    expect(result.shortDescription).toBe('');
    expect(result.bullets).toEqual([]);
    expect(result.pagePath).toBe('');
  });
});

describe('mapCategoryToDB', () => {
  it('maps category item to db shape', () => {
    const category = {
      id: 1,
      title: 'Свет',
      shortDescription: 'Краткое описание',
      bullets: ['буллет 1'],
      pagePath: '/rent/light',
    };

    const result = mapCategoryToDB(category);

    expect(result.title).toBe('Свет');
    expect(result.short_description).toBe('Краткое описание');
    expect(result.bullets).toEqual(['буллет 1']);
    expect(result.page_path).toBe('/rent/light');
  });

  it('maps EN locale category fields and keeps page_path', () => {
    const result = mapCategoryToDB(
      {
        id: 1,
        title: 'Lights',
        shortDescription: 'Short',
        bullets: ['One'],
        pagePath: '/rent/lights',
      },
      'en',
      true,
    );

    expect(result).toEqual(
      expect.objectContaining({
        title: 'Lights',
        short_description: 'Short',
        bullets: ['One'],
        title_en: 'Lights',
        short_description_en: 'Short',
        bullets_en: ['One'],
        page_path: '/rent/lights',
      }),
    );
  });
});

describe('mapPackageFromDB', () => {
  it('maps package row to app shape', () => {
    const row = {
      id: 1,
      name: 'Лайт',
      name_en: null,
      for_formats: ['Концерт', 'Форум'],
      for_formats_en: null,
      includes: ['Включено 1', 'Включено 2'],
      includes_en: null,
      options: ['Опция 1'],
      options_en: null,
      price_hint: 'Быстрый запуск',
      price_hint_en: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    const result = mapPackageFromDB(row);

    expect(result.id).toBe(1);
    expect(result.name).toBe('Лайт');
    expect(result.forFormats).toEqual(['Концерт', 'Форум']);
    expect(result.includes).toEqual(['Включено 1', 'Включено 2']);
    expect(result.options).toEqual(['Опция 1']);
    expect(result.priceHint).toBe('Быстрый запуск');
  });

  it('handles nullable values', () => {
    const row = {
      id: 1,
      name: 'Лайт',
      name_en: null,
      for_formats: null,
      for_formats_en: null,
      includes: null,
      includes_en: null,
      options: null,
      options_en: null,
      price_hint: null,
      price_hint_en: null,
      created_at: null,
    };

    const result = mapPackageFromDB(row);

    expect(result.forFormats).toEqual([]);
    expect(result.includes).toEqual([]);
    expect(result.options).toBeUndefined();
    expect(result.priceHint).toBeUndefined();
  });
});

describe('mapPackageToDB', () => {
  it('maps package item to db shape', () => {
    const pkg = {
      id: 1,
      name: 'Лайт',
      forFormats: ['Концерт'],
      includes: ['Включено'],
      options: ['Опция'],
      priceHint: 'Быстрый запуск',
    };

    const result = mapPackageToDB(pkg);

    expect(result.name).toBe('Лайт');
    expect(result.for_formats).toEqual(['Концерт']);
    expect(result.includes).toEqual(['Включено']);
    expect(result.options).toEqual(['Опция']);
    expect(result.price_hint).toBe('Быстрый запуск');
  });

  it('maps EN locale package fields and mirrors insert payload', () => {
    const result = mapPackageToDB(
      {
        id: 1,
        name: 'Basic',
        forFormats: ['Expo'],
        includes: ['Screen'],
        options: ['Truss'],
        priceHint: 'From 1000',
      },
      'en',
      true,
    );

    expect(result).toEqual(
      expect.objectContaining({
        name: 'Basic',
        for_formats: ['Expo'],
        includes: ['Screen'],
        options: ['Truss'],
        price_hint: 'From 1000',
        name_en: 'Basic',
      }),
    );
  });
});

describe('mapLeadFromDB', () => {
  it('maps lead row to app shape', () => {
    const row = {
      id: '1',
      created_at: '2024-01-01T00:00:00Z',
      request_id: 'req-1',
      source: 'form',
      name: 'Иван',
      phone: '+79991234567',
      email: 'test@example.com',
      telegram: '@username',
      city: 'Москва',
      date: '2024-02-01',
      format: 'Концерт',
      comment: 'Комментарий',
      extra: { key: 'value' },
      page_path: '/rent',
      referrer: 'https://example.com',
      status: 'new',
      delivery_log: [],
      deleted_at: null,
    };

    const result = mapLeadFromDB(row);

    expect(result.id).toBe('1');
    expect(result.requestId).toBe('req-1');
    expect(result.timestamp).toBe('2024-01-01T00:00:00Z');
    expect(result.source).toBe('form');
    expect(result.name).toBe('Иван');
    expect(result.phone).toBe('+79991234567');
    expect(result.email).toBe('test@example.com');
    expect(result.pagePath).toBe('/rent');
    expect(result.referrer).toBe('https://example.com');
    expect(result.city).toBe('Москва');
  });

  it('handles nullable values', () => {
    const row = {
      id: '1',
      created_at: null,
      request_id: null,
      source: 'form',
      name: 'Иван',
      phone: '+79991234567',
      email: null,
      telegram: null,
      city: null,
      date: null,
      format: null,
      comment: null,
      extra: null,
      page_path: null,
      referrer: null,
      status: null,
      delivery_log: null,
      deleted_at: null,
    };

    const result = mapLeadFromDB(row);

    expect(result.email).toBeUndefined();
    expect(result.telegram).toBeUndefined();
    expect(result.city).toBeUndefined();
  });
});

describe('mapContactsFromDB', () => {
  it('maps contacts rows to app shape', () => {
    const rows = [
      {
        id: 1,
        phones: ['+79991234567'],
        emails: ['test@example.com'],
        address: 'Адрес',
        address_en: null,
        working_hours: '10:00-20:00',
        working_hours_en: null,
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const result = mapContactsFromDB(rows);

    expect(result.id).toBe(1);
    expect(result.phones).toEqual(['+79991234567']);
    expect(result.emails).toEqual(['test@example.com']);
    expect(result.address).toBe('Адрес');
    expect(result.workingHours).toBe('10:00-20:00');
  });

  it('returns empty values when no rows exist', () => {
    const result = mapContactsFromDB([]);

    expect(result.phones).toEqual([]);
    expect(result.emails).toEqual([]);
    expect(result.address).toBe('');
    expect(result.workingHours).toBe('');
  });

  it('uses EN localized contacts with optional RU fallback', () => {
    const rows = [
      {
        id: 1,
        phones: null,
        emails: null,
        address: 'RU address',
        address_en: null,
        working_hours: 'RU hours',
        working_hours_en: null,
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const withFallback = mapContactsFromDB(rows as any, 'en', true);
    expect(withFallback.address).toBe('RU address');
    expect(withFallback.workingHours).toBe('RU hours');

    const noFallback = mapContactsFromDB(rows as any, 'en', false);
    expect(noFallback.address).toBe('');
    expect(noFallback.workingHours).toBe('');
  });
});

describe('mapContactsToDB', () => {
  const contacts = {
    phones: ['+79990000000'],
    emails: ['mail@example.com'],
    address: 'Address',
    workingHours: '10:00-20:00',
  };

  it('maps RU locale to base contact columns', () => {
    expect(mapContactsToDB(contacts, 'ru')).toEqual({
      phones: contacts.phones,
      emails: contacts.emails,
      address: contacts.address,
      working_hours: contacts.workingHours,
    });
  });

  it('maps EN locale to localized contact columns', () => {
    expect(mapContactsToDB(contacts, 'en')).toEqual({
      phones: contacts.phones,
      emails: contacts.emails,
      address_en: contacts.address,
      working_hours_en: contacts.workingHours,
    });
  });
});

describe('mapLeadToDB', () => {
  it('maps lead log fields to DB column names', () => {
    const result = mapLeadToDB({
      id: '1',
      requestId: 'req-123',
      timestamp: '2024-01-01T00:00:00Z',
      source: 'site',
      name: 'Ivan',
      phone: '+79991234567',
      email: 'ivan@example.com',
      telegram: '@ivan',
      city: 'Moscow',
      date: '2024-10-01',
      format: 'concert',
      comment: 'hello',
      extra: { utm: 'x' },
      pagePath: '/consult',
      referrer: 'https://example.com',
      status: 'new',
      deliveryLog: [{ channel: 'telegram', status: 'sent' } as any],
    });

    expect(result).toEqual(
      expect.objectContaining({
        request_id: 'req-123',
        source: 'site',
        page_path: '/consult',
        delivery_log: [{ channel: 'telegram', status: 'sent' }],
      }),
    );
  });
});

describe('ID conversion for mutations', () => {
  it('converts string id to number', () => {
    const id = '123';
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    expect(numId).toBe(123);
    expect(typeof numId).toBe('number');
  });

  it('keeps numeric id as is', () => {
    const id = 456;
    const numId = typeof id === 'string' ? parseInt(id as unknown as string, 10) : id;
    expect(numId).toBe(456);
    expect(typeof numId).toBe('number');
  });

  it('detects invalid numeric id string', () => {
    const id = 'invalid';
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    expect(isNaN(numId)).toBe(true);
  });

  it('excludes id from rest in destructuring for string id', () => {
    const pkg = { id: '123', name: 'Test', for_formats: ['format1'] };
    const { id, ...dataWithoutId } = pkg;

    expect(id).toBe('123');
    expect('id' in dataWithoutId).toBe(false);
    expect(dataWithoutId).toEqual({ name: 'Test', for_formats: ['format1'] });
  });

  it('excludes id from rest in destructuring for numeric id', () => {
    const pkg = { id: 123, name: 'Test', for_formats: ['format1'] };
    const { id, ...dataWithoutId } = pkg;

    expect(id).toBe(123);
    expect('id' in dataWithoutId).toBe(false);
    expect(dataWithoutId).toEqual({ name: 'Test', for_formats: ['format1'] });
  });
});
