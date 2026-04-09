import { getAdminCasesRedesignedContent } from './adminCasesRedesigned';

describe('adminCasesRedesigned content', () => {
  it('returns locale-specific format options', () => {
    const ru = getAdminCasesRedesignedContent('ru');
    const en = getAdminCasesRedesignedContent('en');

    expect(ru.formatOptions[0]).not.toBe(en.formatOptions[0]);
    expect(ru.formatOptions).toContain('Другое');
    expect(en.formatOptions).toContain('Other');
  });
});

