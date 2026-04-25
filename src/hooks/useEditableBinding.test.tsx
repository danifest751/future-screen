import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditableBinding } from './useEditableBinding';

const editModeMock = {
  isEditing: false,
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

describe('useEditableBinding', () => {
  beforeEach(() => {
    editModeMock.isEditing = false;
    editModeMock.reportSaveSucceeded.mockClear();
    editModeMock.reportSaveStart.mockClear();
    editModeMock.reportSaveEnd.mockClear();
    toastSuccessMock.mockClear();
    toastErrorMock.mockClear();
  });

  it('is inert outside edit mode', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useEditableBinding({
        value: 'Persisted text',
        onSave,
      }),
    );

    expect(result.current.value).toBe('Persisted text');
    expect(result.current.bindProps).toEqual({});
    expect(onSave).not.toHaveBeenCalled();
  });

  it('commits cleaned text on blur in edit mode', async () => {
    editModeMock.isEditing = true;
    const onSave = vi.fn(async () => undefined);
    const { result } = renderHook(() =>
      useEditableBinding({
        value: 'Old',
        onSave,
      }),
    );

    await act(async () => {
      const onBlur = result.current.bindProps.onBlur as (e: {
        currentTarget: { textContent: string };
      }) => void;
      onBlur({ currentTarget: { textContent: '  New    value  ' } });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('New value');
    });
    expect(editModeMock.reportSaveStart).toHaveBeenCalledTimes(1);
    expect(editModeMock.reportSaveSucceeded).toHaveBeenCalledTimes(1);
    expect(editModeMock.reportSaveEnd).toHaveBeenCalledTimes(1);
  });

  it('does not save when cleaned text equals persisted value', async () => {
    editModeMock.isEditing = true;
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useEditableBinding({
        value: 'Same value',
        onSave,
      }),
    );

    await act(async () => {
      const onBlur = result.current.bindProps.onBlur as (e: {
        currentTarget: { textContent: string };
      }) => void;
      onBlur({ currentTarget: { textContent: '  Same     value  ' } });
      await Promise.resolve();
    });

    expect(onSave).not.toHaveBeenCalled();
    expect(editModeMock.reportSaveStart).not.toHaveBeenCalled();
  });

  it('esc cancels draft and blurs element', () => {
    editModeMock.isEditing = true;
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useEditableBinding({
        value: 'Persisted',
        onSave,
      }),
    );

    const el = {
      textContent: 'Draft value',
      blur: vi.fn(),
    } as unknown as HTMLElement;

    act(() => {
      const ref = result.current.bindProps.ref as (node: HTMLElement | null) => void;
      ref(el);
    });

    const preventDefault = vi.fn();
    act(() => {
      const onKeyDown = result.current.bindProps.onKeyDown as (e: {
        key: string;
        preventDefault: () => void;
        currentTarget: HTMLElement;
      }) => void;
      onKeyDown({
        key: 'Escape',
        preventDefault,
        currentTarget: el,
      });
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(el.textContent).toBe('Persisted');
    expect(el.blur).toHaveBeenCalledTimes(1);
  });

  it('enter triggers blur in single-line mode', () => {
    editModeMock.isEditing = true;
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useEditableBinding({
        value: 'v',
        onSave,
        kind: 'text',
      }),
    );

    const target = { blur: vi.fn() } as unknown as HTMLElement;
    const preventDefault = vi.fn();
    act(() => {
      const onKeyDown = result.current.bindProps.onKeyDown as (e: {
        key: string;
        shiftKey?: boolean;
        preventDefault: () => void;
        currentTarget: HTMLElement;
      }) => void;
      onKeyDown({
        key: 'Enter',
        preventDefault,
        currentTarget: target,
      });
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(target.blur).toHaveBeenCalledTimes(1);
  });

  it('shows a localised toast naming the field and editor language on success', async () => {
    editModeMock.isEditing = true;
    const onSave = vi.fn(async () => undefined);
    const { result } = renderHook(() =>
      useEditableBinding({ value: 'Old', onSave, label: 'Hero badge' }),
    );

    await act(async () => {
      const onBlur = result.current.bindProps.onBlur as (e: { currentTarget: { textContent: string } }) => void;
      onBlur({ currentTarget: { textContent: 'New' } });
      await Promise.resolve();
    });

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));
    expect(toastSuccessMock.mock.calls[0][0]).toBe('«Hero badge» сохранено · EN');
    expect(toastSuccessMock.mock.calls[0][1]).toMatchObject({ id: 'editable:Hero badge' });
  });

  it('does not toast when label is omitted', async () => {
    editModeMock.isEditing = true;
    const onSave = vi.fn(async () => undefined);
    const { result } = renderHook(() => useEditableBinding({ value: 'Old', onSave }));

    await act(async () => {
      const onBlur = result.current.bindProps.onBlur as (e: { currentTarget: { textContent: string } }) => void;
      onBlur({ currentTarget: { textContent: 'New' } });
      await Promise.resolve();
    });

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it('exposes save error and restores persisted text when save fails', async () => {
    editModeMock.isEditing = true;
    const onSave = vi.fn(async () => {
      throw new Error('save failed hard');
    });

    const { result } = renderHook(() =>
      useEditableBinding({
        value: 'Stable',
        onSave,
        label: 'CTA primary',
      }),
    );

    const el = {
      textContent: 'Draft',
      blur: vi.fn(),
    } as unknown as HTMLElement;
    act(() => {
      const ref = result.current.bindProps.ref as (node: HTMLElement | null) => void;
      ref(el);
    });

    await act(async () => {
      const onBlur = result.current.bindProps.onBlur as (e: {
        currentTarget: { textContent: string };
      }) => void;
      onBlur({ currentTarget: { textContent: 'Broken change' } });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('save failed hard');
    });
    expect(el.textContent).toBe('Stable');
    expect(editModeMock.reportSaveEnd).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock.mock.calls[0][0]).toBe('«CTA primary» не сохранилось: save failed hard');
  });
});

