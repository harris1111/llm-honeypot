import { describe, expect, it } from 'vitest';

import { getNodeRuntimeConfig } from '../src/config/node-runtime-config';

describe('getNodeRuntimeConfig', () => {
  it('advertises the complete phase 4 listener inventory with rootless-safe defaults', () => {
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
    expect(config.ragPorts).toEqual({
      chromadb: 8085,
      milvus: 19530,
      neo4j: 7474,
      qdrant: 6333,
      weaviate: 8086,
    });
    expect(config.homelabPorts).toEqual({
      gitea: 3001,
      grafana: 3002,
      'home-assistant': 8123,
      plex: 32400,
      portainer: 9000,
      prometheus: 9090,
      prowlarr: 9696,
      radarr: 7878,
      sonarr: 8989,
      'uptime-kuma': 3003,
    });
    expect(config.traditionalPorts).toEqual({
      dns: 1053,
      ftp: 10021,
      smb: 10445,
      smtp: 10025,
      smtpSubmission: 10587,
      ssh: 10022,
      telnet: 10023,
    });
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
      'qdrant',
      'chromadb',
      'neo4j',
      'weaviate',
      'milvus',
      'plex',
      'sonarr',
      'radarr',
      'prowlarr',
      'portainer',
      'home-assistant',
      'gitea',
      'grafana',
      'prometheus',
      'uptime-kuma',
      'ssh',
      'ftp',
      'smtp',
      'smtp-submission',
      'dns',
      'smb',
      'telnet',
    ]);
  });

  it('throws when a listener port is outside the valid TCP/UDP range', () => {
    expect(() =>
      getNodeRuntimeConfig({
        LLMTRAP_DASHBOARD_URL: 'http://dashboard.local',
        LLMTRAP_NODE_KEY: 'node-key-1234567890',
        OPENAI_HTTP_PORT: '70000',
        REDIS_URL: 'redis://localhost:6379',
      }),
    ).toThrow(/OPENAI_HTTP_PORT/);
  });

  it('throws when two listener families are configured to the same port', () => {
    expect(() =>
      getNodeRuntimeConfig({
        LLMTRAP_DASHBOARD_URL: 'http://dashboard.local',
        LLMTRAP_NODE_KEY: 'node-key-1234567890',
        OPENAI_HTTP_PORT: '11434',
        REDIS_URL: 'redis://localhost:6379',
      }),
    ).toThrow('Port 11434 is assigned to both node-http and openai');
  });
});