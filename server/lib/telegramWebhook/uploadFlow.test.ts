import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TelegramUpdate } from './types.js';

vi.mock('./sessions.js', () => ({
  clearSession: vi.fn(),
  getSession: vi.fn(),
  setSession: vi.fn(),
}));

vi.mock('./telegramApi.js', () => ({
  answerCallbackQuery: vi.fn(),
  editMessageReplyMarkup: vi.fn(),
  getTelegramFile: vi.fn(),
  sendTelegramMessage: vi.fn(),
}));

vi.mock('./tags.js', () => ({
  buildTagKeyboard: vi.fn(() => ({ inline_keyboard: [] })),
  formatSelectedTags: vi.fn((tags: string[]) => (tags.length ? tags.join(', ') : 'untitled')),
  getAllTags: vi.fn(async () => ['a', 'b']),
}));

vi.mock('./supabaseClient.js', () => ({
  getSupabaseClient: vi.fn(() => {
    throw new Error('Supabase client should not be used in guard-branch tests');
  }),
  hasServiceRole: vi.fn(() => false),
}));

import { CANCELLED_MESSAGE, SESSION_EXPIRED_MESSAGE } from './commands.js';
import { clearSession, getSession, setSession } from './sessions.js';
import {
  answerCallbackQuery,
  editMessageReplyMarkup,
  getTelegramFile,
  sendTelegramMessage,
} from './telegramApi.js';
import { getSupabaseClient } from './supabaseClient.js';
import { extractFileInfo, handleCallbackQuery, handleFileUpload } from './uploadFlow.js';

type MessageShape = NonNullable<TelegramUpdate['message']>;

const buildMessage = (overrides: Partial<MessageShape> = {}): MessageShape => ({
  message_id: 1,
  chat: { id: 42 },
  ...overrides,
});

