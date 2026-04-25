import { describe, expect, it } from 'vitest';
import { isSafeHref, safeHref, SAFE_HREF_FALLBACK } from './safeHref';

describe('safeHref', () => {
  it('пропускает http(s)', () => {
    expect(safeHref('http://example.com')).toBe('http://example.com');
    expect(safeHref('https://example.com/x?y=1')).toBe('https://example.com/x?y=1');
    expect(safeHref('HTTPS://example.com')).toBe('HTTPS://example.com');
  });

  it('пропускает mailto/tel', () => {
    expect(safeHref('mailto:a@b.c')).toBe('mailto:a@b.c');
    expect(safeHref('tel:+79991234567')).toBe('tel:+79991234567');
  });

  it('пропускает относительные и in-page anchors', () => {
    expect(safeHref('/admin/leads')).toBe('/admin/leads');
    expect(safeHref('#section-2')).toBe('#section-2');
    expect(safeHref('//cdn.example.com/img.png')).toBe('//cdn.example.com/img.png');
  });

  it('режет javascript: на fallback', () => {
    expect(safeHref('javascript:alert(1)')).toBe(SAFE_HREF_FALLBACK);
    expect(safeHref('JAVASCRIPT:fetch("/")')).toBe(SAFE_HREF_FALLBACK);
    expect(safeHref('  javascript:alert(1)  ')).toBe(SAFE_HREF_FALLBACK);
  });

  it('режет data: и vbscript:', () => {
    expect(safeHref('data:text/html,<script>alert(1)</script>')).toBe(SAFE_HREF_FALLBACK);
    expect(safeHref('vbscript:msgbox("x")')).toBe(SAFE_HREF_FALLBACK);
  });

  it('режет неизвестные схемы и относительные без / / #', () => {
    expect(safeHref('about:blank')).toBe(SAFE_HREF_FALLBACK);
    expect(safeHref('file:///etc/passwd')).toBe(SAFE_HREF_FALLBACK);
    expect(safeHref('admin/leads')).toBe(SAFE_HREF_FALLBACK);
    expect(safeHref('weird-string')).toBe(SAFE_HREF_FALLBACK);
  });

  it('пустая строка/null/undefined → fallback', () => {
    expect(safeHref('')).toBe(SAFE_HREF_FALLBACK);
    expect(safeHref('   ')).toBe(SAFE_HREF_FALLBACK);
    expect(safeHref(null)).toBe(SAFE_HREF_FALLBACK);
    expect(safeHref(undefined)).toBe(SAFE_HREF_FALLBACK);
  });

  it('non-string значение → fallback', () => {
    expect(safeHref(42)).toBe(SAFE_HREF_FALLBACK);
    expect(safeHref({ href: '/x' })).toBe(SAFE_HREF_FALLBACK);
  });
});

describe('isSafeHref', () => {
  it('предикат: true для разрешённых, false иначе', () => {
    expect(isSafeHref('https://x')).toBe(true);
    expect(isSafeHref('javascript:alert(1)')).toBe(false);
    expect(isSafeHref(null)).toBe(false);
  });
});
