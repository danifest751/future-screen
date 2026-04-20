import type { SupabaseClient } from '@supabase/supabase-js';
import type { DeliveryLogEntry, EmailPayload, SubmissionBody } from './types.js';

export const buildLogEntry = (entry: Omit<DeliveryLogEntry, 'at'>): DeliveryLogEntry => ({
  at: new Date().toISOString(),
  ...entry,
});

export const deriveLeadStatus = (body: SubmissionBody | undefined, statusCode: number): string => {
  if (!body) return statusCode >= 400 ? 'failed' : 'processing';
  if (statusCode >= 500) return 'failed';
  if (body.email && body.telegram) return 'delivered';
  if (body.email || body.telegram || body.clientEmail) return 'partial';
  if (body.error || statusCode >= 400) return 'failed';
  return 'processing';
};

export const loadExistingLeadLog = async (
  supabase: SupabaseClient,
  requestId: string,
): Promise<DeliveryLogEntry[]> => {
  if (!requestId) return [];

  const { data, error } = await supabase
    .from('leads')
    .select('delivery_log')
    .eq('request_id', requestId)
    .maybeSingle();

  if (error) {
    console.warn(`[LeadTracking][${requestId}] failed to load log: ${error.message}`);
    return [];
  }

  return Array.isArray(data?.delivery_log) ? (data.delivery_log as DeliveryLogEntry[]) : [];
};

export const persistLeadState = async ({
  supabase,
  requestId,
  status,
  deliveryLog,
  pagePath,
  referrer,
}: {
  supabase: SupabaseClient;
  requestId: string;
  status: string;
  deliveryLog: DeliveryLogEntry[];
  pagePath?: string;
  referrer?: string;
}): Promise<void> => {
  if (!requestId) return;

  const payload: Record<string, unknown> = {
    request_id: requestId,
    status,
    delivery_log: deliveryLog,
  };

  if (pagePath) payload.page_path = pagePath;
  if (referrer) payload.referrer = referrer;

  const { error } = await supabase.from('leads').update(payload).eq('request_id', requestId);

  if (error) {
    console.warn(`[LeadTracking][${requestId}] failed to persist: ${error.message}`);
  }
};

// PR #5a (C5): server is now the single writer for the `leads` table.
// Previously the browser INSERTed a 'queued' row directly via the anon key
// before calling /api/send. That INSERT path has to be closed so we can
// revoke the anonymous INSERT policy in PR #5b — otherwise an attacker
// could POST arbitrary PII rows straight into the table bypassing
// validation and rate-limit.
//
// Called exactly once per request, right after Zod validation succeeds.
//
// Why SELECT-then-INSERT-or-UPDATE instead of .upsert():
// The unique index on request_id is partial —
//   CREATE UNIQUE INDEX ... (request_id) WHERE request_id IS NOT NULL
// (see supabase/migrations/20260406_add_lead_delivery_tracking.sql).
// Postgres will not use a partial unique index for ON CONFLICT unless
// the exact predicate is repeated in the conflict target, and
// supabase-js has no way to express that WHERE clause. The call returns
// 400 "no unique or exclusion constraint matching the ON CONFLICT
// specification". A SELECT + conditional INSERT/UPDATE is idempotent
// against duplicate requestIds (same row) and needs no migration.
export const upsertLeadFromPayload = async ({
  supabase,
  requestId,
  payload,
  pagePath,
  referrer,
  deliveryLog,
}: {
  supabase: SupabaseClient;
  requestId: string;
  payload: EmailPayload;
  pagePath?: string;
  referrer?: string;
  deliveryLog: DeliveryLogEntry[];
}): Promise<void> => {
  if (!requestId) return;

  const { data: existing, error: selectError } = await supabase
    .from('leads')
    .select('id')
    .eq('request_id', requestId)
    .maybeSingle();

  if (selectError) {
    console.warn(`[LeadTracking][${requestId}] lookup failed: ${selectError.message}`);
    return;
  }

  const row = {
    request_id: requestId,
    source: payload.source,
    name: payload.name,
    phone: payload.phone,
    email: payload.email ?? null,
    telegram: payload.telegram ?? null,
    city: payload.city ?? null,
    date: payload.date ?? null,
    format: payload.format ?? null,
    comment: payload.comment ?? null,
    extra: payload.extra ?? {},
    page_path: pagePath ?? null,
    referrer: referrer ?? null,
    status: 'processing',
    delivery_log: deliveryLog,
  };

  const { error } = existing
    ? await supabase.from('leads').update(row).eq('id', existing.id)
    : await supabase.from('leads').insert(row);

  if (error) {
    console.warn(`[LeadTracking][${requestId}] write failed: ${error.message}`);
  }
};
