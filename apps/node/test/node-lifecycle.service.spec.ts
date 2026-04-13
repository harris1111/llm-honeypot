import type {
  NodeConfig,
  NodeRegistrationResponse,
  NodeRecord,
  PersonaDefinition,
} from '@llmtrap/shared';
import { Logger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CaptureSyncService } from '../src/capture/capture-sync.service';
import type { NodeRuntimeConfig } from '../src/config/node-runtime-config';
import { RuntimeStateService } from '../src/runtime/runtime-state.service';
import type { DashboardApiService } from '../src/sync/dashboard-api.service';
import { NodeLifecycleService } from '../src/sync/node-lifecycle.service';

type RuntimeStateStore = {
  config: Record<string, unknown>;
  lastSyncError: string | null;
  node: NodeRecord | null;
  persona: PersonaDefinition | null;
  requestCount: number;
};

type LifecycleInternals = {
  ensureRegistered: () => Promise<boolean>;
  runConfigCycle: () => Promise<void>;
  runFlushCycle: () => Promise<void>;
  runHeartbeatCycle: () => Promise<void>;
};

const config: NodeRuntimeConfig = {
  anthropicPort: 8081,
  autoGptPort: 8084,
  captureBatchSize: 100,
  configRefreshIntervalMs: 300_000,
  dashboardUrl: 'http://dashboard.local',
  flushIntervalMs: 15_000,
  heartbeatIntervalMs: 30_000,
  homelabPorts: {
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
  },
  langservePort: 8000,
  llamaCppPort: 8082,
  listenPort: 8080,
  lmStudioPort: 1234,
  maxBufferSize: 100_000,
  nodeKey: 'node-key-1234567890',
  openAiPort: 8080,
  ragPorts: {
    chromadb: 8085,
    milvus: 19530,
    neo4j: 7474,
    qdrant: 6333,
    weaviate: 8086,
  },
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
      'dns',
      'smb',
      'telnet',
  ],
  traditionalPorts: {
    dns: 1053,
    ftp: 10021,
    smb: 10445,
    smtp: 10025,
    smtpSubmission: 10587,
    ssh: 10022,
    telnet: 10023,
  },
  textGenerationWebuiPort: 5000,
  vllmPort: 8083,
  version: '0.1.0',
};

function resetRuntimeState(): void {
  (RuntimeStateService as unknown as { store: RuntimeStateStore }).store = {
    config: {},
    lastSyncError: null,
    node: null,
    persona: null,
    requestCount: 0,
  };
}

function readLastSyncError(): string | null {
  return (RuntimeStateService as unknown as { store: RuntimeStateStore }).store.lastSyncError;
}

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

function createPersona(name = 'Research Node'): PersonaDefinition {
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
    name,
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

function createNodeConfig(personaName = 'Research Node'): NodeConfig {
  return {
    config: {
      maxConcurrency: 8,
    },
    node: createNode(),
    persona: createPersona(personaName),
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

describe('NodeLifecycleService', () => {
  beforeEach(() => {
    resetRuntimeState();
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetRuntimeState();
  });

  function createService(overrides: {
    captureSyncService?: Partial<CaptureSyncService>;
    dashboardApiService?: Partial<DashboardApiService>;
  } = {}) {
    const captureSyncService = {
      flushPending: vi.fn().mockResolvedValue(0),
      size: vi.fn().mockResolvedValue(0),
      ...overrides.captureSyncService,
    } as CaptureSyncService;
    const dashboardApiService = {
      fetchNodeConfig: vi.fn().mockResolvedValue(createNodeConfig('Updated Persona')),
      registerNode: vi.fn().mockResolvedValue(createRegistrationResponse()),
      sendHeartbeat: vi.fn().mockResolvedValue(undefined),
      ...overrides.dashboardApiService,
    } as DashboardApiService;
    const runtimeStateService = new RuntimeStateService();
    const service = new NodeLifecycleService(
      captureSyncService,
      dashboardApiService,
      runtimeStateService,
      config,
    );

    return {
      captureSyncService,
      dashboardApiService,
      runtimeStateService,
      service,
    };
  }

  it('registers the node once and reuses the online state on later cycles', async () => {
    const { dashboardApiService, runtimeStateService, service } = createService();
    const lifecycle = service as unknown as LifecycleInternals;

    await expect(lifecycle.ensureRegistered()).resolves.toBe(true);
    await expect(lifecycle.ensureRegistered()).resolves.toBe(true);

    expect(dashboardApiService.registerNode).toHaveBeenCalledTimes(1);
    expect(runtimeStateService.getNodeId()).toBe('node-123');
    expect(readLastSyncError()).toBeNull();
  });

  it('refreshes node config after registration and applies the latest persona', async () => {
    const nextConfig = createNodeConfig('Fresh Persona');
    const { dashboardApiService, runtimeStateService, service } = createService({
      dashboardApiService: {
        fetchNodeConfig: vi.fn().mockResolvedValue(nextConfig),
      },
    });
    const lifecycle = service as unknown as LifecycleInternals;

    runtimeStateService.markSyncError(new Error('stale config'));

    await lifecycle.runConfigCycle();

    expect(dashboardApiService.registerNode).toHaveBeenCalledTimes(1);
    expect(dashboardApiService.fetchNodeConfig).toHaveBeenCalledWith('node-123');
    expect(runtimeStateService.getConfig()).toEqual(nextConfig.config);
    expect(runtimeStateService.getPersona()?.name).toBe('Fresh Persona');
    expect(readLastSyncError()).toBeNull();
  });

  it('sends heartbeats for registered nodes and records dashboard failures', async () => {
    const { captureSyncService, dashboardApiService, service } = createService({
      captureSyncService: {
        size: vi.fn().mockResolvedValue(7),
      },
      dashboardApiService: {
        sendHeartbeat: vi.fn().mockRejectedValue(new Error('heartbeat rejected')),
      },
    });
    const lifecycle = service as unknown as LifecycleInternals;

    await lifecycle.runHeartbeatCycle();

    expect(dashboardApiService.registerNode).toHaveBeenCalledTimes(1);
    expect(captureSyncService.size).toHaveBeenCalledTimes(1);
    expect(dashboardApiService.sendHeartbeat).toHaveBeenCalledTimes(1);
    expect(dashboardApiService.sendHeartbeat).toHaveBeenCalledWith(
      'node-123',
      expect.objectContaining({
        bufferSize: 7,
        nodeId: 'node-123',
        requestCount: 0,
      }),
    );
    expect(readLastSyncError()).toBe('heartbeat rejected');
  });

  it('clears prior sync errors when buffered captures flush successfully', async () => {
    const { captureSyncService, service } = createService({
      captureSyncService: {
        flushPending: vi.fn().mockResolvedValue(2),
      },
    });
    const lifecycle = service as unknown as LifecycleInternals;

    new RuntimeStateService().markSyncError(new Error('buffer backlog'));

    await lifecycle.runFlushCycle();

    expect(captureSyncService.flushPending).toHaveBeenCalledTimes(1);
    expect(readLastSyncError()).toBeNull();
  });
});