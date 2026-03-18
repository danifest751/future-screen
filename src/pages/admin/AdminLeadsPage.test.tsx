import React from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import AdminLeadsPage from './AdminLeadsPage';

vi.mock('../../components/admin/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const clearLeadsMock = vi.fn(async () => true);

vi.mock('../../hooks/useLeads', () => ({
  useLeads: () => ({
    leads: [
      {
        id: 1,
        timestamp: '2026-03-18T10:00:00.000Z',
        source: 'form-home',
        name: 'Иван Петров',
        phone: '+79990000001',
        email: 'ivan@example.com',
        telegram: '@ivan',
        city: 'Москва',
        date: '25 мая',
        format: 'Форум',
        comment: 'Нужен экран',
        pagePath: '/calculator',
        extra: {},
      },
      {
        id: 2,
        timestamp: '2026-03-18T11:00:00.000Z',
        source: 'form-calc',
        name: 'Анна Смирнова',
        phone: '+79990000002',
        city: 'Казань',
        comment: 'Срочно',
        pagePath: '/consult',
        extra: {},
      },
    ],
    loading: false,
    error: null,
    clearLeads: clearLeadsMock,
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

describe('AdminLeadsPage filters', () => {
  it('shows filtered result counts and resets filters', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = createRoot(el);

    root.render(<AdminLeadsPage />);
    await new Promise((r) => setTimeout(r, 0));

    expect(el.textContent).toContain('Показано: 2 из 2');

    const searchInput = Array.from(el.querySelectorAll('input')).find((input) => (input as HTMLInputElement).placeholder.includes('Имя, телефон, email, город')) as HTMLInputElement | undefined;
    expect(searchInput).toBeDefined();

    const sourceSelect = Array.from(el.querySelectorAll('select')).find((select) => (select as HTMLSelectElement).value === 'all') as HTMLSelectElement | undefined;
    expect(sourceSelect).toBeDefined();

    if (searchInput) {
      searchInput.value = 'Анна';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (sourceSelect) {
      sourceSelect.value = 'form-calc';
      sourceSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    await new Promise((r) => setTimeout(r, 350));

    expect(el.textContent).toContain('Показано: 1 из 2');
    expect(el.textContent).toContain('Источник: form-calc');

    const resetBtn = Array.from(el.querySelectorAll('button')).find((btn) => btn.textContent?.trim() === 'Сбросить фильтры');
    expect(resetBtn).toBeDefined();
    resetBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 0));
    expect(el.textContent).toContain('Показано: 2 из 2');

    root.unmount();
    el.remove();
  });
});
