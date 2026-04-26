import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: vi.fn(async () => undefined) })),
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({})),
}));

vi.mock('./_lib/rateLimit.js', () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock('../server/lib/emailCore.js', () => ({
  processEmailSubmission: vi.fn(),
}));

vi.mock('../server/lib/sendApi/leadTracking.js', () => ({
  buildLogEntry: vi.fn((entry) => ({ ...entry, at: '2026-04-27T00:00:00.000Z' })),
  deriveLeadStatus: vi.fn((body, status) => {
    if (status >= 400) return 'failed';
    if (body?.email || body?.telegram) return 'delivered';
    return 'partial';
  }),
  loadExistingLeadLog: vi.fn(async () => []),
  persistLeadState: vi.fn(async () => undefined),
  upsertLeadFromPayload: vi.fn(async () => undefined),
}));

import { checkRateLimit } from './_lib/rateLimit.js';
import { processEmailSubmission } from '../server/lib/emailCore.js';
import handler from './send.js';

interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  setHeader: (k: string, v: string) => MockResponse;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
  end: (payload?: unknown) => MockResponse;
}

const makeRes = (): MockResponse => {
  const headers: Record<string, string> = {};
  const res: MockResponse = {
    statusCode: 200,
    headers,
    body: null,
    setHeader(k, v) {
      headers[k] = v;
      return res;
    },
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(payload) {
      res.body = payload;
      return res;
    },
    end(payload) {
      res.body = payload ?? null;
      return res;
    },
  };
  return res;
};

const makeReq = (overrides: Partial<Record<string, unknown>> = {}): VercelRequest => {
  const base = {
    method: 'POST',
    headers: { origin: 'https://future-screen.ru' },
    body: {
      name: 'Иван Тестов',
      phone: '+71234567890',
      email: 'test@example.com',
      requestId: 'req-test-1',
    },
  };
  return { ...base, ...overrides } as unknown as VercelRequest;
};

const ALLOWED_OK = {
  allowed: true,
  limit: 10,
  remaining: 9,
  reset: Date.now() + 60_000,
};

const HAPPY_PATH_RESULT = {
  status: 200,
  body: { ok: true, requestId: 'req-test-1', email: true, telegram: true, clientEmail: true },
};

