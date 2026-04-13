import { describe, expect, it } from 'vitest';

import { getNodeRuntimeConfig } from '../src/config/node-runtime-config';

describe('getNodeRuntimeConfig', () => {
  it('advertises the phase 4 openai-compatible listeners with their default ports', () => {
    const config = getNodeRuntimeConfig({
      LLMTRAP_DASHBOARD_URL: 'http://dashboard.local',
      LLMTRAP_NODE_KEY: 'node-key-1234567890',
      REDIS_URL: 'redis://localhost:6379',
    });

    expect(config.textGenerationWebuiPort).toBe(5000);
    expect(config.langservePort).toBe(8000);
    expect(config.autoGptPort).toBe(8084);
    expect(config.lmStudioPort).toBe(1234);
    expect(config.llamaCppPort).toBe(8082);
    expect(config.vllmPort).toBe(8083);
    expect(config.serviceList).toEqual([
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
    ]);
  });
});