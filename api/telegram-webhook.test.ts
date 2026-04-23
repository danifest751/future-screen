import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../server/lib/telegramWebhook/commands.js', () => ({
  START_HELP_MESSAGE: 'help message',
  handleStart: vi.fn(async () => undefined),
  parseTelegramCommand: vi.fn(() => null),
  sendHelp: vi.fn(async () => undefined),
}));

vi.mock('../server/lib/telegramWebhook/rbac.js', () => ({
  ensureAdmin: vi.fn(async () => undefined),
}));

vi.mock('../server/lib/telegramWebhook/sessions.js', () => ({
  getSession: vi.fn(async () => null),
  isMessageAlreadyProcessed: vi.fn(async () => false),
  markMessageAsProcessed: vi.fn(async () => undefined),
  setSession: vi.fn(async () => undefined),
}));

vi.mock('../server/lib/telegramWebhook/stats.js', () => ({
  sendVisualizationStats: vi.fn(async () => undefined),
}));

vi.mock('../server/lib/telegramWebhook/tags.js', () => ({
  formatSelectedTags: vi.fn((tags: string[]) => tags.join(', ')),
}));

vi.mock('../server/lib/telegramWebhook/telegramApi.js', () => ({
  getWebhookInfo: vi.fn(async () => ({ ok: true })),
  sendTelegramMessage: vi.fn(async () => undefined),
  setWebhook: vi.fn(async () => ({ ok: true })),
}));

vi.mock('../server/lib/telegramWebhook/uploadFlow.js', () => ({
  handleCallbackQuery: vi.fn(async () => undefined),
  handleFileUpload: vi.fn(async () => undefined),
}));

import handler from './telegram-webhook';
import { handleStart, parseTelegramCommand, sendHelp } from '../server/lib/telegramWebhook/commands.js';
import { ensureAdmin } from '../server/lib/telegramWebhook/rbac.js';
import {
  getSession,
  isMessageAlreadyProcessed,
  markMessageAsProcessed,
  setSession,
} from '../server/lib/telegramWebhook/sessions.js';
import { sendVisualizationStats } from '../server/lib/telegramWebhook/stats.js';
import { getWebhookInfo, sendTelegramMessage, setWebhook } from '../server/lib/telegramWebhook/telegramApi.js';
import { handleCallbackQuery, handleFileUpload } from '../server/lib/telegramWebhook/uploadFlow.js';
import { createMockRequest, createMockResponse } from './testUtils';

const originalEnv = { ...process.env };

const buildMessageUpdate = (overrides?: Record<string, unknown>) => ({
  message: {
    message_id: 42,
    chat: { id: 100 },
    text: 'hello',
    ...overrides,
  },
});

