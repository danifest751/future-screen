import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { useUserRole } from './useUserRole';

const getSessionMock = vi.fn();
const getUserMock = vi.fn();
const onAuthStateChangeMock = vi.fn();
const unsubscribeMock = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
      getUser: (...args: unknown[]) => getUserMock(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChangeMock(...args),
    },
  },
}));

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as User;
}

describe('useUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    onAuthStateChangeMock.mockReturnValue({
      data: { subscription: { unsubscribe: unsubscribeMock } },
    });
  });

  it('returns null user when there is no active session', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useUserRole());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.hasRole('viewer')).toBe(false);
  });

  it('resolves role from app_metadata.role', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: buildUser({
            email: 'admin@example.com',
            app_metadata: { role: 'admin' },
          }),
        },
      },
    });

    const { result } = renderHook(() => useUserRole());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user?.role).toBe('admin');
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.hasRole('editor')).toBe(true);
    expect(result.current.hasRole('admin')).toBe(true);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it('ignores user_metadata.role and defaults to viewer', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: buildUser({
            email: 'viewer@example.com',
            app_metadata: {},
            user_metadata: { role: 'admin' },
          }),
        },
      },
    });
    getUserMock.mockResolvedValue({
      data: {
        user: buildUser({
          email: 'viewer@example.com',
          app_metadata: {},
          user_metadata: { role: 'admin' },
        }),
      },
      error: null,
    });

    const { result } = renderHook(() => useUserRole());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user?.role).toBe('viewer');
    expect(result.current.isAdmin).toBe(false);
    expect(getUserMock).toHaveBeenCalledTimes(1);
  });

  it('refreshes canonical user and upgrades role from viewer to admin', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: buildUser({
            email: 'stale@example.com',
            app_metadata: {},
          }),
        },
      },
    });
    getUserMock.mockResolvedValue({
      data: {
        user: buildUser({
          email: 'stale@example.com',
          app_metadata: { role: 'admin' },
        }),
      },
      error: null,
    });

    const { result } = renderHook(() => useUserRole());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getUserMock).toHaveBeenCalledTimes(1);
    expect(result.current.user?.role).toBe('admin');
    expect(result.current.isAdmin).toBe(true);
  });
});
