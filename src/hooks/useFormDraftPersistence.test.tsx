import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFormDraftPersistence } from './useFormDraftPersistence';

const isStorageAvailableMock = vi.fn(() => true);
const asyncRemoveItemMock = vi.fn(async (_key: string) => undefined);
const asyncGetJsonMock = vi.fn(async (_key: string) => null as unknown);
const asyncSetJsonMock = vi.fn(async (_key: string, _value: unknown) => undefined);

vi.mock('../lib/asyncStorage', () => ({
  isStorageAvailable: () => isStorageAvailableMock(),
  asyncRemoveItem: (key: string) => asyncRemoveItemMock(key),
  asyncGetJson: (key: string) => asyncGetJsonMock(key),
  asyncSetJson: (key: string, value: unknown) => asyncSetJsonMock(key, value),
}));

type FormValues = { name: string };

const flushAsync = async () => {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const useHarness = (enabled = true, storageKey = 'draft-default') => {
  const form = useForm<FormValues>({ defaultValues: { name: '' } });
  const state = useFormDraftPersistence<FormValues>({
    enabled,
    storageKey,
    reset: form.reset,
    watch: form.watch,
  });
  return { ...state, form };
};

describe('useFormDraftPersistence', () => {
  const originalRaf = globalThis.requestAnimationFrame;

  beforeEach(() => {
    vi.clearAllMocks();
    isStorageAvailableMock.mockReturnValue(true);
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    }) as typeof requestAnimationFrame;
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRaf;
  });

  it('hydrates form from persisted draft', async () => {
    asyncGetJsonMock.mockResolvedValueOnce({ name: 'Alice' });
    const { result } = renderHook(() => useHarness(true, 'draft-ru'));

    await flushAsync();

    expect(result.current.isHydrated).toBe(true);
    expect(result.current.hasDraft).toBe(true);
    expect(result.current.form.getValues('name')).toBe('Alice');
  });

  it('clears previous draft when storage key changes', async () => {
    const view = renderHook(({ key }) => useHarness(true, key), {
      initialProps: { key: 'draft-ru' },
    });

    await flushAsync();

    await act(async () => {
      view.rerender({ key: 'draft-en' });
    });
    await flushAsync();

    expect(asyncRemoveItemMock).toHaveBeenCalledWith('draft-ru');
  });

  it('persists values on watched form changes', async () => {
    let watchCallback: ((values: FormValues) => void) | null = null;
    const watchMockA = vi.fn((cb: (values: FormValues) => void) => {
      watchCallback = cb;
      return { unsubscribe: vi.fn() };
    });
    const watchMockB = vi.fn((cb: (values: FormValues) => void) => {
      watchCallback = cb;
      return { unsubscribe: vi.fn() };
    });
    const resetMock = vi.fn();

    const view = renderHook(({ watchFn }: { watchFn: any }) =>
      useFormDraftPersistence<FormValues>({
        enabled: true,
        storageKey: 'draft-write',
        reset: resetMock as any,
        watch: watchFn,
      }),
      { initialProps: { watchFn: watchMockA as any } },
    );
    await flushAsync();
    await flushAsync();

    act(() => {
      view.rerender({ watchFn: watchMockB as any });
    });
    await flushAsync();
    expect(watchMockB).toHaveBeenCalled();

    act(() => {
      watchCallback?.({ name: 'Neo' });
    });
    await flushAsync();
    await flushAsync();

    expect(asyncSetJsonMock).toHaveBeenCalled();
    const [storageKey, payload] = asyncSetJsonMock.mock.calls.at(-1) ?? [];
    expect(storageKey).toBe('draft-write');
    expect(payload).toEqual(expect.objectContaining({ name: 'Neo' }));
  });

  it('clearDraft removes current key and resets hasDraft flag', async () => {
    asyncGetJsonMock.mockResolvedValueOnce({ name: 'ToClear' });
    const { result } = renderHook(() => useHarness(true, 'draft-clear'));
    await flushAsync();

    expect(result.current.hasDraft).toBe(true);
    await act(async () => {
      await result.current.clearDraft();
    });

    expect(asyncRemoveItemMock).toHaveBeenCalledWith('draft-clear');
    expect(result.current.hasDraft).toBe(false);
  });

  it('clearDraft гасит ВСЕ последующие watch-события в окне 250 мс (не только первое)', async () => {
    // Regression: ранее suppressNextWriteRef глотал ровно одну запись,
    // и каскад change-событий от reset() возвращал частичный draft в storage.
    let watchCallback: ((values: FormValues) => void) | null = null;
    const watchMock = vi.fn((cb: (values: FormValues) => void) => {
      watchCallback = cb;
      return { unsubscribe: vi.fn() };
    });
    const resetMock = vi.fn();

    const { result } = renderHook(() =>
      useFormDraftPersistence<FormValues>({
        enabled: true,
        storageKey: 'draft-burst',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reset: resetMock as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        watch: watchMock as any,
      }),
    );
    await flushAsync();

    await act(async () => {
      await result.current.clearDraft();
    });
    asyncSetJsonMock.mockClear();

    // Имитируем каскад: 3 change-события сразу после reset()
    act(() => {
      watchCallback?.({ name: 'a' });
      watchCallback?.({ name: 'b' });
      watchCallback?.({ name: 'c' });
    });
    await flushAsync();

    expect(asyncSetJsonMock).not.toHaveBeenCalled();
  });

  it('handles read errors by removing corrupted draft', async () => {
    asyncGetJsonMock.mockRejectedValueOnce(new Error('broken json'));
    const { result } = renderHook(() => useHarness(true, 'draft-broken'));
    await flushAsync();

    expect(asyncRemoveItemMock).toHaveBeenCalledWith('draft-broken');
    expect(result.current.hasDraft).toBe(false);
    expect(result.current.isHydrated).toBe(true);
  });

  it('marks as hydrated without storage access when disabled or unavailable', async () => {
    const disabled = renderHook(() => useHarness(false, 'draft-disabled'));
    await flushAsync();
    expect(disabled.result.current.isHydrated).toBe(true);

    isStorageAvailableMock.mockReturnValue(false);
    const unavailable = renderHook(() => useHarness(true, 'draft-unavailable'));
    await flushAsync();
    expect(unavailable.result.current.isHydrated).toBe(true);

    expect(asyncGetJsonMock).not.toHaveBeenCalledWith('draft-unavailable');
  });
});
