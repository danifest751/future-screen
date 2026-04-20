import { describe, it, expect } from 'vitest';
import { parseRole, resolveTrustedRole } from './rbac.js';

describe('telegramWebhook/rbac', () => {
  describe('parseRole', () => {
    it('accepts admin, editor, viewer regardless of case or whitespace', () => {
      expect(parseRole('admin')).toBe('admin');
      expect(parseRole('  EDITOR ')).toBe('editor');
      expect(parseRole('Viewer')).toBe('viewer');
    });

    it('returns null for unknown strings and non-string values', () => {
      expect(parseRole('owner')).toBeNull();
      expect(parseRole('')).toBeNull();
      expect(parseRole(null)).toBeNull();
      expect(parseRole(undefined)).toBeNull();
      expect(parseRole(42)).toBeNull();
      expect(parseRole({ role: 'admin' })).toBeNull();
    });
  });

  describe('resolveTrustedRole', () => {
    it('defaults to viewer when app_metadata is null or empty', () => {
      expect(resolveTrustedRole(null)).toBe('viewer');
      expect(resolveTrustedRole({})).toBe('viewer');
    });

    it('reads role from top-level role field', () => {
      expect(resolveTrustedRole({ role: 'admin' })).toBe('admin');
      expect(resolveTrustedRole({ role: 'editor' })).toBe('editor');
    });

    it('reads role from user_role field', () => {
      expect(resolveTrustedRole({ user_role: 'admin' })).toBe('admin');
    });

    it('reads role from claims.role field', () => {
      expect(resolveTrustedRole({ claims: { role: 'editor' } })).toBe('editor');
    });

    it('prefers admin over editor when multiple fields are present', () => {
      expect(resolveTrustedRole({ role: 'editor', user_role: 'admin' })).toBe('admin');
      expect(resolveTrustedRole({ role: 'viewer', claims: { role: 'admin' } })).toBe('admin');
    });

    it('falls back to viewer when only unknown values are present', () => {
      expect(resolveTrustedRole({ role: 'owner' })).toBe('viewer');
      expect(resolveTrustedRole({ role: 42 })).toBe('viewer');
    });
  });
});
