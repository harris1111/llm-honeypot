import { parseNodeEnv } from '@llmtrap/shared';
import type { ProtocolService } from '@llmtrap/shared';

export const NODE_RUNTIME_CONFIG = Symbol('NODE_RUNTIME_CONFIG');

export interface NodeRuntimeConfig {
  anthropicPort: number;
  autoGptPort: number;
  captureBatchSize: number;
  configRefreshIntervalMs: number;
  dashboardUrl: string;
  flushIntervalMs: number;
  heartbeatIntervalMs: number;
  langservePort: number;
  llamaCppPort: number;
  listenPort: number;
  lmStudioPort: number;
  maxBufferSize: number;
  nodeKey: string;
  openAiPort: number;
  redisUrl: string;
  serviceList: ProtocolService[];
  textGenerationWebuiPort: number;
  vllmPort: number;
  version: string;
}

function readPort(value: string | undefined, fallback: number): number {
  const parsedValue = Number(value);

  if (Number.isInteger(parsedValue) && parsedValue > 0) {
    return parsedValue;
  }

  return fallback;
}

export function getNodeRuntimeConfig(env: NodeJS.ProcessEnv = process.env): NodeRuntimeConfig {
  const parsed = parseNodeEnv(env);

  return {
    anthropicPort: readPort(env.ANTHROPIC_HTTP_PORT, 8081),
    autoGptPort: readPort(env.AUTOGPT_HTTP_PORT, 8084),
    captureBatchSize: 100,
    configRefreshIntervalMs: 300_000,
    dashboardUrl: parsed.LLMTRAP_DASHBOARD_URL,
    flushIntervalMs: 15_000,
    heartbeatIntervalMs: 30_000,
    langservePort: readPort(env.LANGSERVE_HTTP_PORT, 8000),
    llamaCppPort: readPort(env.LLAMACPP_HTTP_PORT, 8082),
    listenPort: parsed.NODE_HTTP_PORT,
    lmStudioPort: readPort(env.LM_STUDIO_HTTP_PORT, 1234),
    maxBufferSize: 100_000,
    nodeKey: parsed.LLMTRAP_NODE_KEY,
    openAiPort: readPort(env.OPENAI_HTTP_PORT, 8080),
    redisUrl: parsed.REDIS_URL,
    serviceList: [
      'ollama',
      'openai',
      'anthropic',
      'lm-studio',
      'llamacpp',
      'vllm',
      'text-generation-webui',
      'langserve',
      'autogpt',
      'mcp',
      'ide-configs',
    ],
    textGenerationWebuiPort: readPort(env.TEXT_GENERATION_WEBUI_HTTP_PORT, 5000),
    vllmPort: readPort(env.VLLM_HTTP_PORT, 8083),
    version: '0.1.0',
  };
}