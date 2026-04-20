import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildLogEntry,
  deriveLeadStatus,
  loadExistingLeadLog,
  persistLeadState,
  upsertLeadFromPayload,
} from './leadTracking.js';
import type { DeliveryLogEntry, EmailPayload, SubmissionBody } from './types.js';

const makeEntry = (
  overrides: Partial<Omit<DeliveryLogEntry, 'at'>> = {},
): Omit<DeliveryLogEntry, 'at'> => ({
  step: 'api_received',
  status: 'success',
  channel: 'api',
  message: 'ok',
  ...overrides,
});

describe('sendApi/leadTracking pure helpers', () => {
  describe('buildLogEntry', () => {
    it('stamps the entry with a valid ISO timestamp', () => {
      const entry = buildLogEntry(makeEntry());
      expect(entry.at).toBeTypeOf('string');
      expect(Number.isNaN(Date.parse(entry.at))).toBe(false);
    });

    it('preserves every input field alongside the timestamp', () => {
      const input = makeEntry({
        step: 'telegram_sent',
        status: 'success',
        channel: 'telegram',
        message: 'done',
        details: 'extra',
        meta: { k: 'v' },
      });
      const entry = buildLogEntry(input);
      expect(entry).toMatchObject(input);
    });
  });

  describe('deriveLeadStatus', () => {
    const body = (overrides: Partial<SubmissionBody> = {}): SubmissionBody => ({ ...overrides });

    it('returns "delivered" when both email and telegram succeeded', () => {
      expect(deriveLeadStatus(body({ email: true, telegram: true }), 200)).toBe('delivered');
    });

    it('returns "partial" when only one channel succeeded', () => {
      expect(deriveLeadStatus(body({ email: true }), 200)).toBe('partial');
      expect(deriveLeadStatus(body({ telegram: true }), 200)).toBe('partial');
      expect(deriveLeadStatus(body({ clientEmail: true }), 200)).toBe('partial');
    });

    it('returns "failed" on 5xx even when body hints partial delivery', () => {
      expect(deriveLeadStatus(body({ email: true, telegram: true }), 500)).toBe('failed');
    });

    it('returns "failed" when body has an error or 4xx status', () => {
      expect(deriveLeadStatus(body({ error: 'boom' }), 200)).toBe('failed');
      expect(deriveLeadStatus(body(), 400)).toBe('failed');
    });

    it('returns "processing" for clean 2xx with no delivery flags', () => {
      expect(deriveLeadStatus(body(), 200)).toBe('processing');
    });

    it('handles undefined body', () => {
      expect(deriveLeadStatus(undefined, 200)).toBe('processing');
      expect(deriveLeadStatus(undefined, 500)).toBe('failed');
    });
  });
});

type SupabaseMock = {
  client: SupabaseClient;
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  updateEq: ReturnType<typeof vi.fn>;
};

const createSupabaseMock = (): SupabaseMock => {
  const maybeSingle = vi.fn();
  const insert = vi.fn().mockResolvedValue({ error: null });
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq: updateEq }));
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select, insert, update }));

  return {
    client: { from } as unknown as SupabaseClient,
    from,
    select,
    eq,
    maybeSingle,
    update,
    insert,
    updateEq,
  };
};

describe('loadExistingLeadLog', () => {
  it('returns empty array when requestId is empty', async () => {
    const mock = createSupabaseMock();
    const log = await loadExistingLeadLog(mock.client, '');
    expect(log).toEqual([]);
    expect(mock.from).not.toHaveBeenCalled();
  });

  it('returns the stored delivery_log when present', async () => {
    const mock = createSupabaseMock();
    const stored: DeliveryLogEntry[] = [
      { at: new Date().toISOString(), step: 's', status: 'success', channel: 'api', message: 'm' },
    ];
    mock.maybeSingle.mockResolvedValue({ data: { delivery_log: stored }, error: null });

    const log = await loadExistingLeadLog(mock.client, 'req-1');
    expect(log).toEqual(stored);
    expect(mock.from).toHaveBeenCalledWith('leads');
    expect(mock.eq).toHaveBeenCalledWith('request_id', 'req-1');
  });

  it('returns empty array when delivery_log is missing or not an array', async () => {
    const mock = createSupabaseMock();
    mock.maybeSingle.mockResolvedValue({ data: { delivery_log: null }, error: null });
    expect(await loadExistingLeadLog(mock.client, 'req-1')).toEqual([]);

    mock.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await loadExistingLeadLog(mock.client, 'req-1')).toEqual([]);
  });

  it('swallows supabase errors and returns empty array', async () => {
    const mock = createSupabaseMock();
    mock.maybeSingle.mockResolvedValue({ data: null, error: { message: 'db down' } });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await loadExistingLeadLog(mock.client, 'req-err')).toEqual([]);
    warn.mockRestore();
  });
});

