import React from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import AdminContactsPage from './AdminContactsPage';

vi.mock('../../components/admin/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../hooks/useContacts', () => ({
  useContacts: () => ({
    contacts: {
      phones: ['+79990000000'],
      emails: ['server@example.com'],
      address: 'Серверный адрес',
      workingHours: '09:00-18:00',
    },
    update: vi.fn(async () => true),
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

describe('AdminContactsPage draft persistence', () => {
  it('keeps restored draft instead of overwriting it with contacts sync', async () => {
    const draft = {
      phonesText: '+79991112233\n+79994445566',
      emailsText: 'draft@example.com\nhello@example.com',
      address: 'Черновой адрес',
      workingHours: '10:00-20:00',
    };

    window.localStorage.setItem('admin-contacts-draft', JSON.stringify(draft));

    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = createRoot(el);

    root.render(<AdminContactsPage />);
    await new Promise((r) => setTimeout(r, 0));

    const inputs = Array.from(el.querySelectorAll('input, textarea')) as Array<HTMLInputElement | HTMLTextAreaElement>;
    const values = inputs.map((i) => i.value);

    expect(values).toContain('+79991112233\n+79994445566');
    expect(values).toContain('draft@example.com\nhello@example.com');
    expect(values).toContain('Черновой адрес');
    expect(values).toContain('10:00-20:00');
    expect(values).not.toContain('Серверный адрес');

    root.unmount();
    el.remove();
    window.localStorage.removeItem('admin-contacts-draft');
  });
});
