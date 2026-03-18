import React from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import AdminCasesPage from './AdminCasesPage';

vi.mock('../../components/admin/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

let resolveAddCase: ((value: boolean) => void) | null = null;

const addCaseMock = vi.fn(
  () =>
    new Promise<boolean>((resolve) => {
      resolveAddCase = resolve;
    })
);
const updateCaseMock = vi.fn(async () => true);
const deleteCaseMock = vi.fn(async () => true);
const resetToDefaultMock = vi.fn(async () => undefined);

vi.mock('../../hooks/useCases', () => ({
  useCases: () => ({
    cases: [
      {
        slug: 'forum-ekb-2024',
        title: 'Форум в Екатеринбурге',
        city: 'Екатеринбург',
        date: '2024',
        format: 'Форум',
        summary: 'Короткое описание проекта',
        metrics: '800 гостей',
        services: ['led', 'sound'],
        images: [],
      },
    ],
    addCase: addCaseMock,
    updateCase: updateCaseMock,
    deleteCase: deleteCaseMock,
    resetToDefault: resetToDefaultMock,
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const setNativeValue = (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  const valueSetter = Object.getOwnPropertyDescriptor(element.__proto__, 'value')?.set;
  valueSetter?.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
};

describe('AdminCasesPage saving lock', () => {
  it('disables destructive actions while saving a case', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = createRoot(el);

    root.render(<AdminCasesPage />);
    await new Promise((r) => setTimeout(r, 0));

    const inputs = Array.from(el.querySelectorAll('input')) as HTMLInputElement[];
    const textareas = Array.from(el.querySelectorAll('textarea')) as HTMLTextAreaElement[];

    setNativeValue(inputs[0], 'new-case');
    setNativeValue(inputs[1], 'Новый кейс');
    setNativeValue(inputs[2], 'Москва');
    setNativeValue(inputs[3], '2026');
    setNativeValue(inputs[4], 'Форум');
    setNativeValue(textareas[0], 'Описание проекта');
    setNativeValue(inputs[5], '100 гостей');
    setNativeValue(inputs[6], 'led, sound');

    await new Promise((r) => setTimeout(r, 0));

    const submitBtn = Array.from(el.querySelectorAll('button')).find((btn) => btn.textContent?.includes('Добавить кейс')) as HTMLButtonElement | undefined;
    expect(submitBtn).toBeDefined();
    submitBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 0));

    expect(el.textContent).toContain('Сохранение...');

    const deleteBtn = Array.from(el.querySelectorAll('button')).find((btn) => btn.textContent?.trim() === '🗑') as HTMLButtonElement | undefined;
    const editBtn = Array.from(el.querySelectorAll('button')).find((btn) => btn.textContent?.trim() === 'Редактировать') as HTMLButtonElement | undefined;
    const resetBtn = Array.from(el.querySelectorAll('button')).find((btn) => btn.textContent?.trim() === 'Сброс к дефолту') as HTMLButtonElement | undefined;
    const searchInput = Array.from(el.querySelectorAll('input')).find((input) => (input as HTMLInputElement).placeholder.includes('slug, названию')) as HTMLInputElement | undefined;

    expect(deleteBtn?.disabled).toBe(true);
    expect(editBtn?.disabled).toBe(true);
    expect(resetBtn?.disabled).toBe(true);
    expect(searchInput?.disabled).toBe(true);

    resolveAddCase?.(true);
    await new Promise((r) => setTimeout(r, 0));

    root.unmount();
    el.remove();
  });
});
