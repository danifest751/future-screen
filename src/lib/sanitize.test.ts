import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeMarkdown } from './sanitize';

describe('sanitizeHtml', () => {
  it('возвращает пустую строку для null/undefined', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
    expect(sanitizeHtml('')).toBe('');
  });

  it('удаляет script теги', () => {
    const input = '<script>alert("XSS")</script><p>Безопасный текст</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('<p>Безопасный текст</p>');
  });

  it('удаляет опасные атрибуты событий', () => {
    const input = '<img src="x" onerror="alert(1)" onload="hack()">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('onload');
  });

  it('удаляет javascript: URL', () => {
    const input = '<a href="javascript:alert(1)">Ссылка</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('javascript:');
  });

  it('сохраняет безопасный HTML', () => {
    const input = '<p><strong>Жирный</strong> и <em>курсив</em></p>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<strong>');
    expect(result).toContain('<em>');
  });
});

describe('sanitizeMarkdown', () => {
  it('возвращает пустую строку для null/undefined', () => {
    expect(sanitizeMarkdown(null)).toBe('');
    expect(sanitizeMarkdown(undefined)).toBe('');
    expect(sanitizeMarkdown('')).toBe('');
  });

  it('удаляет опасный HTML из Markdown', () => {
    const input = '# Заголовок\n\n<script>alert("XSS")</script>\n\nОбычный текст';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('<script>');
  });

  it('сохраняет разрешенные теги', () => {
    const input = '<h1>Заголовок</h1><p>Текст</p><a href="https://example.com">Ссылка</a>';
    const result = sanitizeMarkdown(input);
    expect(result).toContain('<h1>');
    expect(result).toContain('<p>');
    expect(result).toContain('<a href="https://example.com">');
  });

  it('удаляет опасные атрибуты', () => {
    const input = '<img src="x" onerror="alert(1)">';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('onerror');
  });
});
