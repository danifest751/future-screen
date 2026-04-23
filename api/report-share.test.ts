import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import { createMockRequest, createMockResponse } from './testUtils';

type MaybeSingleResult = { data: unknown; error: unknown };

type SupabaseMockOptions = {
  slugChecks?: MaybeSingleResult[];
  reportBySlug?: MaybeSingleResult[];
  shareInsertError?: unknown;
  sessionLookup?: MaybeSingleResult[];
  sessionInsertResult?: { data: unknown; error: unknown };
  eventsInsertError?: unknown;
  sessionUpdateError?: unknown;
};

const createSupabaseMock = (options?: SupabaseMockOptions) => {
  const state = {
    slugChecks: [...(options?.slugChecks ?? [])],
    reportBySlug: [...(options?.reportBySlug ?? [])],
    sessionLookup: [...(options?.sessionLookup ?? [])],
    shareInsertCalls: [] as unknown[],
    sessionInsertCalls: [] as unknown[],
    eventsInsertCalls: [] as unknown[],
    sessionUpdateCalls: [] as unknown[],
  };

  return {
    __state: state,
    from: vi.fn((table: string) => {
      if (table === 'shared_reports') {
        const builder: Record<string, any> = { __select: '' };
        builder.select = vi.fn((value: string) => {
          builder.__select = value;
          return builder;
        });
        builder.eq = vi.fn(() => builder);
        builder.maybeSingle = vi.fn(async () => {
          if (builder.__select.includes('slug')) {
            return state.slugChecks.shift() ?? { data: null, error: null };
          }
          return state.reportBySlug.shift() ?? { data: null, error: null };
        });
        builder.insert = vi.fn(async (payload: unknown) => {
          state.shareInsertCalls.push(payload);
          return { error: options?.shareInsertError ?? null };
        });
        return builder;
      }

      if (table === 'visual_led_sessions') {
        const lookupBuilder: Record<string, any> = {};
        lookupBuilder.eq = vi.fn(() => lookupBuilder);
        lookupBuilder.maybeSingle = vi.fn(
          async () => state.sessionLookup.shift() ?? { data: null, error: null },
        );

        const tableBuilder: Record<string, any> = {};
        tableBuilder.select = vi.fn(() => lookupBuilder);
        tableBuilder.insert = vi.fn((payload: unknown) => {
          state.sessionInsertCalls.push(payload);
          return {
            select: vi.fn(() => ({
              single: vi.fn(
                async () =>
                  options?.sessionInsertResult ?? {
                    data: { id: 'session-new', summary: {} },
                    error: null,
                  },
              ),
            })),
          };
        });
        tableBuilder.update = vi.fn((payload: unknown) => {
          state.sessionUpdateCalls.push(payload);
          return {
            eq: vi.fn(async () => ({ error: options?.sessionUpdateError ?? null })),
          };
        });
        return tableBuilder;
      }

      if (table === 'visual_led_events') {
        return {
          insert: vi.fn(async (payload: unknown) => {
            state.eventsInsertCalls.push(payload);
            return { error: options?.eventsInsertError ?? null };
          }),
        };
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      };
    }),
  };
};

const importHandler = async () => {
  vi.resetModules();
  const mod = await import('./report-share');
  return mod.default;
};

