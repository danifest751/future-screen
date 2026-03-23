// Тесты для функций маппинга adminData
// Используем глобальные describe/it из vitest.config.ts

import { mapCategoryFromDB, mapCategoryToDB, mapContactsToDB, mapPackageFromDB, mapPackageToDB, sanitizeServices } from './adminData';

describe('adminData service mappings', () => {
  it('maps packages to and from database shape', () => {
    const pkgToDb = {
      id: '101',
      name: 'Лайт',
      forFormats: ['Выставка', 'Презентация'],
      includes: ['Экран', 'Монтаж'],
      options: ['Доставка'],
      priceHint: 'от 120 000 ₽',
    };

    const pkgFromDb = {
      id: 101,
      name: 'Лайт',
      for_formats: ['Выставка', 'Презентация'],
      includes: ['Экран', 'Монтаж'],
      options: ['Доставка'],
      price_hint: 'от 120 000 ₽',
    };

    expect(mapPackageToDB(pkgToDb)).toEqual(pkgFromDb);
    expect(mapPackageFromDB(pkgFromDb)).toEqual({
      id: 101,
      name: 'Лайт',
      forFormats: ['Выставка', 'Презентация'],
      includes: ['Экран', 'Монтаж'],
      options: ['Доставка'],
      priceHint: 'от 120 000 ₽',
    });
  });

  it('maps categories to and from database shape', () => {
    const categoryToDb = {
      id: '7',
      title: 'Свет',
      shortDescription: 'Световое оборудование',
      bullets: ['Сцена', 'Монтаж'],
      pagePath: '/rent/light',
    };

    const categoryFromDb = {
      id: 7,
      title: 'Свет',
      short_description: 'Световое оборудование',
      bullets: ['Сцена', 'Монтаж'],
      page_path: '/rent/light',
    };

    expect(mapCategoryToDB(categoryToDb)).toEqual(categoryFromDb);
    expect(mapCategoryFromDB(categoryFromDb)).toEqual({
      id: 7,
      title: 'Свет',
      shortDescription: 'Световое оборудование',
      bullets: ['Сцена', 'Монтаж'],
      pagePath: '/rent/light',
    });
  });

  it('sanitizes services to allowed case values', () => {
    expect(sanitizeServices(['LED', ' support ', 'invalid', 'video'])).toEqual(['led', 'support', 'video']);
  });

  it('maps contacts to database shape', () => {
    expect(mapContactsToDB({
      id: 3,
      phones: ['+7 (900) 000-00-00'],
      emails: ['test@example.com'],
      address: 'Екатеринбург',
      workingHours: '10:00–20:00',
    })).toEqual({
      id: 3,
      phones: ['+7 (900) 000-00-00'],
      emails: ['test@example.com'],
      address: 'Екатеринбург',
      working_hours: '10:00–20:00',
    });
  });
});
