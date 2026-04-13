import { z } from 'zod';

export const alertRuleSchema = z.object({
  channels: z.array(z.string().min(1)).default([]),
  conditions: z.record(z.string(), z.unknown()).default({}),
  cooldownMin: z.number().int().positive().default(5),
  enabled: z.boolean().default(true),
  name: z.string().min(1),
  severity: z.enum(['info', 'warning', 'critical']),
});

export type AlertRuleInput = typeof alertRuleSchema['_type'];