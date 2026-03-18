import React from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import AdminCategoriesPage from './AdminCategoriesPage';

vi.mock('../../components/admin/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const upsertMock = vi.fn(async () => true);
const removeMock = vi.fn(async () => true);
const resetToDefaultMock = vi.fn(async () => undefined);

vi.mock('../../hooks/useCategories', () => ({
  useCategories: () => ({
    categories: [
      {
        id: 7,
        title: 'Свет',
        shortDescription: 'Световое оборудование и сценический свет',
        bullets: ['LED', 'Пульты', 'Монтаж'],
        pagePath: '/rent/light',
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

describe('AdminCategoriesPage edit mode', () => {
  it('fills form fields when clicking Редактировать', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = createRoot(el);

    root.render(<AdminCategoriesPage />);
    await new Promise((r) => setTimeout(r, 0));

    const editBtn = Array.from(el.querySelectorAll('button')).find((btn) => btn.textContent?.trim() === 'Редактировать');
    expect(editBtn).toBeDefined();
    editBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 0));

    expect(el.textContent).toContain('Редактирование категории');

    const inputs = Array.from(el.querySelectorAll('input, textarea')) as Array<HTMLInputElement | HTMLTextAreaElement>;
    const values = inputs.map((i) => i.value);

    expect(values).toContain('7');
    expect(values).toContain('Свет');
    expect(values).toContain('Световое оборудование и сценический свет');
    expect(values).toContain('LED\nПульты\nМонтаж');
    expect(values).toContain('/rent/light');

    root.unmount();
    el.remove();
  });
});
