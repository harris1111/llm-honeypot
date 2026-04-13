import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../lib/api-client';

export function usePersonas() {
  return useQuery({
    queryFn: apiClient.getPersonas,
    queryKey: ['personas'],
  });
}