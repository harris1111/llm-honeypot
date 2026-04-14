import { z } from 'zod';

export const manualBackfeedRequestSchema = z.object({
  category: z.string().trim().min(1).default('manual-backfeed'),
  keywords: z.array(z.string().trim().min(1)).max(12).optional(),
  nodeId: z.string().trim().min(1),
  prompt: z.string().trim().min(1),
  subcategory: z.string().trim().min(1).optional(),
});

export type ManualBackfeedInput = z.infer<typeof manualBackfeedRequestSchema>;