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
} from './mappers';

describe('mapCaseFromDB', () => {
  it('должен преобразовать кейс из БД в формат приложения', () => {
    const row = {
      id: 1,
      slug: 'test-case',
      title: 'Тестовый кейс',
      city: 'Москва',
      date: '2024',
      format: 'Концерт',
      services: ['led', 'sound'],
      summary: 'Описание',
      metrics: '1000 зрителей',
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

  it('должен обработать null значения', () => {
    const row = {
      id: 1,
      slug: 'test-case',
      title: 'Тестовый кейс',
      city: null,
      date: null,
      format: null,
      services: null,
      summary: null,
      metrics: null,
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
  it('должен преобразовать кейс в формат БД', () => {
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
});

describe('mapCategoryFromDB', () => {
  it('должен преобразовать категорию из БД в формат приложения', () => {
    const row = {
      id: 1,
      title: 'Свет',
      short_description: 'Краткое описание',
      bullets: ['буллет 1', 'буллет 2'],
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

  it('должен обработать null значения', () => {
    const row = {
      id: 1,
      title: 'Свет',
      short_description: null,
      bullets: null,
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
  it('должен преобразовать категорию в формат БД', () => {
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
});

describe('mapPackageFromDB', () => {
  it('должен преобразовать пакет из БД в формат приложения', () => {
    const row = {
      id: 1,
      name: 'Лайт',
      for_formats: ['Концерт', 'Форум'],
      includes: ['Включено 1', 'Включено 2'],
      options: ['Опция 1'],
      price_hint: 'Быстрый запуск',
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

  it('должен обработать null значения', () => {
    const row = {
      id: 1,
      name: 'Лайт',
      for_formats: null,
      includes: null,
      options: null,
      price_hint: null,
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
  it('должен преобразовать пакет в формат БД', () => {
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
});

describe('mapLeadFromDB', () => {
  it('должен преобразовать лид из БД в формат приложения', () => {
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

  it('должен обработать null значения', () => {
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
    };

    const result = mapLeadFromDB(row);

    expect(result.email).toBeUndefined();
    expect(result.telegram).toBeUndefined();
    expect(result.city).toBeUndefined();
  });
});

describe('mapContactsFromDB', () => {
  it('должен преобразовать контакты из БД в формат приложения', () => {
    const rows = [
      {
        id: 1,
        phones: ['+79991234567'],
        emails: ['test@example.com'],
        address: 'Адрес',
        working_hours: '10:00-20:00',
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

  it('должен вернуть пустые значения при отсутствии данных', () => {
    const result = mapContactsFromDB([]);

    expect(result.phones).toEqual([]);
    expect(result.emails).toEqual([]);
    expect(result.address).toBe('');
    expect(result.workingHours).toBe('');
  });
});

describe('ID conversion for mutations', () => {
  it('должен конвертировать строковый ID в числовой', () => {
    const id = '123';
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    expect(numId).toBe(123);
    expect(typeof numId).toBe('number');
  });

  it('должен оставить числовой ID как есть', () => {
    const id = 456;
    const numId = typeof id === 'string' ? parseInt(id as unknown as string, 10) : id;
    expect(numId).toBe(456);
    expect(typeof numId).toBe('number');
  });

  it('должен обнаружить невалидный строковый ID', () => {
    const id = 'invalid';
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    expect(isNaN(numId)).toBe(true);
  });

  it('должен исключить id из rest при деструктуризации', () => {
    const pkg = { id: '123', name: 'Test', for_formats: ['format1'] };
    const { id, ...rest } = pkg;
    const { id: _, ...dataWithoutId } = rest as Record<string, unknown> & { id?: unknown };
    
    expect(id).toBe('123');
    expect('id' in dataWithoutId).toBe(false);
    expect(dataWithoutId).toEqual({ name: 'Test', for_formats: ['format1'] });
  });

  it('должен исключить id из rest при числовом id', () => {
    const pkg = { id: 123, name: 'Test', for_formats: ['format1'] };
    const { id, ...rest } = pkg;
    const { id: _, ...dataWithoutId } = rest as Record<string, unknown> & { id?: unknown };
    
    expect(id).toBe(123);
    expect('id' in dataWithoutId).toBe(false);
    expect(dataWithoutId).toEqual({ name: 'Test', for_formats: ['format1'] });
  });
});
