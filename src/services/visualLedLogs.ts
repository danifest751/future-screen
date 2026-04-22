import { supabase } from '../lib/supabase';
import type {
  VisualLedSessionDetail,
  VisualLedSessionListResult,
} from '../types/visualLedLogs';

async function getAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.access_token || null;
}

async function authedFetch(path: string): Promise<Response> {
  const token = await getAccessToken();
  if (!token) throw new Error('Unauthorized');
  const response = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response;
}

export async function loadVisualLedSessions(params: {
  limit?: number;
  offset?: number;
}): Promise<VisualLedSessionListResult> {
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  const response = await authedFetch(
    `/api/visual-led-logs/sessions?limit=${limit}&offset=${offset}`,
  );
  const payload = await response.json();
  return {
    items: payload.items || [],
    total: payload.total ?? 0,
    limit: payload.limit ?? limit,
    offset: payload.offset ?? offset,
  };
}

export async function loadVisualLedSession(sessionId: string): Promise<VisualLedSessionDetail> {
  const response = await authedFetch(
    `/api/visual-led-logs/session?id=${encodeURIComponent(sessionId)}`,
  );
  const payload = await response.json();
  return {
    session: payload.session,
    events: payload.events || [],
    assets: payload.assets || [],
  };
}
