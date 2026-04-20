import { describe, it, expect } from 'vitest';
import {
  formatEmailFailureAlertMessage,
  formatTelegramMessage,
  localizeSourceToRu,
  normalizePath,
} from './formatters.js';
import type { EmailPayload } from './types.js';

const basePayload: EmailPayload = {
  source: 'Сайт',
  name: 'Иван',
  phone: '+7 999 000 00 00',
};

describe('sendApi/formatters', () => {
  describe('normalizePath', () => {
    it('returns pathname from absolute URL', () => {
      expect(normalizePath('https://future-screen.ru/prices')).toBe('/prices');
    });

    it('returns "/" for a root URL with no path', () => {
      expect(normalizePath('https://future-screen.ru')).toBe('/');
    });

    it('returns the raw value when it is already a path', () => {
      expect(normalizePath('/rent/video')).toBe('/rent/video');
    });

    it('returns empty string for non-path non-URL input', () => {
      expect(normalizePath('rent/video')).toBe('');
      expect(normalizePath('')).toBe('');
    });
  });

  describe('localizeSourceToRu', () => {
    it('returns "Сайт" for empty input', () => {
      expect(localizeSourceToRu('')).toBe('Сайт');
      expect(localizeSourceToRu('   ')).toBe('Сайт');
    });

    it('maps english "Quote form" prefix to "Форма заявки"', () => {
      expect(localizeSourceToRu('Quote form')).toBe('Форма заявки');
      expect(localizeSourceToRu('quote form - custom')).toBe('Форма заявки');
      expect(localizeSourceToRu('Form quote stuff')).toBe('Форма заявки');
    });

    it('maps "Site" / "Future Screen form" prefixes to "Сайт"', () => {
      expect(localizeSourceToRu('Site')).toBe('Сайт');
      expect(localizeSourceToRu('Future Screen form')).toBe('Сайт');
    });

    it('keeps unknown base strings as-is', () => {
      expect(localizeSourceToRu('Custom Source')).toBe('Custom Source');
    });

    it('appends a known russian page label when a path suffix is present', () => {
      expect(localizeSourceToRu('Quote form (/prices)')).toBe('Форма заявки — Цены');
      expect(localizeSourceToRu('Site (/rent/video)')).toBe('Сайт — Аренда: Видеоэкраны');
    });

    it('falls back to "Страница {path}" for unknown paths', () => {
      expect(localizeSourceToRu('Site (/unknown)')).toBe('Сайт — Страница /unknown');
    });
  });

  describe('formatTelegramMessage', () => {
    it('starts with a header and source line', () => {
      const message = formatTelegramMessage(basePayload);
      expect(message.startsWith('<b>🔥 Новая заявка</b>\n<b>Источник:</b> Сайт\n')).toBe(true);
    });

    it('escapes every user-supplied field', () => {
      const message = formatTelegramMessage({
        ...basePayload,
        name: 'Иван <b>XSS</b>',
        comment: '<script>alert(1)</script>',
        extra: { '<k>': '<v>' },
      });
      expect(message).toContain('&lt;b&gt;XSS&lt;/b&gt;');
      expect(message).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(message).toContain('&lt;k&gt;:</b> &lt;v&gt;');
      expect(message).not.toContain('<script>alert(1)</script>');
    });

    it('omits empty optional fields', () => {
      const message = formatTelegramMessage(basePayload);
      expect(message).not.toContain('<b>Email:</b>');
      expect(message).not.toContain('<b>Город:</b>');
      expect(message).not.toContain('<b>Комментарий:</b>');
    });

    it('renders the "Параметры расчета" block only when extras are non-empty', () => {
      expect(formatTelegramMessage(basePayload)).not.toContain('Параметры расчета');
      expect(
        formatTelegramMessage({ ...basePayload, extra: { '   ': '   ' } }),
      ).not.toContain('Параметры расчета');

      const message = formatTelegramMessage({
        ...basePayload,
        extra: { Площадка: 'Крокус', Empty: '   ' },
      });
      expect(message).toContain('<b>Параметры расчета:</b>');
      expect(message).toContain('• <b>Площадка:</b> Крокус');
      expect(message).not.toContain('Empty');
    });
  });

  describe('formatEmailFailureAlertMessage', () => {
    it('renders all fields with escaping and includes request id in a <code> tag', () => {
      const message = formatEmailFailureAlertMessage({
        requestId: 'req-<1>',
        source: 'Site (/prices)',
        name: 'Иван <x>',
        phone: '+7 999',
        email: 'a@b.c',
        errorMessage: 'SMTP <down>',
      });

      expect(message).toContain('<code>req-&lt;1&gt;</code>');
      expect(message).toContain('<b>Источник:</b> Сайт — Цены');
      expect(message).toContain('<b>Имя:</b> Иван &lt;x&gt;');
      expect(message).toContain('<b>Email:</b> a@b.c');
      expect(message).toContain('<b>Причина:</b> SMTP &lt;down&gt;');
    });

    it('uses em-dash placeholders when optional fields are empty', () => {
      const message = formatEmailFailureAlertMessage({
        requestId: 'req-1',
        errorMessage: '',
      });
      expect(message).toContain('<b>Имя:</b> —');
      expect(message).toContain('<b>Телефон:</b> —');
      expect(message).not.toContain('<b>Email:</b>');
      expect(message).toContain('<b>Причина:</b> Неизвестная ошибка');
    });
  });
});
