import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, getAllowedOrigins, isOriginAllowed } from './cors';

const ORIGINAL_ENV = process.env.ALLOWED_ORIGINS;

interface FakeRes {
  headers: Record<string, string>;
  statusCode: number;
  ended: boolean;
  status(code: number): FakeRes;
  end(): FakeRes;
  setHeader(name: string, value: string): void;
}

const makeRes = (): FakeRes => {
  const res = {
    headers: {} as Record<string, string>,
    statusCode: 0,
    ended: false,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
  };
  return res;
};

const makeReq = (overrides: { method?: string; origin?: string } = {}) => ({
  method: overrides.method ?? 'POST',
  headers: overrides.origin === undefined ? {} : { origin: overrides.origin },
}) as unknown as VercelRequest;

const asRes = (r: FakeRes) => r as unknown as VercelResponse;

beforeEach(() => {
  process.env.ALLOWED_ORIGINS = 'https://allowed.example,http://localhost:5173';
});

afterEach(() => {
  if (ORIGINAL_ENV === undefined) delete process.env.ALLOWED_ORIGINS;
  else process.env.ALLOWED_ORIGINS = ORIGINAL_ENV;
  vi.restoreAllMocks();
});

describe('isOriginAllowed', () => {
  it('пропускает только origin из allow-list', () => {
    expect(isOriginAllowed('https://allowed.example', true)).toBe(true);
    expect(isOriginAllowed('https://evil.example', true)).toBe(false);
  });

  it('игнорирует trailing slash и регистр', () => {
    expect(isOriginAllowed('HTTPS://Allowed.Example/', true)).toBe(true);
  });

  it('пустой Origin: блок при requireOrigin=true, пропуск иначе', () => {
    expect(isOriginAllowed(undefined, true)).toBe(false);
    expect(isOriginAllowed('', true)).toBe(false);
    expect(isOriginAllowed(undefined, false)).toBe(true);
  });
});

describe('getAllowedOrigins', () => {
  it('парсит ALLOWED_ORIGINS из env, чистит пробелы и пустые', () => {
    process.env.ALLOWED_ORIGINS = ' https://a.example , , https://b.example ';
    expect(getAllowedOrigins()).toEqual(['https://a.example', 'https://b.example']);
  });
});

describe('applyCors', () => {
  it('POST с разрешённым Origin → continue + headers', () => {
    const req = makeReq({ method: 'POST', origin: 'https://allowed.example' });
    const res = makeRes();
    const result = applyCors(req, asRes(res), { methods: 'POST, OPTIONS' });
    expect(result).toBe('continue');
    expect(res.headers['Access-Control-Allow-Origin']).toBe('https://allowed.example');
    expect(res.headers['Vary']).toBe('Origin');
    expect(res.headers['Access-Control-Allow-Methods']).toBe('POST, OPTIONS');
  });

  it('POST без Origin → reject', () => {
    const req = makeReq({ method: 'POST' });
    const res = makeRes();
    expect(applyCors(req, asRes(res), { methods: 'POST, OPTIONS' })).toBe('reject');
  });

  it('POST с чужим Origin → reject', () => {
    const req = makeReq({ method: 'POST', origin: 'https://evil.example' });
    const res = makeRes();
    expect(applyCors(req, asRes(res), { methods: 'POST, OPTIONS' })).toBe('reject');
  });

  it('OPTIONS preflight: завершает 200 и сигналит preflight', () => {
    const req = makeReq({ method: 'OPTIONS', origin: 'https://allowed.example' });
    const res = makeRes();
    expect(applyCors(req, asRes(res), { methods: 'POST, OPTIONS' })).toBe('preflight');
    expect(res.statusCode).toBe(200);
    expect(res.ended).toBe(true);
  });

  it('GET без Origin → continue (требование Origin только для writes)', () => {
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    expect(applyCors(req, asRes(res), { methods: 'GET, OPTIONS' })).toBe('continue');
  });
});
