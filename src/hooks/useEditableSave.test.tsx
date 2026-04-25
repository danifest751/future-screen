import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditableSave } from './useEditableSave';

const editModeMock = {
  isEditing: true,
  toggle: vi.fn(),
  setEditing: vi.fn(),
  savesVersion: 0,
  reportSaveSucceeded: vi.fn(),
  activeSaves: 0,
  reportSaveStart: vi.fn(),
  reportSaveEnd: vi.fn(),
};

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('react-hot-toast', () => ({
  default: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock('../context/EditModeContext', () => ({
  useOptionalEditMode: () => editModeMock,
}));

vi.mock('../context/I18nContext', () => ({
  useOptionalI18n: () => ({ siteLocale: 'en', adminLocale: 'ru' }),
}));

describe('useEditableSave', () => {
  beforeEach(() => {
    editModeMock.reportSaveStart.mockClear();
    editModeMock.reportSaveEnd.mockClear();
    editModeMock.reportSaveSucceeded.mockClear();
    toastSuccessMock.mockClear();
    toastErrorMock.mockClear();
  });

  it('runSave: вызывает start/succeeded/end и возвращает результат', async () => {
    const { result } = renderHook(() => useEditableSave({ label: 'Hero badge' }));

    let returned: unknown = 'untouched';
    await act(async () => {
      returned = await result.current.runSave(async () => 'ok');
    });

    expect(returned).toBe('ok');
    expect(editModeMock.reportSaveStart).toHaveBeenCalledTimes(1);
    expect(editModeMock.reportSaveSucceeded).toHaveBeenCalledTimes(1);
    expect(editModeMock.reportSaveEnd).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock.mock.calls[0][0]).toBe('«Hero badge» сохранено · EN');
    expect(toastSuccessMock.mock.calls[0][1]).toMatchObject({ id: 'editable:Hero badge' });
  });

  it('runSave: при ошибке возвращает null, выставляет error и тостит ошибку', async () => {
    const { result } = renderHook(() => useEditableSave({ label: 'Hero badge' }));

    let returned: unknown = 'untouched';
    await act(async () => {
      returned = await result.current.runSave(async () => {
        throw new Error('boom');
      });
    });

    expect(returned).toBeNull();
    await waitFor(() => expect(result.current.error).toBe('boom'));
    expect(editModeMock.reportSaveSucceeded).not.toHaveBeenCalled();
    expect(editModeMock.reportSaveEnd).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock.mock.calls[0][0]).toBe('«Hero badge» не сохранилось: boom');
  });

  it('suffix добавляется к label в тосте', async () => {
    const { result } = renderHook(() =>
      useEditableSave({ label: 'Work 1 — photo', suffix: ' (alt)' })
    );
    await act(async () => {
      await result.current.runSave(async () => undefined);
    });
    expect(toastSuccessMock.mock.calls[0][0]).toBe('«Work 1 — photo (alt)» сохранено · EN');
  });

  it('без label — тост не показывается, lifecycle всё равно отрабатывает', async () => {
    const { result } = renderHook(() => useEditableSave());
    await act(async () => {
      await result.current.runSave(async () => undefined);
    });
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(editModeMock.reportSaveStart).toHaveBeenCalledTimes(1);
    expect(editModeMock.reportSaveSucceeded).toHaveBeenCalledTimes(1);
  });

  it('clearError сбрасывает ошибку', async () => {
    const { result } = renderHook(() => useEditableSave({ label: 'X' }));
    await act(async () => {
      await result.current.runSave(async () => { throw new Error('e'); });
    });
    await waitFor(() => expect(result.current.error).toBe('e'));
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
