import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../lib/api-client';

export function useSessions() {
  return useQuery({
    queryFn: apiClient.getSessions,
    queryKey: ['sessions'],
  });
}

export function useSession(sessionId: string) {
  return useQuery({
    enabled: Boolean(sessionId),
    queryFn: () => apiClient.getSession(sessionId),
    queryKey: ['sessions', sessionId],
  });
}