describe('api/send handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role';
    process.env.ALLOWED_ORIGINS = 'https://future-screen.ru,https://future-screen.vercel.app';
    vi.mocked(checkRateLimit).mockResolvedValue(ALLOWED_OK);
    vi.mocked(processEmailSubmission).mockResolvedValue(HAPPY_PATH_RESULT);
  });

  describe('CORS', () => {
    it('rejects POST without an Origin header (non-browser caller)', async () => {
      const req = makeReq({ headers: {} });
      const res = makeRes();
      await handler(req, res as unknown as VercelResponse);
      expect(res.statusCode).toBe(403);
      expect(res.body).toEqual({ error: 'Forbidden origin' });
    });

    it('rejects POST from an origin not on the allow-list', async () => {
      const req = makeReq({ headers: { origin: 'https://attacker.example' } });
      const res = makeRes();
      await handler(req, res as unknown as VercelResponse);
      expect(res.statusCode).toBe(403);
    });

    it('responds 200 to OPTIONS preflight from an allowed origin', async () => {
      const req = makeReq({ method: 'OPTIONS' });
      const res = makeRes();
      await handler(req, res as unknown as VercelResponse);
      expect(res.statusCode).toBe(200);
      expect(res.headers['Access-Control-Allow-Origin']).toBe('https://future-screen.ru');
      expect(res.headers['Access-Control-Allow-Methods']).toContain('POST');
    });

    it('normalises origin (trailing slash and case) before allow-list check', async () => {
      const req = makeReq({ headers: { origin: 'HTTPS://Future-Screen.RU/' } });
      const res = makeRes();
      await handler(req, res as unknown as VercelResponse);
      // Accepted → not 403; downstream mocks return 200.
      expect(res.statusCode).toBe(200);
    });
  });

  describe('method handling', () => {
    it('rejects GET with 405', async () => {
      const req = makeReq({ method: 'GET' });
      const res = makeRes();
      await handler(req, res as unknown as VercelResponse);
      expect(res.statusCode).toBe(405);
    });
  });

  describe('rate limiting', () => {
    it('returns 429 with Retry-After when checkRateLimit denies', async () => {
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        allowed: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 30_000,
      });
      const req = makeReq();
      const res = makeRes();
      await handler(req, res as unknown as VercelResponse);
      expect(res.statusCode).toBe(429);
      expect(res.body).toMatchObject({ ok: false, error: 'Too many requests' });
      expect(res.headers['Retry-After']).toBeDefined();
      expect(Number(res.headers['Retry-After'])).toBeGreaterThanOrEqual(1);
    });

    it('does not call processEmailSubmission when rate-limited', async () => {
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        allowed: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 30_000,
      });
      const req = makeReq();
      const res = makeRes();
      await handler(req, res as unknown as VercelResponse);
      expect(processEmailSubmission).not.toHaveBeenCalled();
    });
  });

  describe('Zod validation', () => {
    it('returns 400 when name is missing', async () => {
      const req = makeReq({
        body: { phone: '+71234567890', requestId: 'r1' },
      });
      const res = makeRes();
      await handler(req, res as unknown as VercelResponse);
      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({ ok: false, error: 'Validation failed' });
    });

    it('returns 400 when phone is too short', async () => {
      const req = makeReq({
        body: { name: 'Test', phone: '123', requestId: 'r1' },
      });
      const res = makeRes();
      await handler(req, res as unknown as VercelResponse);
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when email is malformed', async () => {
      const req = makeReq({
        body: {
          name: 'Test',
          phone: '+71234567890',
          email: 'not-an-email',
          requestId: 'r1',
        },
      });
      const res = makeRes();
      await handler(req, res as unknown as VercelResponse);
      expect(res.statusCode).toBe(400);
    });

    it('does not call processEmailSubmission on validation failure', async () => {
      const req = makeReq({ body: { name: '' } });
      const res = makeRes();
      await handler(req, res as unknown as VercelResponse);
      expect(processEmailSubmission).not.toHaveBeenCalled();
    });
  });

  describe('happy path', () => {
    it('returns 200 and forwards processEmailSubmission result on a valid request', async () => {
      const req = makeReq();
      const res = makeRes();
      await handler(req, res as unknown as VercelResponse);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(HAPPY_PATH_RESULT.body);
      expect(processEmailSubmission).toHaveBeenCalledTimes(1);
    });

    it('passes the validated body and callback hooks to processEmailSubmission', async () => {
      const req = makeReq();
      const res = makeRes();
      await handler(req, res as unknown as VercelResponse);
      const call = vi.mocked(processEmailSubmission).mock.calls[0][0];
      expect(call.body).toMatchObject({
        name: 'Иван Тестов',
        phone: '+71234567890',
        email: 'test@example.com',
      });
      expect(typeof call.sendTelegram).toBe('function');
      expect(typeof call.sendEmail).toBe('function');
    });
  });

  describe('config errors', () => {
    // getSupabaseAdmin() memoises its SupabaseClient in a module-level
    // var; once it's populated by the happy-path tests above, dropping
    // env vars no longer triggers the misconfiguration branch. Reset
    // modules + dynamically re-import so each test sees a fresh cache.
    const reimportHandler = async () => {
      vi.resetModules();
      const mod = await import('./send.js');
      return mod.default as typeof handler;
    };

    it('returns 500 when SUPABASE_URL is missing', async () => {
      delete process.env.SUPABASE_URL;
      const fresh = await reimportHandler();
      const req = makeReq();
      const res = makeRes();
      await fresh(req, res as unknown as VercelResponse);
      expect(res.statusCode).toBe(500);
      expect(res.body).toMatchObject({
        ok: false,
        error: expect.stringContaining('Server misconfiguration'),
      });
    });

    it('returns 500 when SUPABASE_SERVICE_ROLE_KEY is missing (no anon-key fallback)', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      const fresh = await reimportHandler();
      const req = makeReq();
      const res = makeRes();
      await fresh(req, res as unknown as VercelResponse);
      expect(res.statusCode).toBe(500);
    });
  });
});
