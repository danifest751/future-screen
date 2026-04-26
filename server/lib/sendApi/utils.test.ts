import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  getRequestIdFromBody,
  normalizeRequestId,
  toCleanString,
  toErrorMessage,
  toRecord,
} from './utils.js';

describe('sendApi/utils', () => {
  describe('escapeHtml', () => {
    it('escapes &, <, > in that order', () => {
      expect(escapeHtml('a & b < c > d')).toBe('a &amp; b &lt; c &gt; d');
    });

    it('escapes an injection payload so tags become inert', () => {
      expect(escapeHtml('<script>alert(1)</script>')).toBe(
        '&lt;script&gt;alert(1)&lt;/script&gt;',
      );
    });

    it('handles missing input without throwing', () => {
      expect(escapeHtml()).toBe('');
      expect(escapeHtml(undefined as unknown as string)).toBe('');
    });

    it('coerces non-string input to string before escaping', () => {
      expect(escapeHtml(42 as unknown as string)).toBe('42');
    });

    it('escapes quote characters so attribute contexts stay safe', () => {
      expect(escapeHtml('say "hi" and \'bye\'')).toBe(
        'say &quot;hi&quot; and &#39;bye&#39;',
      );
    });
  });

  describe('toCleanString', () => {
    it('trims surrounding whitespace', () => {
      expect(toCleanString('  hello  ')).toBe('hello');
    });

    it('returns empty string for null/undefined', () => {
      expect(toCleanString(null)).toBe('');
      expect(toCleanString(undefined)).toBe('');
    });

    it('coerces numbers and booleans', () => {
      expect(toCleanString(123)).toBe('123');
      expect(toCleanString(false)).toBe('false');
    });
  });

  describe('toErrorMessage', () => {
    it('returns the russian fallback when the error is empty', () => {
      expect(toErrorMessage(undefined)).toBe('Неизвестная ошибка');
      expect(toErrorMessage(null)).toBe('Неизвестная ошибка');
      expect(toErrorMessage('')).toBe('Неизвестная ошибка');
    });

    it('returns the string itself when thrown value is a string', () => {
      expect(toErrorMessage('boom')).toBe('boom');
    });

    it('reads .message from Error instances', () => {
      expect(toErrorMessage(new Error('smtp failed'))).toBe('smtp failed');
    });

    it('falls back to russian text when message is undefined', () => {
      expect(toErrorMessage({ message: undefined })).toBe('Неизвестная ошибка');
    });

    it('stringifies unknown shapes', () => {
      expect(toErrorMessage(42)).toBe('42');
    });
  });

  describe('normalizeRequestId', () => {
    it('strips disallowed characters', () => {
      expect(normalizeRequestId('req-123!@#abc')).toBe('req-123abc');
    });

    it('keeps allowed charset untouched', () => {
      expect(normalizeRequestId('abc_XYZ-1.2:3')).toBe('abc_XYZ-1.2:3');
    });

    it('caps length at 120', () => {
      const long = 'a'.repeat(500);
      expect(normalizeRequestId(long)).toHaveLength(120);
    });

    it('returns empty string for non-string input', () => {
      expect(normalizeRequestId(null)).toBe('');
      expect(normalizeRequestId(undefined)).toBe('');
    });
  });

  describe('getRequestIdFromBody', () => {
    it('extracts and normalizes requestId from a body object', () => {
      expect(getRequestIdFromBody({ requestId: ' req-42! ' })).toBe('req-42');
    });

    it('returns empty string when body is not an object', () => {
      expect(getRequestIdFromBody(null)).toBe('');
      expect(getRequestIdFromBody('string-body')).toBe('');
      expect(getRequestIdFromBody([])).toBe('');
    });
  });

  describe('toRecord', () => {
    it('returns flat string record, dropping empty values', () => {
      expect(toRecord({ a: 'x', b: '  ', c: 7, d: null })).toEqual({
        a: 'x',
        c: '7',
      });
    });

    it('returns undefined when every entry is empty', () => {
      expect(toRecord({ a: '', b: null, c: undefined })).toBeUndefined();
    });

    it('returns undefined for arrays and non-objects', () => {
      expect(toRecord(['a', 'b'])).toBeUndefined();
      expect(toRecord('str')).toBeUndefined();
      expect(toRecord(null)).toBeUndefined();
    });
  });
});
