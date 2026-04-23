import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./telegramApi.js', () => ({
  sendTelegramMessage: vi.fn(async () => undefined),
}));

vi.mock('./tags.js', () => ({
  buildTagKeyboard: vi.fn(() => ({ inline_keyboard: [[{ text: 'a', callback_data: 'tag:a' }]] })),
  getAllTags: vi.fn(async () => ['a', 'b']),
}));

vi.mock('./sessions.js', () => ({
  setSession: vi.fn(async () => undefined),
}));

import {
  parseTelegramCommand,
  handleStart,
  sendHelp,
  SUPPORTED_FORMATS,
} from './commands.js';
import { sendTelegramMessage } from './telegramApi.js';
import { buildTagKeyboard, getAllTags } from './tags.js';
import { setSession } from './sessions.js';

describe('telegramWebhook/commands/parseTelegramCommand', () => {
  it('returns null when text does not start with a slash', () => {
    expect(parseTelegramCommand('hello')).toBeNull();
    expect(parseTelegramCommand('')).toBeNull();
  });

  it('parses bare commands and normalizes them to lowercase', () => {
    expect(parseTelegramCommand('/start')).toBe('/start');
    expect(parseTelegramCommand('/UPLOAD')).toBe('/upload');
    expect(parseTelegramCommand('  /help  ')).toBe('/help');
  });

  it('strips @botname mentions', () => {
    expect(parseTelegramCommand('/upload@FutureScreenBot')).toBe('/upload');
    expect(parseTelegramCommand('/stats@bot arg')).toBe('/stats');
  });

  it('accepts arguments after the command', () => {
    expect(parseTelegramCommand('/upload some extra')).toBe('/upload');
  });

  it('rejects non-command slashes', () => {
    expect(parseTelegramCommand('/')).toBeNull();
    expect(parseTelegramCommand('/foo-bar')).toBeNull();
    expect(parseTelegramCommand('not /start')).toBeNull();
  });

  it('accepts underscores and digits in command names', () => {
    expect(parseTelegramCommand('/foo_bar')).toBe('/foo_bar');
    expect(parseTelegramCommand('/cmd2')).toBe('/cmd2');
  });
});

describe('telegramWebhook/commands flow helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handleStart initializes session and sends tag keyboard prompt', async () => {
    await handleStart(777);

    expect(vi.mocked(getAllTags)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(setSession)).toHaveBeenCalledWith(777, {
      state: 'awaiting_tags',
      selectedTags: [],
    });
    expect(vi.mocked(buildTagKeyboard)).toHaveBeenCalledWith(['a', 'b'], []);

    expect(vi.mocked(sendTelegramMessage)).toHaveBeenCalledTimes(1);
    const [, text, options] = vi.mocked(sendTelegramMessage).mock.calls[0];
    expect(text).toContain('1 из 3');
    expect(text).toContain(SUPPORTED_FORMATS);
    expect(options).toEqual({
      replyMarkup: { inline_keyboard: [[{ text: 'a', callback_data: 'tag:a' }]] },
    });
  });

  it('sendHelp sends command reference including /stats', async () => {
    await sendHelp(100);

    expect(vi.mocked(sendTelegramMessage)).toHaveBeenCalledTimes(1);
    const [, text] = vi.mocked(sendTelegramMessage).mock.calls[0];
    expect(text).toContain('/upload');
    expect(text).toContain('/help');
    expect(text).toContain('/stats');
    expect(text).toContain(SUPPORTED_FORMATS);
  });
});