describe('telegramWebhook/uploadFlow', () => {
  describe('extractFileInfo', () => {
    it('picks the largest photo and labels it as jpeg', () => {
      const result = extractFileInfo(
        buildMessage({
          photo: [
            { file_id: 'small', file_unique_id: 's', width: 100, height: 100 },
            { file_id: 'large', file_unique_id: 'l', width: 1024, height: 1024 },
          ],
        }),
      );
      expect(result).not.toBe('unsupported');
      expect(result).not.toBeNull();
      if (!result || result === 'unsupported') return;
      expect(result.fileId).toBe('large');
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.width).toBe(1024);
      expect(result.height).toBe(1024);
    });

    it('returns video info with mime from message', () => {
      const result = extractFileInfo(
        buildMessage({
          video: {
            file_id: 'v1',
            file_unique_id: 'x',
            mime_type: 'video/webm',
            width: 640,
            height: 360,
            duration: 10,
            file_size: 1024,
          },
        }),
      );
      expect(result).toMatchObject({
        fileId: 'v1',
        mimeType: 'video/webm',
        duration: 10,
        fileSize: 1024,
      });
    });

    it('falls back to video/mp4 when video has no mime', () => {
      const result = extractFileInfo(
        buildMessage({ video: { file_id: 'v2', file_unique_id: 'y' } }),
      );
      expect(result).not.toBe('unsupported');
      if (!result || result === 'unsupported') return;
      expect(result.mimeType).toBe('video/mp4');
    });

    it('accepts documents with whitelisted mime types', () => {
      const result = extractFileInfo(
        buildMessage({
          document: {
            file_id: 'd1',
            file_unique_id: 'a',
            file_name: 'x.png',
            mime_type: 'image/png',
            file_size: 2048,
          },
        }),
      );
      expect(result).toMatchObject({
        fileId: 'd1',
        fileName: 'x.png',
        mimeType: 'image/png',
        fileSize: 2048,
      });
    });

    it('returns "unsupported" for documents with disallowed mime types', () => {
      const result = extractFileInfo(
        buildMessage({
          document: { file_id: 'd2', file_unique_id: 'b', mime_type: 'application/pdf' },
        }),
      );
      expect(result).toBe('unsupported');
    });

    it('returns null when the message has no photo/video/document', () => {
      expect(extractFileInfo(buildMessage({ text: 'hello' }))).toBeNull();
    });

    it('returns null for an empty photo array', () => {
      expect(extractFileInfo(buildMessage({ photo: [] }))).toBeNull();
    });
  });

  describe('handleCallbackQuery', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    const callback = (data: string, chatId = 100): TelegramUpdate => ({
      callback_query: {
        id: 'cb1',
        from: { id: 1 },
        message: { message_id: 555, chat: { id: chatId } },
        data,
      },
    });

    it('ignores callbacks without data or message', async () => {
      await handleCallbackQuery({ callback_query: { id: 'x', from: { id: 1 } } });
      expect(answerCallbackQuery).not.toHaveBeenCalled();
    });

    it('answers the callback query for every valid callback', async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      await handleCallbackQuery(callback('cancel'));
      expect(answerCallbackQuery).toHaveBeenCalledWith('cb1');
    });

    it('cancels the session and sends CANCELLED_MESSAGE', async () => {
      vi.mocked(getSession).mockResolvedValue({ state: 'awaiting_tags', selectedTags: [] });
      await handleCallbackQuery(callback('cancel'));
      expect(clearSession).toHaveBeenCalledWith(100);
      expect(sendTelegramMessage).toHaveBeenCalledWith(100, CANCELLED_MESSAGE);
    });

    it('sends SESSION_EXPIRED_MESSAGE when no session is found (non-cancel)', async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      await handleCallbackQuery(callback('done'));
      expect(sendTelegramMessage).toHaveBeenCalledWith(100, SESSION_EXPIRED_MESSAGE);
      expect(setSession).not.toHaveBeenCalled();
    });

    it('moves to awaiting_new_tag on "newtag"', async () => {
      vi.mocked(getSession).mockResolvedValue({ state: 'awaiting_tags', selectedTags: ['a'] });
      await handleCallbackQuery(callback('newtag'));
      expect(setSession).toHaveBeenCalledWith(100, {
        state: 'awaiting_new_tag',
        selectedTags: ['a'],
      });
    });

    it('moves to awaiting_files with empty tags on "skip"', async () => {
      vi.mocked(getSession).mockResolvedValue({ state: 'awaiting_tags', selectedTags: ['x'] });
      await handleCallbackQuery(callback('skip'));
      expect(setSession).toHaveBeenCalledWith(100, {
        state: 'awaiting_files',
        selectedTags: [],
      });
    });

    it('moves to awaiting_files preserving tags on "done"', async () => {
      vi.mocked(getSession).mockResolvedValue({ state: 'awaiting_tags', selectedTags: ['a', 'b'] });
      await handleCallbackQuery(callback('done'));
      expect(setSession).toHaveBeenCalledWith(100, {
        state: 'awaiting_files',
        selectedTags: ['a', 'b'],
      });
    });

    it('adds a tag on "tag:X" and re-renders the keyboard', async () => {
      vi.mocked(getSession).mockResolvedValue({ state: 'awaiting_tags', selectedTags: ['a'] });
      await handleCallbackQuery(callback('tag:b'));
      expect(setSession).toHaveBeenCalledWith(100, {
        state: 'awaiting_tags',
        selectedTags: ['a', 'b'],
      });
      expect(editMessageReplyMarkup).toHaveBeenCalledWith(100, 555, expect.any(Object));
    });

    it('removes a tag on "tag:X" when already selected', async () => {
      vi.mocked(getSession).mockResolvedValue({ state: 'awaiting_tags', selectedTags: ['a', 'b'] });
      await handleCallbackQuery(callback('tag:a'));
      expect(setSession).toHaveBeenCalledWith(100, {
        state: 'awaiting_tags',
        selectedTags: ['b'],
      });
    });
  });

  describe('handleFileUpload — guard branches', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    const wrap = (message: Partial<MessageShape>): TelegramUpdate => ({
      message: buildMessage(message),
    });

    const photoUpdate = (): TelegramUpdate =>
      wrap({ photo: [{ file_id: 'p', file_unique_id: 'u', width: 1, height: 1 }] });

    it('sends SESSION_EXPIRED_MESSAGE when there is no session', async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      await handleFileUpload(photoUpdate());
      expect(sendTelegramMessage).toHaveBeenCalledWith(42, SESSION_EXPIRED_MESSAGE);
    });

    it('nudges the user to finish the tag-input step when state is awaiting_new_tag', async () => {
      vi.mocked(getSession).mockResolvedValue({ state: 'awaiting_new_tag', selectedTags: [] });
      await handleFileUpload(photoUpdate());
      expect(sendTelegramMessage).toHaveBeenCalledTimes(1);
      const [, text] = vi.mocked(sendTelegramMessage).mock.calls[0];
      expect(text).toContain('шаге ввода тега');
    });

    it('asks the user to run /upload first when state is awaiting_tags', async () => {
      vi.mocked(getSession).mockResolvedValue({ state: 'awaiting_tags', selectedTags: [] });
      await handleFileUpload(photoUpdate());
      expect(sendTelegramMessage).toHaveBeenCalledTimes(1);
      const [, text] = vi.mocked(sendTelegramMessage).mock.calls[0];
      expect(text).toContain('/upload');
    });

    it('rejects unsupported document mime types with a warning', async () => {
      vi.mocked(getSession).mockResolvedValue({ state: 'awaiting_files', selectedTags: [] });
      await handleFileUpload(
        wrap({
          document: { file_id: 'd', file_unique_id: 'u', mime_type: 'application/pdf' },
        }),
      );
      expect(sendTelegramMessage).toHaveBeenCalledTimes(1);
      const [, text] = vi.mocked(sendTelegramMessage).mock.calls[0];
      expect(text).toContain('не поддерживается');
    });

    it('sends a generic warning when there is no recognizable attachment', async () => {
      vi.mocked(getSession).mockResolvedValue({ state: 'awaiting_files', selectedTags: [] });
      await handleFileUpload(wrap({ text: 'hello' }));
      expect(sendTelegramMessage).toHaveBeenCalledTimes(1);
      const [, text] = vi.mocked(sendTelegramMessage).mock.calls[0];
      expect(text).toContain('не смог распознать');
    });

    it('does nothing when the update has no message', async () => {
      await handleFileUpload({});
      expect(getSession).not.toHaveBeenCalled();
      expect(sendTelegramMessage).not.toHaveBeenCalled();
    });

    it('warns when telegram file metadata cannot be resolved', async () => {
      vi.mocked(getSession).mockResolvedValue({ state: 'awaiting_files', selectedTags: [] });
      vi.mocked(getTelegramFile).mockResolvedValue(null);

      await handleFileUpload(photoUpdate());

      expect(sendTelegramMessage).toHaveBeenCalledTimes(2);
      const [, text] = vi.mocked(sendTelegramMessage).mock.calls[1];
      expect(text).toContain('Не удалось скачать файл');
    });

    it('reports storage upload errors', async () => {
      vi.mocked(getSession).mockResolvedValue({ state: 'awaiting_files', selectedTags: ['promo'] });
      vi.mocked(getTelegramFile).mockResolvedValue({
        file_path: 'files/abc.jpg',
        data: new Uint8Array([1, 2, 3]),
      } as any);

      const upload = vi.fn(async () => ({ error: { message: 'storage failed' } }));
      vi.mocked(getSupabaseClient).mockImplementation(
        () =>
          ({
            storage: {
              from: vi.fn(() => ({
                upload,
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://cdn.example/file.jpg' } })),
              })),
            },
            from: vi.fn(() => ({
              insert: vi.fn(async () => ({ error: null })),
            })),
          }) as any,
      );

      await handleFileUpload(photoUpdate());

      expect(upload).toHaveBeenCalledTimes(1);
      expect(sendTelegramMessage).toHaveBeenCalledTimes(2);
      const [, text] = vi.mocked(sendTelegramMessage).mock.calls[1];
      expect(text).toContain('Не удалось сохранить файл');
      expect(text).toContain('storage failed');
    });

    it('reports database insert errors after successful upload', async () => {
      vi.mocked(getSession).mockResolvedValue({ state: 'awaiting_files', selectedTags: [] });
      vi.mocked(getTelegramFile).mockResolvedValue({
        file_path: 'files/abc.jpg',
        data: new Uint8Array([5, 6, 7, 8]),
      } as any);

      const insert = vi.fn(async () => ({ error: { message: 'db failed' } }));
      vi.mocked(getSupabaseClient).mockImplementation(
        () =>
          ({
            storage: {
              from: vi.fn(() => ({
                upload: vi.fn(async () => ({ error: null })),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://cdn.example/file.jpg' } })),
              })),
            },
            from: vi.fn(() => ({
              insert,
            })),
          }) as any,
      );

      await handleFileUpload(photoUpdate());

      expect(insert).toHaveBeenCalledTimes(1);
      expect(sendTelegramMessage).toHaveBeenCalledTimes(2);
      const [, text] = vi.mocked(sendTelegramMessage).mock.calls[1];
      expect(text).toContain('не записался в базу');
      expect(text).toContain('db failed');
    });

    it('persists media item and sends success confirmation', async () => {
      vi.mocked(getSession).mockResolvedValue({ state: 'awaiting_files', selectedTags: ['concert'] });
      vi.mocked(getTelegramFile).mockResolvedValue({
        file_path: 'files/abc.jpg',
        data: new Uint8Array([9, 8, 7]),
      } as any);

      const insert = vi.fn(async () => ({ error: null }));
      vi.mocked(getSupabaseClient).mockImplementation(
        () =>
          ({
            storage: {
              from: vi.fn(() => ({
                upload: vi.fn(async () => ({ error: null })),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://cdn.example/file.jpg' } })),
              })),
            },
            from: vi.fn(() => ({
              insert,
            })),
          }) as any,
      );

      await handleFileUpload(photoUpdate());

      expect(insert).toHaveBeenCalledTimes(1);
      const insertCall = insert.mock.calls[0] as unknown[] | undefined;
      expect(insertCall).toBeDefined();
      const insertedRows = insertCall?.[0] as Array<Record<string, unknown>> | undefined;
      const insertPayload = insertedRows?.[0];
      expect(insertPayload).toBeDefined();
      const payload = insertPayload as Record<string, unknown>;
      expect(payload.tags).toEqual(['concert']);
      expect(payload.type).toBe('image');

      expect(sendTelegramMessage).toHaveBeenCalledTimes(2);
      const [, text] = vi.mocked(sendTelegramMessage).mock.calls[1];
      expect(text).toContain('успешно добавлен');
    });
  });
});