describe('api/report-share', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
    process.env.ALLOWED_ORIGINS = 'https://allowed.example';
    delete process.env.PUBLIC_SITE_URL;
  });

  it('rejects forbidden POST origin', async () => {
    const handler = await importHandler();
    const req = createMockRequest({
      method: 'POST',
      headers: { origin: 'https://evil.example' },
      body: { html: '<p>x</p>' },
    });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(403);
    expect(mockRes.jsonBody()).toEqual({ error: 'Forbidden origin' });
  });

  it('handles OPTIONS preflight for allowed origin', async () => {
    const handler = await importHandler();
    const req = createMockRequest({ method: 'OPTIONS', headers: { origin: 'https://allowed.example' } });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(200);
    expect(mockRes.headers()['Access-Control-Allow-Origin']).toBe('https://allowed.example');
  });

  it('returns 400 on invalid POST payload', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    vi.mocked(createClient).mockReturnValue(createSupabaseMock() as never);
    const handler = await importHandler();

    const req = createMockRequest({
      method: 'POST',
      headers: { origin: 'https://allowed.example' },
      body: { html: '' },
    });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(400);
    expect(mockRes.jsonBody()).toEqual(expect.objectContaining({ error: 'Invalid payload' }));
  });

  it('creates a share URL on POST and retries slug generation on collision', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createSupabaseMock({
      slugChecks: [
        { data: { slug: 'occupied' }, error: null },
        { data: null, error: null },
      ],
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);

    const handler = await importHandler();
    const req = createMockRequest({
      method: 'POST',
      headers: { origin: 'https://allowed.example' },
      body: { html: '<div>ok</div>' },
    });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(201);
    expect(mockRes.jsonBody()).toEqual(
      expect.objectContaining({
        ok: true,
        url: expect.stringMatching(/^https:\/\/allowed\.example\/reports\//),
      }),
    );
    expect((supabase as any).__state.shareInsertCalls).toHaveLength(1);
  });

  it('returns 500 when unique slug cannot be generated after retries', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createSupabaseMock({
      slugChecks: Array.from({ length: 5 }, (_, i) => ({
        data: { slug: `occupied-${i}` },
        error: null,
      })),
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);

    const handler = await importHandler();
    const req = createMockRequest({
      method: 'POST',
      headers: { origin: 'https://allowed.example' },
      body: { html: '<div>ok</div>' },
    });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(500);
    expect(mockRes.jsonBody()).toEqual({ error: 'Internal server error' });
  });

  it('logs report sharing into existing visual_led session', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createSupabaseMock({
      slugChecks: [{ data: null, error: null }],
      sessionLookup: [
        {
          data: {
            id: 'session-existing',
            summary: { report_history: [{ at: 'old', url: 'https://old', scope: 'active' }] },
          },
          error: null,
        },
      ],
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);

    const handler = await importHandler();
    const req = createMockRequest({
      method: 'POST',
      headers: { origin: 'https://allowed.example' },
      body: {
        html: '<div>ok</div>',
        session_key: 'session-key-1234',
        export_scope: 'all',
        metrics: {
          screens_current: 3,
          scenes_total: 5,
          backgrounds_total: 2,
          has_active_background: true,
        },
      },
    });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(201);
    expect((supabase as any).__state.eventsInsertCalls).toHaveLength(1);
    expect((supabase as any).__state.sessionUpdateCalls).toHaveLength(1);

    const updatePayload = (supabase as any).__state.sessionUpdateCalls[0] as { summary: any };
    expect(updatePayload.summary.report_url).toMatch(/^https:\/\/allowed\.example\/reports\//);
    expect(updatePayload.summary.report_export_scope).toBe('all');
    expect(updatePayload.summary.screens).toBe(3);
    expect(updatePayload.summary.scenes).toBe(5);
    expect(updatePayload.summary.backgrounds).toBe(2);
    expect(updatePayload.summary.has_active_background).toBe(true);
    expect(updatePayload.summary.report_history.length).toBe(2);
  });

  it('creates fallback session when session_key is unknown and still returns 201', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createSupabaseMock({
      slugChecks: [{ data: null, error: null }],
      sessionLookup: [{ data: null, error: null }],
      sessionInsertResult: { data: { id: 'session-created', summary: {} }, error: null },
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);

    const handler = await importHandler();
    const req = createMockRequest({
      method: 'POST',
      headers: { origin: 'https://allowed.example' },
      body: {
        html: '<div>ok</div>',
        session_key: 'new-session-1234',
      },
    });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(201);
    expect((supabase as any).__state.sessionInsertCalls).toHaveLength(1);
    expect((supabase as any).__state.eventsInsertCalls).toHaveLength(1);
  });

  it('continues successfully even if analytics/event insert fails', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createSupabaseMock({
      slugChecks: [{ data: null, error: null }],
      sessionLookup: [{ data: { id: 'session-existing', summary: {} }, error: null }],
      eventsInsertError: new Error('event insert failed'),
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);

    const handler = await importHandler();
    const req = createMockRequest({
      method: 'POST',
      headers: { origin: 'https://allowed.example' },
      body: {
        html: '<div>ok</div>',
        session_key: 'session-key-1234',
      },
    });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(201);
    expect(mockRes.jsonBody()).toEqual(
      expect.objectContaining({
        ok: true,
        url: expect.stringMatching(/^https:\/\/allowed\.example\/reports\//),
      }),
    );
  });

  it('validates GET slug format', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    vi.mocked(createClient).mockReturnValue(createSupabaseMock() as never);

    const handler = await importHandler();
    const req = createMockRequest({
      method: 'GET',
      headers: { origin: 'https://allowed.example' },
      query: { slug: 'bad' },
    });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(400);
    expect(mockRes.sentBody()).toBe('Invalid report slug');
  });

  it('returns 404 for unknown report', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    vi.mocked(createClient).mockReturnValue(
      createSupabaseMock({ reportBySlug: [{ data: null, error: null }] }) as never,
    );

    const handler = await importHandler();
    const req = createMockRequest({
      method: 'GET',
      headers: { origin: 'https://allowed.example' },
      query: { slug: 'abcdefgh123456' },
    });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(404);
    expect(mockRes.sentBody()).toBe('Report not found');
  });

  it('returns stored report html for GET and sets CSP headers', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    vi.mocked(createClient).mockReturnValue(
      createSupabaseMock({ reportBySlug: [{ data: { html: '<html>ok</html>' }, error: null }] }) as never,
    );

    const handler = await importHandler();
    const req = createMockRequest({
      method: 'GET',
      headers: { origin: 'https://allowed.example' },
      query: { slug: 'abcdefgh123456' },
    });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(200);
    expect(mockRes.sentBody()).toBe('<html>ok</html>');
    expect(mockRes.headers()['Content-Security-Policy']).toContain("script-src 'none'");
  });

  it('returns 500 when GET query fails', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    vi.mocked(createClient).mockReturnValue(
      createSupabaseMock({ reportBySlug: [{ data: null, error: new Error('query failed') }] }) as never,
    );

    const handler = await importHandler();
    const req = createMockRequest({
      method: 'GET',
      headers: { origin: 'https://allowed.example' },
      query: { slug: 'abcdefgh123456' },
    });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(500);
    expect(mockRes.jsonBody()).toEqual({ error: 'Internal server error' });
  });

  it('returns 405 for unsupported methods', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    vi.mocked(createClient).mockReturnValue(createSupabaseMock() as never);

    const handler = await importHandler();
    const req = createMockRequest({
      method: 'DELETE',
      headers: { origin: 'https://allowed.example' },
    });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(405);
    expect(mockRes.jsonBody()).toEqual({ error: 'Method not allowed' });
  });

  it('returns 500 when supabase env vars are missing', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const handler = await importHandler();
    const req = createMockRequest({
      method: 'GET',
      headers: { origin: 'https://allowed.example' },
      query: { slug: 'abcdefgh123456' },
    });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(500);
    expect(mockRes.jsonBody()).toEqual({ error: 'Internal server error' });
  });
});

