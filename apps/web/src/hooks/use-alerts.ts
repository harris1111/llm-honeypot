import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../lib/api-client';

export function useAlertLogs() {
  return useQuery({
    queryFn: apiClient.getAlertLogs,
    queryKey: ['alerts', 'logs'],
  });
}

export function useAlertRules() {
  return useQuery({
    queryFn: apiClient.getAlertRules,
    queryKey: ['alerts', 'rules'],
  });
}