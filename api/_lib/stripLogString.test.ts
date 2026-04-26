import { describe, expect, it } from 'vitest';
import { stripLogString } from './stripLogString';

describe('stripLogString', () => {
  it('сворачивает \\r\\n / \\n в одиночный пробел', () => {
    expect(stripLogString('first\nsecond')).toBe('first second');
    expect(stripLogString('first\r\nsecond')).toBe('first second');
    expect(stripLogString('multi\n\n\nline')).toBe('multi line');
  });

  it('режет C0 контрольные символы кроме TAB', () => {
    // \x07 = BEL, \x1b = ESC. TAB \x09 должен остаться.
    expect(stripLogString('a\x07b\x1bc\td')).toBe('abc\td');
  });

  it('обрезает по max после очистки', () => {
    const long = 'x'.repeat(1000);
    expect(stripLogString(long, 10)).toBe('xxxxxxxxxx');
    expect(stripLogString('a\n\n\n' + 'b'.repeat(100), 5)).toBe('a bbb');
  });

  it('закрывает log injection (фальшивая строка лога после \\n)', () => {
    const malicious =
      'normal\n[2026-04-27 12:00] [FAKE] admin granted access';
    const cleaned = stripLogString(malicious);
    expect(cleaned).not.toContain('\n');
    expect(cleaned).toBe(
      'normal [2026-04-27 12:00] [FAKE] admin granted access',
    );
  });

  it('пустая строка остаётся пустой', () => {
    expect(stripLogString('')).toBe('');
  });
});
