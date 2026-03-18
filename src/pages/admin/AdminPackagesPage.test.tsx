import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import AdminPackagesPage from './AdminPackagesPage';

vi.mock('../../components/admin/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const upsertMock = vi.fn(async () => true);
const removeMock = vi.fn(async () => true);
const resetToDefaultMock = vi.fn(async () => undefined);

vi.mock('../../hooks/usePackages', () => ({
  usePackages: () => ({
    packages: [
      {
        id: 101,
        name: 'Пакет Тест',
        forFormats: ['Концерт', 'Форум'],
        includes: ['Экран 6x3', 'Монтаж'],
        options: ['Режиссер эфира'],
        priceHint: 'от 100 000 ₽',
      },
    ],
    upsert: upsertMock,
    remove: removeMock,
    resetToDefault: resetToDefaultMock,
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

describe('AdminPackagesPage edit mode', () => {
  it('fills form fields when clicking Ред.', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = createRoot(el);

    root.render(<AdminPackagesPage />);
    await new Promise((r) => setTimeout(r, 0));

    const editBtn = Array.from(el.querySelectorAll('button')).find((btn) => btn.textContent?.trim() === 'Ред.');
    expect(editBtn).toBeDefined();
    editBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 0));

    expect(el.textContent).toContain('Редактирование пакета');

    const inputs = Array.from(el.querySelectorAll('input, textarea')) as Array<HTMLInputElement | HTMLTextAreaElement>;
    const values = inputs.map((i) => i.value);

    expect(values).toContain('101');
    expect(values).toContain('Пакет Тест');
    expect(values).toContain('Концерт\nФорум');
    expect(values).toContain('Экран 6x3\nМонтаж');
    expect(values).toContain('Режиссер эфира');
    expect(values).toContain('от 100 000 ₽');

    root.unmount();
    el.remove();
  });
});
