import React from 'react';
import { act, render } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { vi } from 'vitest';
import { useFormDraftPersistence } from './useFormDraftPersistence';

const asyncRemoveItemMock = vi.fn(async (_key: string) => undefined);
const asyncGetJsonMock = vi.fn(async (_key: string) => null);
const asyncSetJsonMock = vi.fn(async (_key: string, _value: unknown) => undefined);

vi.mock('../lib/asyncStorage', () => ({
  isStorageAvailable: () => true,
  asyncRemoveItem: (key: string) => asyncRemoveItemMock(key),
  asyncGetJson: (key: string) => asyncGetJsonMock(key),
  asyncSetJson: (key: string, value: unknown) => asyncSetJsonMock(key, value),
}));

type FormValues = { name: string };

const DraftHarness = ({ storageKey }: { storageKey: string }) => {
  const { reset, watch } = useForm<FormValues>({ defaultValues: { name: '' } });
  useFormDraftPersistence<FormValues>({ enabled: true, storageKey, reset, watch });
  return null;
};

describe('useFormDraftPersistence', () => {
  it('clears previous draft when storage key changes', async () => {
    const view = render(<DraftHarness storageKey="draft-ru" />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      view.rerender(<DraftHarness storageKey="draft-en" />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(asyncRemoveItemMock).toHaveBeenCalledWith('draft-ru');
  });
});
