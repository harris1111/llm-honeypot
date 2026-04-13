import type { CreateNodeRequest, UpdateNodeRequest } from '@llmtrap/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../lib/api-client';

export function useNodes() {
  return useQuery({
    queryFn: apiClient.getNodes,
    queryKey: ['nodes'],
  });
}

export function useNode(nodeId: string) {
  return useQuery({
    enabled: Boolean(nodeId),
    queryFn: () => apiClient.getNode(nodeId),
    queryKey: ['nodes', nodeId],
  });
}

export function useCreateNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNodeRequest) => apiClient.createNode(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['nodes'] });
    },
  });
}

export function useUpdateNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, nodeId }: { input: UpdateNodeRequest; nodeId: string }) => apiClient.updateNode(nodeId, input),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['nodes'] }),
        queryClient.invalidateQueries({ queryKey: ['nodes', variables.nodeId] }),
      ]);
    },
  });
}

export function useApproveNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nodeId: string) => apiClient.approveNode(nodeId),
    onSuccess: async (_, nodeId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['nodes'] }),
        queryClient.invalidateQueries({ queryKey: ['nodes', nodeId] }),
      ]);
    },
  });
}