describe('persistLeadState', () => {
  it('is a no-op when requestId is empty', async () => {
    const mock = createSupabaseMock();
    await persistLeadState({
      supabase: mock.client,
      requestId: '',
      status: 'processing',
      deliveryLog: [],
    });
    expect(mock.from).not.toHaveBeenCalled();
  });

  it('updates the lead row and only sends optional fields when provided', async () => {
    const mock = createSupabaseMock();
    const log: DeliveryLogEntry[] = [];

    await persistLeadState({
      supabase: mock.client,
      requestId: 'req-1',
      status: 'processing',
      deliveryLog: log,
    });
    expect(mock.update).toHaveBeenCalledWith({
      request_id: 'req-1',
      status: 'processing',
      delivery_log: log,
    });

    await persistLeadState({
      supabase: mock.client,
      requestId: 'req-2',
      status: 'delivered',
      deliveryLog: log,
      pagePath: '/contacts',
      referrer: 'https://x.test',
    });
    expect(mock.update).toHaveBeenLastCalledWith({
      request_id: 'req-2',
      status: 'delivered',
      delivery_log: log,
      page_path: '/contacts',
      referrer: 'https://x.test',
    });
    expect(mock.updateEq).toHaveBeenCalledWith('request_id', 'req-2');
  });
});

describe('upsertLeadFromPayload', () => {
  const payload: EmailPayload = {
    source: 'Сайт',
    name: 'Иван',
    phone: '+7 999 000 00 00',
    email: 'a@b.c',
  };

  it('is a no-op when requestId is empty', async () => {
    const mock = createSupabaseMock();
    await upsertLeadFromPayload({
      supabase: mock.client,
      requestId: '',
      payload,
      deliveryLog: [],
    });
    expect(mock.from).not.toHaveBeenCalled();
  });

  it('inserts when no existing row is found', async () => {
    const mock = createSupabaseMock();
    mock.maybeSingle.mockResolvedValue({ data: null, error: null });

    await upsertLeadFromPayload({
      supabase: mock.client,
      requestId: 'req-new',
      payload,
      deliveryLog: [],
    });

    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.update).not.toHaveBeenCalled();
    const row = mock.insert.mock.calls[0][0];
    expect(row).toMatchObject({
      request_id: 'req-new',
      source: 'Сайт',
      name: 'Иван',
      email: 'a@b.c',
      telegram: null,
      city: null,
      status: 'processing',
      extra: {},
    });
  });

  it('updates when an existing row is found', async () => {
    const mock = createSupabaseMock();
    mock.maybeSingle.mockResolvedValue({ data: { id: 42 }, error: null });

    await upsertLeadFromPayload({
      supabase: mock.client,
      requestId: 'req-exists',
      payload,
      deliveryLog: [],
    });

    expect(mock.update).toHaveBeenCalledTimes(1);
    expect(mock.insert).not.toHaveBeenCalled();
    expect(mock.updateEq).toHaveBeenCalledWith('id', 42);
  });

  it('bails out on lookup error without writing', async () => {
    const mock = createSupabaseMock();
    mock.maybeSingle.mockResolvedValue({ data: null, error: { message: 'bad' } });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await upsertLeadFromPayload({
      supabase: mock.client,
      requestId: 'req-err',
      payload,
      deliveryLog: [],
    });

    expect(mock.insert).not.toHaveBeenCalled();
    expect(mock.update).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
