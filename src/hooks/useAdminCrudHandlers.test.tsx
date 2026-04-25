import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdminCrudHandlers, type UseAdminCrudHandlersArgs } from './useAdminCrudHandlers';

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('react-hot-toast', () => ({
  default: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

interface Item { id: string; title: string }
type Form = { id: string; title: string };
type Payload = Item;

type Args = UseAdminCrudHandlersArgs<Payload, Form, Item, string>;

const buildArgs = (overrides: Partial<Args> = {}): Args => {
  return {
    editingId: null,
    setEditingId: vi.fn(),
    deleteTarget: null,
    buildPayload: (v) => ({ id: v.id.trim(), title: v.title.trim() }),
    upsert: vi.fn(async () => true),
    remove: vi.fn(async () => true),
    resetToDefault: vi.fn(async () => undefined),
    reset: vi.fn(),
    defaultValues: { id: '', title: '' },
    clearDraft: vi.fn(),
    toastCopy: {
      created: 'Создано',
      updated: 'Обновлено',
      saveError: 'Ошибка сохранения',
      deleted: 'Удалено',
      deleteError: 'Ошибка удаления',
      resetSuccess: 'Сброшено',
    },
    ...overrides,
  };
};

beforeEach(() => {
  toastSuccess.mockClear();
  toastError.mockClear();
});

describe('useAdminCrudHandlers', () => {
  describe('onSubmit', () => {
    it('новая запись: upsert → toast.created → reset + clearDraft', async () => {
      const args = buildArgs();
      const { result } = renderHook(() => useAdminCrudHandlers<Payload, Form, Item, string>(args));

      await act(async () => {
        await result.current.onSubmit({ id: 'a', title: 'Alpha' });
      });

      expect(args.upsert).toHaveBeenCalledWith({ id: 'a', title: 'Alpha' });
      expect(toastSuccess).toHaveBeenCalledWith('Создано');
      expect(args.setEditingId).toHaveBeenCalledWith(null);
      expect(args.reset).toHaveBeenCalledWith(args.defaultValues);
      expect(args.clearDraft).toHaveBeenCalledTimes(1);
    });

    it('редактирование: тост = "updated"', async () => {
      const args = buildArgs({ editingId: 'a' });
      const { result } = renderHook(() => useAdminCrudHandlers<Payload, Form, Item, string>(args));

      await act(async () => {
        await result.current.onSubmit({ id: 'a', title: 'Alpha' });
      });

      expect(toastSuccess).toHaveBeenCalledWith('Обновлено');
    });

    it('upsert вернул false → toast.error и НЕ ресетит форму', async () => {
      const args = buildArgs({ upsert: vi.fn(async () => false) });
      const { result } = renderHook(() => useAdminCrudHandlers<Payload, Form, Item, string>(args));

      await act(async () => {
        await result.current.onSubmit({ id: 'a', title: 'Alpha' });
      });

      expect(toastError).toHaveBeenCalledWith('Ошибка сохранения');
      expect(args.setEditingId).not.toHaveBeenCalled();
      expect(args.reset).not.toHaveBeenCalled();
      expect(args.clearDraft).not.toHaveBeenCalled();
    });
  });

  describe('cancelEdit', () => {
    it('сбрасывает editingId, форму и черновик', () => {
      const args = buildArgs({ editingId: 'a' });
      const { result } = renderHook(() => useAdminCrudHandlers<Payload, Form, Item, string>(args));

      act(() => result.current.cancelEdit());

      expect(args.setEditingId).toHaveBeenCalledWith(null);
      expect(args.reset).toHaveBeenCalledWith(args.defaultValues);
      expect(args.clearDraft).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleDelete', () => {
    it('без deleteTarget — ничего не делает', async () => {
      const args = buildArgs();
      const { result } = renderHook(() => useAdminCrudHandlers<Payload, Form, Item, string>(args));

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(args.remove).not.toHaveBeenCalled();
      expect(toastSuccess).not.toHaveBeenCalled();
    });

    it('с deleteTarget: remove(id) и тост успеха', async () => {
      const args = buildArgs({ deleteTarget: { id: 'x', title: 'X' } });
      const { result } = renderHook(() => useAdminCrudHandlers<Payload, Form, Item, string>(args));

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(args.remove).toHaveBeenCalledWith('x');
      expect(toastSuccess).toHaveBeenCalledWith('Удалено');
    });

    it('после успешного delete сбрасывает deleteTarget', async () => {
      const setDeleteTarget = vi.fn();
      const args = buildArgs({ deleteTarget: { id: 'x', title: 'X' }, setDeleteTarget });
      const { result } = renderHook(() => useAdminCrudHandlers<Payload, Form, Item, string>(args));

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(setDeleteTarget).toHaveBeenCalledWith(null);
    });

    it('после неудачного delete НЕ сбрасывает deleteTarget (модалка остаётся для повторной попытки)', async () => {
      const setDeleteTarget = vi.fn();
      const args = buildArgs({
        deleteTarget: { id: 'x', title: 'X' },
        remove: vi.fn(async () => false),
        setDeleteTarget,
      });
      const { result } = renderHook(() => useAdminCrudHandlers<Payload, Form, Item, string>(args));

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(setDeleteTarget).not.toHaveBeenCalled();
    });

    it('remove вернул false — тост ошибки', async () => {
      const args = buildArgs({
        deleteTarget: { id: 'x', title: 'X' },
        remove: vi.fn(async () => false),
      });
      const { result } = renderHook(() => useAdminCrudHandlers<Payload, Form, Item, string>(args));

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(toastError).toHaveBeenCalledWith('Ошибка удаления');
    });

    it('deleteIdField можно переопределить (нечасто, но поддерживается)', async () => {
      // Use a different field of TItem (here: 'title' as the id-key) to
      // verify the lookup is configurable. Type-safe because 'title' ∈ keyof Item.
      const args = buildArgs({
        deleteTarget: { id: 'x', title: 'titleAsId' },
        deleteIdField: 'title',
      });
      const { result } = renderHook(() => useAdminCrudHandlers<Payload, Form, Item, string>(args));

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(args.remove).toHaveBeenCalledWith('titleAsId');
    });
  });

  describe('handleResetDefaults', () => {
    it('await resetToDefault → toast + clearDraft', async () => {
      const args = buildArgs();
      const { result } = renderHook(() => useAdminCrudHandlers<Payload, Form, Item, string>(args));

      await act(async () => {
        await result.current.handleResetDefaults();
      });

      expect(args.resetToDefault).toHaveBeenCalledTimes(1);
      expect(toastSuccess).toHaveBeenCalledWith('Сброшено');
      expect(args.clearDraft).toHaveBeenCalledTimes(1);
    });
  });

  it('handlers стабильны между рендерами при стабильных args', async () => {
    const args = buildArgs();
    const { result, rerender } = renderHook(() => useAdminCrudHandlers<Payload, Form, Item, string>(args));
    const first = result.current;
    rerender();
    await waitFor(() => {
      expect(result.current.onSubmit).toBe(first.onSubmit);
    });
  });
});
