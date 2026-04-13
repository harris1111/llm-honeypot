import { z } from 'zod';

export const responseConfigSchema = z.object({
  backfeed: z.object({
    autoApprove: z.boolean().default(false),
    budgetLimitUsd: z.number().nonnegative().default(2),
    enabled: z.boolean().default(false),
    maxPerDay: z.number().int().positive().default(100),
  }).default({}),
  budget: z.object({
    alertAt: z.array(z.number().min(0).max(1)).default([0.8, 0.95, 1]),
    monthlyLimitUsd: z.number().nonnegative().default(5),
  }).default({}),
  fixedN: z.object({
    n: z.number().int().positive().default(3),
    resetPeriod: z.enum(['never', 'daily', 'weekly']).default('never'),
  }).default({}),
  proxy: z.object({
    apiKey: z.string().default(''),
    baseUrl: z.string().default(''),
    maxRetries: z.number().int().nonnegative().default(2),
    model: z.string().default(''),
    systemPrompt: z.string().default(''),
    timeoutMs: z.number().int().positive().default(30000),
  }).default({}),
  smart: z.object({
    confidenceThreshold: z.number().min(0).max(1).default(0.7),
    validationPatterns: z.array(z.string()).default(['what model are you', '2+2', 'capital of france']),
  }).default({}),
  strategyChain: z.array(z.enum(['smart', 'fixed_n', 'budget'])).default(['smart', 'fixed_n', 'budget']),
});

export type ResponseConfigRecord = typeof responseConfigSchema['_type'];