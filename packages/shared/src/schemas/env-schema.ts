import { z } from 'zod';

const baseEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
});

export const apiEnvSchema = baseEnvSchema.extend({
  API_PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(32),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
});

export const workerEnvSchema = baseEnvSchema.extend({
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(4),
  WORKER_PORT: z.coerce.number().int().positive().default(4100),
});

export const nodeEnvSchema = z.object({
  LLMTRAP_DASHBOARD_URL: z.string().url(),
  LLMTRAP_NODE_KEY: z.string().min(1),
  NODE_HTTP_PORT: z.coerce.number().int().positive().default(11434),
  OPENAI_COMPAT_API_KEY: z.string().min(1).optional(),
  OPENAI_COMPAT_BASE_URL: z.string().url().optional(),
  OPENAI_COMPAT_MODEL: z.string().min(1).optional(),
  REDIS_URL: z.string().url(),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export type NodeEnv = z.infer<typeof nodeEnvSchema>;

export function parseApiEnv(env: NodeJS.ProcessEnv): ApiEnv {
  return apiEnvSchema.parse(env);
}

export function parseWorkerEnv(env: NodeJS.ProcessEnv): WorkerEnv {
  return workerEnvSchema.parse(env);
}

export function parseNodeEnv(env: NodeJS.ProcessEnv): NodeEnv {
  return nodeEnvSchema.parse(env);
}