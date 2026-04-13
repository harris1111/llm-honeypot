import { z } from 'zod';

import { personaDefinitionSchema } from './persona-contract';

export const nodeStatusSchema = z.enum(['PENDING', 'ONLINE', 'OFFLINE', 'DISABLED']);

export const nodeServiceToggleSchema = z.record(z.string(), z.boolean());

export const createNodeRequestSchema = z.object({
  config: z.record(z.string(), z.unknown()).optional(),
  hostname: z.string().min(1).optional(),
  name: z.string().min(1),
  personaId: z.string().min(1).optional().nullable(),
  publicIp: z.string().min(1).optional(),
});

export const updateNodeRequestSchema = z.object({
  config: z.record(z.string(), z.unknown()).optional(),
  hostname: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  personaId: z.string().min(1).optional().nullable(),
  publicIp: z.string().min(1).optional(),
  status: nodeStatusSchema.optional(),
});

export const nodeRecordSchema = z.object({
  config: z.record(z.string(), z.unknown()).nullable().optional(),
  hostname: z.string().nullable().optional(),
  id: z.string().min(1),
  lastHeartbeat: z.string().datetime().nullable().optional(),
  name: z.string().min(1),
  nodeKeyPrefix: z.string().min(1),
  personaId: z.string().nullable().optional(),
  publicIp: z.string().nullable().optional(),
  status: nodeStatusSchema,
});

export const nodeRegistrationRequestSchema = z.object({
  hostname: z.string().min(1),
  nodeKey: z.string().min(16),
  publicIp: z.string().min(1).optional(),
  services: z.array(z.string().min(1)).default([]),
  version: z.string().min(1).optional(),
});

export const nodeHeartbeatSchema = z.object({
  bufferSize: z.number().int().nonnegative().default(0),
  nodeId: z.string().min(1),
  receivedAt: z.string().datetime(),
  requestCount: z.number().int().nonnegative().default(0),
});

export const nodeConfigSchema = z.object({
  config: z.record(z.string(), z.unknown()).default({}),
  node: nodeRecordSchema,
  persona: personaDefinitionSchema.nullable(),
  services: nodeServiceToggleSchema.default({}),
});

export const nodeRegistrationResponseSchema = z.object({
  autoApproved: z.boolean(),
  config: nodeConfigSchema.nullable(),
  node: nodeRecordSchema,
});

export type CreateNodeRequest = z.infer<typeof createNodeRequestSchema>;

export type NodeConfig = z.infer<typeof nodeConfigSchema>;

export type NodeHeartbeat = z.infer<typeof nodeHeartbeatSchema>;

export type NodeRecord = z.infer<typeof nodeRecordSchema>;

export type NodeRegistrationRequest = z.infer<typeof nodeRegistrationRequestSchema>;

export type NodeRegistrationResponse = z.infer<typeof nodeRegistrationResponseSchema>;

export type UpdateNodeRequest = z.infer<typeof updateNodeRequestSchema>;