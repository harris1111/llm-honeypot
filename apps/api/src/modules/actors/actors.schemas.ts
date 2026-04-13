import { z } from 'zod';

export const mergeActorsRequestSchema = z.object({
  label: z.string().min(1).optional(),
  sourceActorIds: z.array(z.string().min(1)).min(2),
  targetActorId: z.string().min(1).optional(),
});

export const splitActorRequestSchema = z.object({
  label: z.string().min(1).optional(),
  sessionIds: z.array(z.string().min(1)).min(1),
});

export type MergeActorsRequest = typeof mergeActorsRequestSchema['_type'];
export type SplitActorRequest = typeof splitActorRequestSchema['_type'];