import React from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import AdminPackagesPage from './AdminPackagesPage';

vi.mock('../../components/admin/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../hooks/usePackages', () => ({
  usePackages: () => ({
    packages: [],
    upsert: vi.fn(async () => true),
    remove: vi.fn(async () => true),
    resetToDefault: vi.fn(async () => undefined),
  }),
}));

vi.mock('../../hooks/useUnsavedChangesGuard', () => ({
  useUnsavedChangesGuard: () => undefined,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AdminPackagesPage draft persistence', () => {
  it('restores saved draft values on mount', async () => {
    const draft = {
      id: '202',
      name: 'Черновик пакета',
      forFormatsText: 'Форум\nКонцерт',
      includesText: 'Экран 8x4\nМонтаж',
      optionsText: 'Режиссер эфира',
      priceHint: 'от 250 000 ₽',
    };

    window.localStorage.setItem('admin-package-draft', JSON.stringify(draft));

    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = createRoot(el);

    root.render(<AdminPackagesPage />);
    await new Promise((r) => setTimeout(r, 0));

    const inputs = Array.from(el.querySelectorAll('input, textarea')) as Array<HTMLInputElement | HTMLTextAreaElement>;
    const values = inputs.map((i) => i.value);

    expect(values).toContain('202');
    expect(values).toContain('Черновик пакета');
    expect(values).toContain('Форум\nКонцерт');
    expect(values).toContain('Экран 8x4\nМонтаж');
    expect(values).toContain('Режиссер эфира');
    expect(values).toContain('от 250 000 ₽');

    root.unmount();
    el.remove();
    window.localStorage.removeItem('admin-package-draft');
  });
});
