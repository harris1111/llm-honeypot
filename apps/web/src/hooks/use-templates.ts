import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient, type ManualBackfeedRequest } from '../lib/api-client';

export function useTemplates(reviewQueue = false) {
  return useQuery({
    queryFn: () => apiClient.getTemplates(reviewQueue),
    queryKey: ['templates', reviewQueue ? 'review-queue' : 'all'],
  });
}

export function useApproveTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => apiClient.approveTemplate(templateId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['templates'] }),
        queryClient.invalidateQueries({ queryKey: ['templates', 'review-queue'] }),
      ]);
    },
  });
}

export function useRejectTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => apiClient.rejectTemplate(templateId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['templates'] }),
        queryClient.invalidateQueries({ queryKey: ['templates', 'review-queue'] }),
      ]);
    },
  });
}

export function useManualBackfeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ManualBackfeedRequest) => apiClient.manualBackfeedTemplate(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['templates'] }),
        queryClient.invalidateQueries({ queryKey: ['templates', 'review-queue'] }),
      ]);
    },
  });
}