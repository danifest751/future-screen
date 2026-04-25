import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import FilterPills from './FilterPills';

// Tell React this is a real test environment so act() warnings disappear.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const pills = [
  { value: 'a' as const, label: 'Alpha', count: 3 },
  { value: 'b' as const, label: 'Beta' },
];

const mount = (ui: React.ReactElement) => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => {
    root.render(ui);
  });
  return { el };
};

const buttons = (root: HTMLElement) => Array.from(root.querySelectorAll('button'));

describe('FilterPills', () => {
  it('single-select помечает aria-pressed=true только для активного', () => {
    const { el } = mount(<FilterPills active="a" pills={pills} onChange={() => {}} />);
    const [alpha, beta] = buttons(el);
    expect(alpha.getAttribute('aria-pressed')).toBe('true');
    expect(beta.getAttribute('aria-pressed')).toBe('false');
  });

  it('multi-select помечает все элементы массива', () => {
    const { el } = mount(<FilterPills active={['a', 'b']} pills={pills} onChange={() => {}} />);
    const [alpha, beta] = buttons(el);
    expect(alpha.getAttribute('aria-pressed')).toBe('true');
    expect(beta.getAttribute('aria-pressed')).toBe('true');
  });

  it('active=null — никто не активен', () => {
    const { el } = mount(<FilterPills active={null} pills={pills} onChange={() => {}} />);
    const [alpha, beta] = buttons(el);
    expect(alpha.getAttribute('aria-pressed')).toBe('false');
    expect(beta.getAttribute('aria-pressed')).toBe('false');
  });

  it('клик вызывает onChange со значением пилюли', () => {
    const onChange = vi.fn();
    const { el } = mount(<FilterPills active="a" pills={pills} onChange={onChange} />);
    const [, beta] = buttons(el);
    act(() => {
      beta.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('рендерит count и title', () => {
    const { el } = mount(<FilterPills title="Filters" active={null} pills={pills} onChange={() => {}} />);
    expect(el.textContent).toContain('Filters');
    expect(el.textContent).toContain('Alpha');
    expect(el.textContent).toContain('3');
  });
});
