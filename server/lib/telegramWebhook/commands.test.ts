import { describe, it, expect } from 'vitest';
import { parseTelegramCommand } from './commands.js';

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
