import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from './keys';
import {
  deleteVisualLedSession,
  loadVisualLedSession,
  loadVisualLedSessions,
} from '../services/visualLedLogs';

/**
 * Paginated list of sessions. Uses `keepPreviousData` so the UI keeps
 * the existing rows visible while the next page fetches.
 */
export function useVisualLedSessionsQuery(params: { limit: number; offset: number }) {
  return useQuery({
    queryKey: queryKeys.visualLedLogs.sessions(params.limit, params.offset),
    queryFn: () => loadVisualLedSessions(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

/**
 * Single session with events + assets. Cached per session-id.
 */
export function useVisualLedSessionQuery(sessionId: string | undefined) {
  return useQuery({
    queryKey: sessionId ? queryKeys.visualLedLogs.session(sessionId) : ['visual-led-session', 'noop'],
    queryFn: () => {
      if (!sessionId) throw new Error('Missing session id');
      return loadVisualLedSession(sessionId);
    },
    enabled: Boolean(sessionId),
    staleTime: 30_000,
  });
}

/**
 * Delete a session + its assets from storage. Invalidates both the
 * detail cache and every sessions-list page so the feed refreshes.
 */
export function useDeleteVisualLedSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => deleteVisualLedSession(sessionId),
    onSuccess: (_void, sessionId) => {
      queryClient.removeQueries({ queryKey: queryKeys.visualLedLogs.session(sessionId) });
      queryClient.invalidateQueries({ queryKey: ['visual-led-sessions'] });
    },
  });
}
