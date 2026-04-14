import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../lib/api-client';

export function useArchive(archiveId: string | null, previewLines?: number) {
  return useQuery({
    enabled: Boolean(archiveId),
    queryFn: () => apiClient.getArchive(archiveId ?? '', previewLines),
    queryKey: ['export', 'archive', archiveId, previewLines ?? null],
  });
}

export function useExportArchives() {
  return useQuery({
    queryFn: () => apiClient.getExportArchives(),
    queryKey: ['export', 'archives'],
  });
}

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