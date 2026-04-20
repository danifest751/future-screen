import type { VercelRequest } from '@vercel/node';
import { getSupabaseClient } from './supabaseClient.js';
import type { UserRole } from './types.js';

export const parseRole = (value: unknown): UserRole | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'admin' || normalized === 'editor' || normalized === 'viewer') {
    return normalized;
  }
  return null;
};

export const resolveTrustedRole = (appMetadata: unknown): UserRole => {
  const roleCandidates: unknown[] = [
    (appMetadata as { role?: unknown } | null)?.role,
    (appMetadata as { user_role?: unknown } | null)?.user_role,
    (appMetadata as { claims?: { role?: unknown } } | null)?.claims?.role,
  ];

  if (roleCandidates.some((candidate) => parseRole(candidate) === 'admin')) return 'admin';
  if (roleCandidates.some((candidate) => parseRole(candidate) === 'editor')) return 'editor';
  return 'viewer';
};

export const ensureAdmin = async (req: VercelRequest): Promise<void> => {
  const auth = String(req.headers.authorization || '');
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error('Unauthorized: missing bearer token');
  const token = match[1];
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error('Unauthorized: invalid user token');
  // Trusted RBAC source: app_metadata only. user_metadata is user-writable.
  const role = resolveTrustedRole(data.user.app_metadata);
  if (role !== 'admin') throw new Error('Forbidden: admin role required');
};
