import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { UserWithRole } from '../context/AuthContext';
import { useUserRole } from './useUserRole';

const useAuthMock = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

const mkUser = (role: UserWithRole['role']): UserWithRole => ({
  id: 'user-1',
  email: 'admin@example.com',
  role,
});

describe('useUserRole', () => {
  it('returns null when AuthContext has no user', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false, error: null, reload: vi.fn() });
    const { result } = renderHook(() => useUserRole());
    expect(result.current.user).toBeNull();
    expect(result.current.hasRole('viewer')).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  it('admin has all roles', () => {
    useAuthMock.mockReturnValue({ user: mkUser('admin'), isLoading: false, error: null, reload: vi.fn() });
    const { result } = renderHook(() => useUserRole());
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isEditor).toBe(true);
    expect(result.current.hasRole('viewer')).toBe(true);
  });

  it('editor — НЕ admin, но editor и viewer', () => {
    useAuthMock.mockReturnValue({ user: mkUser('editor'), isLoading: false, error: null, reload: vi.fn() });
    const { result } = renderHook(() => useUserRole());
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isEditor).toBe(true);
    expect(result.current.hasRole('viewer')).toBe(true);
  });

  it('viewer — только viewer', () => {
    useAuthMock.mockReturnValue({ user: mkUser('viewer'), isLoading: false, error: null, reload: vi.fn() });
    const { result } = renderHook(() => useUserRole());
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isEditor).toBe(false);
    expect(result.current.hasRole('viewer')).toBe(true);
  });

  it('пробрасывает loading и error из AuthContext', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: true, error: 'boom', reload: vi.fn() });
    const { result } = renderHook(() => useUserRole());
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe('boom');
  });
});
