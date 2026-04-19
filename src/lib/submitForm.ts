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

// PR #5a (C5): direct INSERT into `leads` from the browser has been
// removed. The server-side handler in api/send.ts is now the single
// writer (service role), so we can drop the anonymous INSERT policy on
// the leads table in PR #5b without breaking form submission.

export const submitForm = async (payload: FormPayload): Promise<{ tg: boolean; email: boolean }> => {
  const requestId = payload.requestId?.trim() || createRequestId();
  const requestPayload: FormPayload = {
    ...payload,
    requestId,
  };

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
