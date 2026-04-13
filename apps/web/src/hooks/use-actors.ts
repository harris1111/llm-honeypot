import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../lib/api-client';

export function useActors() {
  return useQuery({
    queryFn: apiClient.getActors,
    queryKey: ['actors'],
  });
}