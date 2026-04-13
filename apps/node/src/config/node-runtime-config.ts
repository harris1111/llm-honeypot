import { parseNodeEnv } from '@llmtrap/shared';

export const NODE_RUNTIME_CONFIG = Symbol('NODE_RUNTIME_CONFIG');

export interface NodeRuntimeConfig {
  anthropicPort: number;
  captureBatchSize: number;
  configRefreshIntervalMs: number;
  dashboardUrl: string;
  flushIntervalMs: number;
  heartbeatIntervalMs: number;
  listenPort: number;
  maxBufferSize: number;
  nodeKey: string;
  openAiPort: number;
  redisUrl: string;
  serviceList: string[];
  version: string;
}

export function getNodeRuntimeConfig(env: NodeJS.ProcessEnv = process.env): NodeRuntimeConfig {
  const parsed = parseNodeEnv(env);

  return {
    anthropicPort: Number(env.ANTHROPIC_HTTP_PORT ?? 8081),
    captureBatchSize: 100,
    configRefreshIntervalMs: 300_000,
    dashboardUrl: parsed.LLMTRAP_DASHBOARD_URL,
    flushIntervalMs: 15_000,
    heartbeatIntervalMs: 30_000,
    listenPort: parsed.NODE_HTTP_PORT,
    maxBufferSize: 100_000,
    nodeKey: parsed.LLMTRAP_NODE_KEY,
    openAiPort: Number(env.OPENAI_HTTP_PORT ?? 8080),
    redisUrl: parsed.REDIS_URL,
    serviceList: ['ollama', 'openai', 'anthropic'],
    version: '0.1.0',
  };
}