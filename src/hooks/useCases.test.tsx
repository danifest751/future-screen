/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCases } from './useCases';
import * as queries from '../queries';

vi.mock('../queries', () => ({
  useCasesQuery: vi.fn(),
  useCreateCaseMutation: vi.fn(),
  useUpdateCaseMutation: vi.fn(),
  useDeleteCaseMutation: vi.fn(),
  useResetCasesMutation: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCases', () => {
  const mockBase = (overrides?: {
    data?: any[];
    createMutate?: any;
    updateMutate?: any;
    deleteMutate?: any;
    resetMutate?: any;
    error?: Error | null;
  }) => {
    vi.mocked(queries.useCasesQuery).mockReturnValue({
      data: overrides?.data ?? [],
      isLoading: false,
      error: overrides?.error ?? null,
    } as any);
    vi.mocked(queries.useCreateCaseMutation).mockReturnValue({
      mutateAsync: overrides?.createMutate ?? vi.fn(),
    } as any);
    vi.mocked(queries.useUpdateCaseMutation).mockReturnValue({
      mutateAsync: overrides?.updateMutate ?? vi.fn(),
    } as any);
    vi.mocked(queries.useDeleteCaseMutation).mockReturnValue({
      mutateAsync: overrides?.deleteMutate ?? vi.fn(),
    } as any);
    vi.mocked(queries.useResetCasesMutation).mockReturnValue({
      mutateAsync: overrides?.resetMutate ?? vi.fn(),
    } as any);
  };

  it('должен вернуть пустой массив кейсов при отсутствии данных', () => {
    vi.clearAllMocks();
    vi.mocked(queries.useCasesQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(queries.useCreateCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useUpdateCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useDeleteCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useResetCasesMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);

    const { result } = renderHook(() => useCases(), { wrapper: createWrapper() });

    expect(result.current.cases).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('должен преобразовать данные из БД в формат приложения', () => {
    vi.clearAllMocks();
    const mockCases = [
      {
        id: 1,
        slug: 'test-case',
        title: 'Тестовый кейс',
        city: 'Москва',
        date: '2024',
        format: 'Концерт',
        services: ['led', 'sound'],
        summary: 'Описание',
        metrics: '1000 зрителей',
        images: ['img1.jpg'],
        videos: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    vi.mocked(queries.useCasesQuery).mockReturnValue({
      data: mockCases,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(queries.useCreateCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useUpdateCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useDeleteCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useResetCasesMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);

    const { result } = renderHook(() => useCases(), { wrapper: createWrapper() });

    expect(result.current.cases).toHaveLength(1);
    expect(result.current.cases[0].slug).toBe('test-case');
    expect(result.current.cases[0].title).toBe('Тестовый кейс');
    expect(result.current.cases[0].services).toEqual(['led', 'sound']);
  });

  it('должен показать ошибку при загрузке', () => {
    vi.clearAllMocks();
    vi.mocked(queries.useCasesQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Ошибка загрузки'),
    } as any);
    vi.mocked(queries.useCreateCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useUpdateCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useDeleteCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useResetCasesMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);

    const { result } = renderHook(() => useCases(), { wrapper: createWrapper() });

    expect(result.current.error).toBe('Ошибка загрузки');
  });

  it('должен вызвать addCase и вернуть true при успехе', async () => {
    vi.clearAllMocks();
    const mockMutateAsync = vi.fn().mockResolvedValue({});
    vi.mocked(queries.useCasesQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(queries.useCreateCaseMutation).mockReturnValue({ mutateAsync: mockMutateAsync } as any);
    vi.mocked(queries.useUpdateCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useDeleteCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useResetCasesMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);

    const { result } = renderHook(() => useCases(), { wrapper: createWrapper() });

    const payload = {
      slug: 'new-case',
      title: 'Новый кейс',
      city: 'Москва',
      date: '2024',
      format: 'Концерт',
      summary: 'Описание',
      services: ['led'],
    };

    const ok = await result.current.addCase(payload);

    expect(ok).toBe(true);
    expect(mockMutateAsync).toHaveBeenCalled();
  });

  it('должен вернуть false при ошибке addCase', async () => {
    vi.clearAllMocks();
    const mockMutateAsync = vi.fn().mockRejectedValue(new Error('Ошибка'));
    vi.mocked(queries.useCasesQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(queries.useCreateCaseMutation).mockReturnValue({ mutateAsync: mockMutateAsync } as any);
    vi.mocked(queries.useUpdateCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useDeleteCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useResetCasesMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);

    const { result } = renderHook(() => useCases(), { wrapper: createWrapper() });

    const payload = {
      slug: 'new-case',
      title: 'Новый кейс',
      city: 'Москва',
      date: '2024',
      format: 'Концерт',
      summary: 'Описание',
      services: ['led'],
    };

    const ok = await result.current.addCase(payload);

    expect(ok).toBe(false);
  });

  it('должен вызвать deleteCase и вернуть true при успехе', async () => {
    vi.clearAllMocks();
    const mockMutateAsync = vi.fn().mockResolvedValue({});
    vi.mocked(queries.useCasesQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(queries.useCreateCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useUpdateCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useDeleteCaseMutation).mockReturnValue({ mutateAsync: mockMutateAsync } as any);
    vi.mocked(queries.useResetCasesMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);

    const { result } = renderHook(() => useCases(), { wrapper: createWrapper() });

    const ok = await result.current.deleteCase('test-case');

    expect(ok).toBe(true);
    expect(mockMutateAsync).toHaveBeenCalledWith('test-case');
  });

  it('должен вызвать resetToDefault и вернуть true при успехе', async () => {
    vi.clearAllMocks();
    const mockMutateAsync = vi.fn().mockResolvedValue({});
    vi.mocked(queries.useCasesQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(queries.useCreateCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useUpdateCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useDeleteCaseMutation).mockReturnValue({ mutateAsync: vi.fn() } as any);
    vi.mocked(queries.useResetCasesMutation).mockReturnValue({ mutateAsync: mockMutateAsync } as any);

    const { result } = renderHook(() => useCases(), { wrapper: createWrapper() });

    const ok = await result.current.resetToDefault();

    expect(ok).toBe(true);
    expect(mockMutateAsync).toHaveBeenCalled();
  });

  it('supports editor-mode mapping and fallback flags for EN locale', () => {
    vi.clearAllMocks();
    mockBase({
      data: [
        {
          id: 1,
          slug: 'slug-1',
          title: 'Русский заголовок',
          title_en: null,
          city: 'Москва',
          city_en: null,
          date: '2025',
          date_en: null,
          format: 'Концерт',
          format_en: null,
          services: ['led'],
          summary: 'Описание',
          summary_en: null,
          metrics: '1000',
          metrics_en: null,
          images: null,
          videos: null,
          created_at: null,
          updated_at: null,
        },
      ],
    });

    const { result } = renderHook(() => useCases('en', true), { wrapper: createWrapper() });

    expect(result.current.fallbackBySlug['slug-1']).toBe(true);

    const editorCase = result.current.getEditorCase('slug-1');
    expect(editorCase).not.toBeNull();
    expect(editorCase?.title).toBe('');
    expect(result.current.getEditorCase('missing')).toBeNull();
  });

  it('returns true/false for updateCase based on mutation result', async () => {
    vi.clearAllMocks();
    const okMutate = vi.fn().mockResolvedValue({});
    mockBase({ updateMutate: okMutate });
    const okHook = renderHook(() => useCases(), { wrapper: createWrapper() });
    await expect(
      okHook.result.current.updateCase('slug-ok', { title: 'Updated', services: ['led'] }),
    ).resolves.toBe(true);
    expect(okMutate).toHaveBeenCalled();

    vi.clearAllMocks();
    const failMutate = vi.fn().mockRejectedValue(new Error('update failed'));
    mockBase({ updateMutate: failMutate });
    const failHook = renderHook(() => useCases(), { wrapper: createWrapper() });
    await expect(
      failHook.result.current.updateCase('slug-fail', { title: 'Broken' }),
    ).resolves.toBe(false);
  });

  it('returns false on delete/reset failures', async () => {
    vi.clearAllMocks();
    const deleteMutate = vi.fn().mockRejectedValue(new Error('delete failed'));
    const resetMutate = vi.fn().mockRejectedValue(new Error('reset failed'));
    mockBase({ deleteMutate, resetMutate });

    const { result } = renderHook(() => useCases(), { wrapper: createWrapper() });
    await expect(result.current.deleteCase('x')).resolves.toBe(false);
    await expect(result.current.resetToDefault()).resolves.toBe(false);
  });
});
