import { supabase } from './supabase';

export type FormPayload = {
  requestId?: string;
  source: string;
  name: string;
  phone: string;
  email?: string;
  telegram?: string;
  city?: string;
  date?: string;
  format?: string;
  comment?: string;
  extra?: Record<string, string>;
  pagePath?: string;
  referrer?: string;
};

const REQUEST_TIMEOUT_MS = 15000;

const createRequestId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const saveToLeads = async (payload: FormPayload, requestId: string) => {
  try {
    const { error } = await supabase.from('leads').insert({
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
      page_path: payload.pagePath ?? null,
      referrer: payload.referrer ?? null,
      status: 'queued',
      delivery_log: [
        {
          at: new Date().toISOString(),
          step: 'lead_saved',
          status: 'success',
          channel: 'database',
          message: 'Lead saved before delivery start',
        },
      ],
    });

    if (error) {
      console.error('[saveToLeads] error:', error.message);
    }
  } catch (error) {
    console.error('[saveToLeads] error:', error);
  }
};

export const submitForm = async (payload: FormPayload): Promise<{ tg: boolean; email: boolean }> => {
  const requestId = payload.requestId?.trim() || createRequestId();
  const requestPayload: FormPayload = {
    ...payload,
    requestId,
  };

  await saveToLeads(requestPayload, requestId);

  const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
  const apiUrl = rawApiUrl
    ? rawApiUrl.endsWith('/api/send')
      ? rawApiUrl
      : `${rawApiUrl.replace(/\/$/, '')}/api/send`
    : import.meta.env.DEV
      ? 'http://localhost:3001/api/send'
      : '/api/send';

  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });
    } finally {
      window.clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const responseBody = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}${responseBody ? `: ${responseBody}` : ''}`);
    }

    const result = await response.json().catch(() => ({} as Record<string, unknown>));

    const telegram = typeof result.telegram === 'boolean' ? result.telegram : false;
    const email =
      typeof result.email === 'boolean'
        ? result.email
        : typeof result.ok === 'boolean'
          ? result.ok
          : true;

    return {
      tg: telegram,
      email,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn('[submitForm] API request timed out');
      return {
        tg: false,
        email: false,
      };
    }

    console.error('[submitForm] error:', error);
    return {
      tg: false,
      email: false,
    };
  }
};
