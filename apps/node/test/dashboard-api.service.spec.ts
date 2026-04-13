import type {
  CaptureRecord,
  NodeConfig,
  NodeHeartbeat,
  NodeRegistrationResponse,
  NodeRecord,
  PersonaDefinition,
} from '@llmtrap/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { NodeRuntimeConfig } from '../src/config/node-runtime-config';
import { DashboardApiService } from '../src/sync/dashboard-api.service';

const config: NodeRuntimeConfig = {
  anthropicPort: 8081,
  autoGptPort: 8084,
  captureBatchSize: 100,
  configRefreshIntervalMs: 300_000,
  dashboardUrl: 'http://dashboard.local',
  flushIntervalMs: 15_000,
  heartbeatIntervalMs: 30_000,
  langservePort: 8000,
  llamaCppPort: 8082,
  listenPort: 8080,
  lmStudioPort: 1234,
  maxBufferSize: 100_000,
  nodeKey: 'node-key-1234567890',
  openAiPort: 8080,
  redisUrl: 'redis://localhost:6379',
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
  textGenerationWebuiPort: 5000,
  vllmPort: 8083,
  version: '0.1.0',
};

function createNode(status: NodeRecord['status'] = 'ONLINE'): NodeRecord {
  return {
    config: { mode: 'aggressive' },
    hostname: 'trap-node-01',
    id: 'node-123',
    lastHeartbeat: '2026-04-13T09:30:00.000Z',
    name: 'Trap Node 01',
    nodeKeyPrefix: 'node-key',
    personaId: 'persona-123',
    publicIp: '192.0.2.10',
    status,
  };
}

function createPersona(): PersonaDefinition {
  return {
    configFiles: {
      '.bash_history': true,
    },
    credentials: {
      openai: 'sk-test',
    },
    hardware: {
      cpu: 'AMD EPYC',
      diskGb: 512,
      gpu: 'NVIDIA L4',
      ramGb: 64,
      vramGb: 24,
    },
    identity: {
      hostname: 'trap-node-01',
      kernel: '6.8.0',
      os: 'Ubuntu 24.04',
      sshBanner: 'OpenSSH_9.6p1 Ubuntu-3ubuntu13.8',
      username: 'operator',
    },
    models: [
      {
        family: 'llama',
        name: 'llama-3.1',
        parameterSize: '8B',
        sizeGb: 4.7,
      },
    ],
    name: 'Research Node',
    preset: 'default',
    services: {
      anthropic: true,
      ollama: true,
      openai: true,
    },
    timing: {
      gpuUtilizationPct: [3, 17],
      loadAverage: [0.12, 0.18, 0.31],
      uptimeDays: [3, 14],
    },
  };
}

function createNodeConfig(): NodeConfig {
  return {
    config: {
      maxConcurrency: 8,
    },
    node: createNode(),
    persona: createPersona(),
    services: {
      anthropic: true,
      openai: true,
    },
  };
}

function createRegistrationResponse(): NodeRegistrationResponse {
  const nextConfig = createNodeConfig();

  return {
    autoApproved: true,
    config: nextConfig,
    node: nextConfig.node,
  };
}

describe('DashboardApiService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('registers the node with dashboard metadata', async () => {
    const response = createRegistrationResponse();
    const fetchMock = vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ data: response, error: null }), {
        status: 201,
      }),
    );
    const service = new DashboardApiService(config);

    await expect(service.registerNode()).resolves.toEqual(response);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('http://dashboard.local/api/v1/nodes/register');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({
      'content-type': 'application/json',
    });
    expect(JSON.parse(String(init?.body))).toMatchObject({
      hostname: expect.any(String),
      nodeKey: config.nodeKey,
      services: config.serviceList,
      version: config.version,
    });
  });

  it('fetches node config with the node key header', async () => {
    const response = createNodeConfig();
    const fetchMock = vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ data: response, error: null }), {
        status: 200,
      }),
    );
    const service = new DashboardApiService(config);

    await expect(service.fetchNodeConfig('node-123')).resolves.toEqual(response);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('http://dashboard.local/api/v1/nodes/node-123/config');
    expect(init?.headers).toEqual({
      'x-node-key': config.nodeKey,
    });
  });

  it('surfaces dashboard error messages for heartbeat failures', async () => {
    const heartbeat: NodeHeartbeat = {
      bufferSize: 4,
      nodeId: 'node-123',
      receivedAt: '2026-04-13T09:30:00.000Z',
      requestCount: 9,
    };
    const fetchMock = vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ data: null, error: { message: 'dashboard unavailable' } }), {
        status: 503,
        statusText: 'Service Unavailable',
      }),
    );
    const service = new DashboardApiService(config);

    await expect(service.sendHeartbeat('node-123', heartbeat)).rejects.toThrow('dashboard unavailable');

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('http://dashboard.local/api/v1/nodes/node-123/heartbeat');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({
      'content-type': 'application/json',
      'x-node-key': config.nodeKey,
    });
    expect(JSON.parse(String(init?.body))).toEqual(heartbeat);
  });

  it('uploads capture batches with the node id payload', async () => {
    const records: CaptureRecord[] = [
      {
        classification: 'attacker',
        headerHash: 'header-hash-123',
        headers: { authorization: 'Bearer token' },
        method: 'POST',
        path: '/v1/chat/completions',
        protocol: 'openai',
        requestBody: { model: 'gpt-4' },
        responseCode: 200,
        responseStrategy: 'static',
        service: 'openai-http',
        sourceIp: '203.0.113.10',
        sourcePort: 44321,
        timestamp: '2026-04-13T09:30:00.000Z',
        userAgent: 'curl/8.4.0',
      },
    ];
    const fetchMock = vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ data: null, error: null }), {
        status: 202,
      }),
    );
    const service = new DashboardApiService(config);

    await expect(service.uploadCaptures('node-123', records)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('http://dashboard.local/api/v1/capture/batch');
    expect(JSON.parse(String(init?.body))).toEqual({
      nodeId: 'node-123',
      records,
    });
  });
});