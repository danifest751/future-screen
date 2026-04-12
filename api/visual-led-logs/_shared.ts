import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  'https://future-screen.ru,https://future-screen.vercel.app,http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

let supabaseAdmin: SupabaseClient | null = null;

export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = String(req.headers.origin || '').replace(/\/$/, '');
  const normalizedAllowed = allowedOrigins.map((item) => item.replace(/\/$/, '').toLowerCase());
  const normalizedOrigin = origin.toLowerCase();
  if (origin && !normalizedAllowed.includes(normalizedOrigin)) {
    res.status(403).json({ error: 'Forbidden origin' });
    return false;
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return true;
}

export function handleOptions(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdmin) return supabaseAdmin;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    throw new Error('Supabase env vars are not configured for visual-led log API');
  }
  supabaseAdmin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  return supabaseAdmin;
}

export function toJsonBody<T = Record<string, unknown>>(body: unknown): T {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as T;
    } catch {
      return {} as T;
    }
  }
  return (body ?? {}) as T;
}

export function sanitizeStorageName(fileName: string): string {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'background';
}

export async function ensureAdmin(req: VercelRequest): Promise<User> {
  const auth = String(req.headers.authorization || '');
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new Error('Unauthorized: missing bearer token');
  }
  const token = match[1];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error('Unauthorized: invalid user token');
  }
  const role = String(data.user.user_metadata?.role || 'viewer');
  if (role !== 'admin') {
    throw new Error('Forbidden: admin role required');
  }
  return data.user;
}
