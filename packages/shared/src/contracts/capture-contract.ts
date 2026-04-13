import { z } from 'zod';

export const attackClassificationSchema = z.enum([
  'free_rider',
  'scanner',
  'config_hunter',
  'attacker',
  'mcp_prober',
  'validator',
  'unknown',
]);

export const captureRecordSchema = z.object({
  classification: attackClassificationSchema.optional(),
  geo: z.record(z.string(), z.unknown()).optional(),
  headerHash: z.string().min(1).optional(),
  headers: z.record(z.string(), z.unknown()).optional(),
  method: z.string().min(1),
  path: z.string().min(1).optional(),
  protocol: z.string().min(1),
  requestBody: z.unknown().optional(),
  responseBody: z.unknown().optional(),
  responseCode: z.number().int().nonnegative().optional(),
  responseStrategy: z.enum(['static', 'template', 'real_model']).optional(),
  service: z.string().min(1),
  sourceIp: z.string().min(1),
  sourcePort: z.number().int().nonnegative().optional(),
  timestamp: z.string().datetime(),
  tlsFingerprint: z.string().min(1).optional(),
  userAgent: z.string().min(1).optional(),
});

export const captureBatchRequestSchema = z.object({
  nodeId: z.string().min(1),
  records: z.array(captureRecordSchema).min(1).max(500),
});

export type CaptureBatchRequest = z.infer<typeof captureBatchRequestSchema>;

export type CaptureRecord = z.infer<typeof captureRecordSchema>;