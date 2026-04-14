import { z } from 'zod';

const portSchema = z.coerce.number().int().positive().max(65_535);
const optionalBooleanSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return String(value).toLowerCase() === 'true';
}, z.boolean().optional());
const optionalStringSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().min(1).optional(),
);
const optionalUrlSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().url().optional(),
);

const baseEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  S3_ACCESS_KEY_ID: optionalStringSchema,
  S3_BUCKET: optionalStringSchema,
  S3_ENDPOINT: optionalUrlSchema,
  S3_FORCE_PATH_STYLE: optionalBooleanSchema,
  S3_REGION: optionalStringSchema,
  S3_SECRET_ACCESS_KEY: optionalStringSchema,
});

export const apiEnvSchema = baseEnvSchema.extend({
  API_PORT: portSchema.default(4000),
  JWT_SECRET: z.string().min(32),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
});

export const workerEnvSchema = baseEnvSchema.extend({
  WORKER_ALERT_WEBHOOK_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  WORKER_ALERT_WEBHOOK_URL: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().url().optional(),
  ),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(4),
  WORKER_PORT: portSchema.default(4100),
});

export const nodeEnvSchema = z.object({
  ANTHROPIC_HTTP_PORT: portSchema.default(8081),
  AUTOGPT_HTTP_PORT: portSchema.default(8084),
  CHROMADB_HTTP_PORT: portSchema.default(8085),
  DNS_PORT: portSchema.default(1053),
  FTP_PORT: portSchema.default(10021),
  GITEA_HTTP_PORT: portSchema.default(3001),
  GRAFANA_HTTP_PORT: portSchema.default(3002),
  HOME_ASSISTANT_HTTP_PORT: portSchema.default(8123),
  LLAMACPP_HTTP_PORT: portSchema.default(8082),
  LLMTRAP_DASHBOARD_URL: z.string().url(),
  LLMTRAP_NODE_KEY: z.string().min(1),
  LANGSERVE_HTTP_PORT: portSchema.default(8000),
  LM_STUDIO_HTTP_PORT: portSchema.default(1234),
  MILVUS_HTTP_PORT: portSchema.default(19530),
  NEO4J_HTTP_PORT: portSchema.default(7474),
  NODE_HTTP_PORT: portSchema.default(11434),
  OPENAI_HTTP_PORT: portSchema.default(8080),
  OPENAI_COMPAT_API_KEY: z.string().min(1).optional(),
  OPENAI_COMPAT_BASE_URL: z.string().url().optional(),
  OPENAI_COMPAT_MODEL: z.string().min(1).optional(),
  PLEX_HTTP_PORT: portSchema.default(32400),
  PORTAINER_HTTP_PORT: portSchema.default(9000),
  PROMETHEUS_HTTP_PORT: portSchema.default(9090),
  PROWLARR_HTTP_PORT: portSchema.default(9696),
  QDRANT_HTTP_PORT: portSchema.default(6333),
  RADARR_HTTP_PORT: portSchema.default(7878),
  REDIS_URL: z.string().url(),
  SMB_PORT: portSchema.default(10445),
  SMTP_PORT: portSchema.default(10025),
  SMTP_SUBMISSION_PORT: portSchema.default(10587),
  SONARR_HTTP_PORT: portSchema.default(8989),
  SSH_PORT: portSchema.default(10022),
  TELNET_PORT: portSchema.default(10023),
  TEXT_GENERATION_WEBUI_HTTP_PORT: portSchema.default(5000),
  UPTIME_KUMA_HTTP_PORT: portSchema.default(3003),
  VLLM_HTTP_PORT: portSchema.default(8083),
  WEAVIATE_HTTP_PORT: portSchema.default(8086),
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