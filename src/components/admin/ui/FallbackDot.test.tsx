import React from 'react';
import { createRoot } from 'react-dom/client';
import FallbackDot from './FallbackDot';

const render = (ui: React.ReactElement) => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  root.render(ui);
  return { el, root };
};

describe('FallbackDot', () => {
  it('renders localized tooltip by admin locale', async () => {
    const ru = render(<FallbackDot visible adminLocale="ru" />);
    await new Promise((r) => setTimeout(r, 0));
    const ruSpan = ru.el.querySelector('span[title]');
    expect(ruSpan?.getAttribute('title')).toBe('Используется fallback из русской версии');

    const en = render(<FallbackDot visible adminLocale="en" />);
    await new Promise((r) => setTimeout(r, 0));
    const enSpan = en.el.querySelector('span[title]');
    expect(enSpan?.getAttribute('title')).toBe('Using RU fallback');
  });

  it('does not render when hidden', async () => {
    const { el } = render(<FallbackDot visible={false} adminLocale="ru" />);
    await new Promise((r) => setTimeout(r, 0));
    expect(el.innerHTML).toBe('');
  });
});