describe('api/telegram-webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TG_BOT_TOKEN = 'token';
    process.env.TELEGRAM_WEBHOOK_SECRET = 'secret';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('handles OPTIONS preflight', async () => {
    const req = createMockRequest({ method: 'OPTIONS' });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(200);
  });

  it('returns 500 for GET when token is missing', async () => {
    delete process.env.TG_BOT_TOKEN;
    const req = createMockRequest({ method: 'GET', query: {} });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(500);
    expect(mockRes.jsonBody()).toEqual({ error: 'TG_BOT_TOKEN not configured' });
  });

  it('guards webhook management GET actions with admin auth', async () => {
    vi.mocked(ensureAdmin).mockRejectedValueOnce(new Error('Unauthorized: missing bearer token'));

    const req = createMockRequest({ method: 'GET', query: { action: 'setWebhook', url: 'https://example.com' } });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(401);
    expect(mockRes.jsonBody()).toEqual({ error: 'Unauthorized: missing bearer token' });
  });

  it('executes setWebhook and getWebhookInfo actions', async () => {
    const setReq = createMockRequest({ method: 'GET', query: { action: 'setWebhook', url: 'https://example.com' } });
    const setRes = createMockResponse();
    await handler(setReq, setRes.res);

    expect(vi.mocked(ensureAdmin)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(setWebhook)).toHaveBeenCalledWith('token', 'https://example.com');
    expect(setRes.statusCode()).toBe(200);

    const infoReq = createMockRequest({ method: 'GET', query: { action: 'getWebhookInfo' } });
    const infoRes = createMockResponse();
    await handler(infoReq, infoRes.res);

    expect(vi.mocked(getWebhookInfo)).toHaveBeenCalledWith('token');
    expect(infoRes.statusCode()).toBe(200);
  });

  it('returns 403 when admin check fails with Forbidden', async () => {
    vi.mocked(ensureAdmin).mockRejectedValueOnce(new Error('Forbidden: admin role required'));
    const req = createMockRequest({ method: 'GET', query: { action: 'getWebhookInfo' } });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(403);
    expect(mockRes.jsonBody()).toEqual({ error: 'Forbidden: admin role required' });
  });

  it('validates setWebhook query params and handles action errors', async () => {
    const missingUrlReq = createMockRequest({ method: 'GET', query: { action: 'setWebhook' } });
    const missingUrlRes = createMockResponse();
    await handler(missingUrlReq, missingUrlRes.res);
    expect(missingUrlRes.statusCode()).toBe(400);

    vi.mocked(setWebhook).mockRejectedValueOnce(new Error('set webhook failed'));
    const setReq = createMockRequest({ method: 'GET', query: { action: 'setWebhook', url: 'https://example.com' } });
    const setRes = createMockResponse();
    await handler(setReq, setRes.res);
    expect(setRes.statusCode()).toBe(500);
    expect(setRes.jsonBody()).toEqual({ error: 'Error: set webhook failed' });

    vi.mocked(getWebhookInfo).mockRejectedValueOnce(new Error('info failed'));
    const infoReq = createMockRequest({ method: 'GET', query: { action: 'getWebhookInfo' } });
    const infoRes = createMockResponse();
    await handler(infoReq, infoRes.res);
    expect(infoRes.statusCode()).toBe(500);
    expect(infoRes.jsonBody()).toEqual({ error: 'Error: info failed' });
  });

  it('rejects unsupported methods', async () => {
    const req = createMockRequest({ method: 'PUT' });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(mockRes.statusCode()).toBe(405);
    expect(mockRes.jsonBody()).toEqual({ error: 'Method not allowed' });
  });

  it('rejects POST when webhook secret is missing or invalid', async () => {
    const body = buildMessageUpdate();

    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    const missingReq = createMockRequest({ method: 'POST', headers: {}, body });
    const missingRes = createMockResponse();
    await handler(missingReq, missingRes.res);
    expect(missingRes.statusCode()).toBe(500);

    process.env.TELEGRAM_WEBHOOK_SECRET = 'secret';
    const invalidReq = createMockRequest({
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': 'wrong' },
      body,
    });
    const invalidRes = createMockResponse();
    await handler(invalidReq, invalidRes.res);
    expect(invalidRes.statusCode()).toBe(401);
  });

  it('rejects POST when bot token is missing', async () => {
    delete process.env.TG_BOT_TOKEN;
    const req = createMockRequest({
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': 'secret' },
      body: buildMessageUpdate(),
    });
    const mockRes = createMockResponse();
    await handler(req, mockRes.res);
    expect(mockRes.statusCode()).toBe(500);
    expect(mockRes.jsonBody()).toEqual({ error: 'Bot token not configured' });
  });

  it('handles callback query updates', async () => {
    const req = createMockRequest({
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': 'secret' },
      body: { callback_query: { id: 'cb-1' } },
    });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(vi.mocked(handleCallbackQuery)).toHaveBeenCalledTimes(1);
    expect(mockRes.statusCode()).toBe(200);
  });

  it('returns ok for updates without callback and without message', async () => {
    const req = createMockRequest({
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': 'secret' },
      body: { update_id: 1 },
    });
    const mockRes = createMockResponse();
    await handler(req, mockRes.res);
    expect(mockRes.statusCode()).toBe(200);
    expect(mockRes.jsonBody()).toEqual({ ok: true });
  });

  it('skips already-processed messages', async () => {
    vi.mocked(isMessageAlreadyProcessed).mockResolvedValueOnce(true);
    const req = createMockRequest({
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': 'secret' },
      body: buildMessageUpdate(),
    });
    const mockRes = createMockResponse();

    await handler(req, mockRes.res);

    expect(vi.mocked(markMessageAsProcessed)).not.toHaveBeenCalled();
    expect(mockRes.statusCode()).toBe(200);
  });

  it('routes /start, /help and /stats commands', async () => {
    const reqBase = {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': 'secret' },
    };

    vi.mocked(parseTelegramCommand).mockReturnValueOnce('/start');
    await handler(createMockRequest({ ...reqBase, body: buildMessageUpdate({ text: '/start' }) }), createMockResponse().res);
    expect(vi.mocked(handleStart)).toHaveBeenCalledWith(100);

    vi.mocked(parseTelegramCommand).mockReturnValueOnce('/help');
    await handler(createMockRequest({ ...reqBase, body: buildMessageUpdate({ text: '/help' }) }), createMockResponse().res);
    expect(vi.mocked(sendHelp)).toHaveBeenCalledWith(100);

    vi.mocked(parseTelegramCommand).mockReturnValueOnce('/stats');
    await handler(createMockRequest({ ...reqBase, body: buildMessageUpdate({ text: '/stats' }) }), createMockResponse().res);
    expect(vi.mocked(sendVisualizationStats)).toHaveBeenCalledWith(100);
  });

  it('handles upload flow and awaiting-files fallback prompts', async () => {
    const reqBase = {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': 'secret' },
    };

    await handler(
      createMockRequest({ ...reqBase, body: buildMessageUpdate({ photo: [{ file_id: '1' }], text: '' }) }),
      createMockResponse().res,
    );
    expect(vi.mocked(handleFileUpload)).toHaveBeenCalledTimes(1);

    vi.mocked(getSession).mockResolvedValueOnce({ state: 'awaiting_files', selectedTags: [] } as never);
    await handler(createMockRequest({ ...reqBase, body: buildMessageUpdate({ text: 'ping' }) }), createMockResponse().res);
    expect(vi.mocked(sendTelegramMessage)).toHaveBeenCalled();
  });

  it('handles awaiting_new_tag state and default fallback message', async () => {
    const reqBase = {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': 'secret' },
    };

    vi.mocked(getSession).mockResolvedValueOnce({ state: 'awaiting_new_tag', selectedTags: ['a'] } as never);
    await handler(createMockRequest({ ...reqBase, body: buildMessageUpdate({ text: 'new-tag' }) }), createMockResponse().res);
    expect(vi.mocked(setSession)).toHaveBeenCalledWith(100, {
      state: 'awaiting_tags',
      selectedTags: ['a', 'new-tag'],
    });

    vi.mocked(getSession).mockResolvedValueOnce(null as never);
    await handler(createMockRequest({ ...reqBase, body: buildMessageUpdate({ text: 'just text' }) }), createMockResponse().res);
    expect(vi.mocked(sendTelegramMessage)).toHaveBeenCalled();
  });

  it('validates new tag length and catches unhandled errors', async () => {
    const reqBase = {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': 'secret' },
    };

    vi.mocked(getSession).mockResolvedValueOnce({ state: 'awaiting_new_tag', selectedTags: [] } as never);
    await handler(
      createMockRequest({ ...reqBase, body: buildMessageUpdate({ text: '  ' }) }),
      createMockResponse().res,
    );
    const [, invalidTagMessage] = vi.mocked(sendTelegramMessage).mock.calls.at(-1) ?? [];
    expect(String(invalidTagMessage)).toContain('Тег должен быть');

    vi.mocked(isMessageAlreadyProcessed).mockRejectedValueOnce(new Error('boom'));
    const errorRes = createMockResponse();
    await handler(
      createMockRequest({ ...reqBase, body: buildMessageUpdate({ text: '/start' }) }),
      errorRes.res,
    );
    expect(errorRes.statusCode()).toBe(500);
    expect(errorRes.jsonBody()).toEqual({ error: 'Internal server error' });
  });
});
