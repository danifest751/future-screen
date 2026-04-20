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
});
