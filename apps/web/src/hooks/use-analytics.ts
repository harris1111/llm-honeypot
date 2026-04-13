import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../lib/api-client';

export function useAnalyticsOverview() {
  return useQuery({
    queryFn: apiClient.getAnalyticsOverview,
    queryKey: ['analytics', 'overview'],
  });
}