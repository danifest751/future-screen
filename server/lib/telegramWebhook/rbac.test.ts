import { describe, expect, it, vi } from 'vitest';

vi.mock('./supabaseClient.js', () => ({
  getSupabaseClient: vi.fn(),
}));

import { parseRole, resolveTrustedRole, ensureAdmin } from './rbac.js';
import { getSupabaseClient } from './supabaseClient.js';

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

  describe('ensureAdmin', () => {
    const makeReq = (authorization?: string) =>
      ({ headers: authorization ? { authorization } : {} }) as any;

    it('rejects missing bearer token', async () => {
      await expect(ensureAdmin(makeReq())).rejects.toThrow('Unauthorized: missing bearer token');
    });

    it('rejects invalid token when auth.getUser fails', async () => {
      vi.mocked(getSupabaseClient).mockReturnValue({
        auth: {
          getUser: vi.fn(async () => ({ data: { user: null }, error: new Error('bad token') })),
        },
      } as any);

      await expect(ensureAdmin(makeReq('Bearer bad-token'))).rejects.toThrow(
        'Unauthorized: invalid user token',
      );
    });

    it('rejects non-admin users', async () => {
      vi.mocked(getSupabaseClient).mockReturnValue({
        auth: {
          getUser: vi.fn(async () => ({
            data: { user: { app_metadata: { role: 'viewer' } } },
            error: null,
          })),
        },
      } as any);

      await expect(ensureAdmin(makeReq('Bearer viewer-token'))).rejects.toThrow(
        'Forbidden: admin role required',
      );
    });

    it('accepts admin users from trusted app_metadata', async () => {
      vi.mocked(getSupabaseClient).mockReturnValue({
        auth: {
          getUser: vi.fn(async () => ({
            data: { user: { app_metadata: { claims: { role: 'admin' } } } },
            error: null,
          })),
        },
      } as any);

      await expect(ensureAdmin(makeReq('Bearer admin-token'))).resolves.toBeUndefined();
    });
  });
});
