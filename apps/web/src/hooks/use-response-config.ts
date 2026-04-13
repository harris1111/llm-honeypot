import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../lib/api-client';

export function useResponseConfig(nodeId: string) {
  return useQuery({
    enabled: Boolean(nodeId),
    queryFn: () => apiClient.getResponseConfig(nodeId),
    queryKey: ['response-config', nodeId],
  });
}