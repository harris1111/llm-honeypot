import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../lib/api-client';

export function useLiveFeed(enabled: boolean) {
  return useQuery({
    queryFn: apiClient.getLiveFeedEvents,
    queryKey: ['live-feed'],
    refetchInterval: enabled ? 15_000 : false,
  });
}