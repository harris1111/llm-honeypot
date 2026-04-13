import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../lib/api-client';

export function useExportData(format = 'json', days = 7) {
  return useQuery({
    queryFn: () => apiClient.getExportData(format, days),
    queryKey: ['export', 'data', format, days],
  });
}

export function useExportReport(format = 'markdown', days = 7) {
  return useQuery({
    queryFn: () => apiClient.getExportReport(format, days),
    queryKey: ['export', 'report', format, days],
  });
}