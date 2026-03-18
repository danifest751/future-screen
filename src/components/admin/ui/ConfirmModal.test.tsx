import React from 'react';
import { expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import ConfirmModal from './ConfirmModal';

const render = (ui: React.ReactElement) => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  root.render(ui);
  return { el, root };
};

describe('ConfirmModal', () => {
  it('рендерит confirm/cancel и вызывает handlers', async () => {
    let confirmed = false;
    let canceled = false;

    const { el } = render(
      <ConfirmModal
        open
        title="Удалить?"
        description="Эта операция необратима"
        confirmText="Да"
        cancelText="Нет"
        danger
        onCancel={() => {
          canceled = true;
        }}
        onConfirm={() => {
          confirmed = true;
        }}
      />
    );

    // React render may be async in jsdom; дождёмся отрисовки.
    await new Promise((r) => setTimeout(r, 0));

    const buttons = Array.from(el.querySelectorAll('button'));
    // ConfirmModal рендерит ровно 2 кнопки: отмена (первая) и подтверждение (вторая).
    if (buttons.length === 0) {
      // fallback: ищем по document, на случай если корневой контейнер ведёт себя неожиданно
      const docButtons = Array.from(document.querySelectorAll('button'));
      expect(docButtons.length).toBeGreaterThanOrEqual(2);
    }

    expect(buttons.length).toBeGreaterThanOrEqual(2);

    const cancelBtn = buttons[0];
    cancelBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(canceled).toBe(true);

    confirmed = false;
    canceled = false;

    const confirmBtn = buttons[1];
    confirmBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(confirmed).toBe(true);
  });
});
