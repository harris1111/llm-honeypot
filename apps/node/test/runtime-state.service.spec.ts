import { defaultResponseConfig } from '@llmtrap/shared';
import { beforeEach, describe, expect, it } from 'vitest';

import { RuntimeStateService } from '../src/runtime/runtime-state.service';

const baseNode = {
  id: 'node-1',
  name: 'node-1',
  nodeKeyPrefix: 'llt_node_1',
  status: 'ONLINE',
} as const;

const baseConfig = {
  config: { strategy: 'template' },
  node: baseNode,
  persona: null,
  services: { ollama: true },
} as const;

function resetRuntimeState(): void {
  const store = (RuntimeStateService as unknown as {
    store: {
      config: Record<string, unknown>;
      lastSyncError: string | null;
      node: unknown;
      persona: unknown;
      requestCount: number;
    };
  }).store;

  store.config = {};
  store.lastSyncError = null;
  store.node = null;
  store.persona = null;
  store.requestCount = 0;
}

describe('RuntimeStateService', () => {
  beforeEach(() => {
    resetRuntimeState();
  });

  it('applies registration and config into shared runtime state', () => {
    const service = new RuntimeStateService();

    service.applyRegistration({
      autoApproved: true,
      config: baseConfig,
      node: baseNode,
    });

    expect(service.getNode()).toEqual(baseNode);
    expect(service.getConfig()).toEqual({ strategy: 'template' });
    expect(service.getPersona()).toBeNull();
    expect(service.getStatus()).toBe('ONLINE');
  });

  it('builds a heartbeat only after the node is registered', () => {
    const service = new RuntimeStateService();

    expect(() => service.buildHeartbeat(2)).toThrow('Node is not registered');

    service.applyRegistration({
      autoApproved: true,
      config: baseConfig,
      node: baseNode,
    });
    service.incrementRequestCount();
    service.incrementRequestCount();

    const heartbeat = service.buildHeartbeat(4);

    expect(heartbeat.nodeId).toBe('node-1');
    expect(heartbeat.bufferSize).toBe(4);
    expect(heartbeat.requestCount).toBe(2);
    expect(new Date(heartbeat.receivedAt).toString()).not.toBe('Invalid Date');
  });

  it('tracks sync errors and reports booting health before registration', () => {
    const service = new RuntimeStateService();

    service.markSyncError(new Error('dashboard unavailable'));

    expect(service.getStatus()).toBe('BOOTING');
    expect(service.getHealth(7)).toMatchObject({
      bufferSize: 7,
      service: 'node',
      status: 'BOOTING',
    });

    service.clearSyncError();

    expect(service.getNodeId()).toBeNull();
  });

  it('parses response config from node config and falls back to shared defaults', () => {
    const service = new RuntimeStateService();

    expect(service.getResponseConfig()).toEqual(defaultResponseConfig);

    service.applyConfig({
      config: {
        responseConfig: {
          fixedN: { n: 1 },
          strategyChain: ['fixed_n'],
        },
      },
      node: baseNode,
      persona: null,
      services: { ollama: true },
    });

    expect(service.getResponseConfig()).toMatchObject({
      budget: defaultResponseConfig.budget,
      fixedN: { n: 1, resetPeriod: 'never' },
      strategyChain: ['fixed_n'],
    });
  });

  it('falls back to shared defaults when response config is invalid', () => {
    const service = new RuntimeStateService();

    service.applyConfig({
      config: {
        responseConfig: {
          proxy: { baseUrl: 'https://proxy.local/v1', model: 'gpt-4o-mini' },
          smart: { validationPatterns: ['/([/'] },
          strategyChain: ['smart'],
        },
      },
      node: baseNode,
      persona: null,
      services: { openai: true },
    });

    expect(service.getResponseConfig()).toEqual(defaultResponseConfig);
  });

  it('returns approved runtime templates from node config and ignores malformed entries', () => {
    const service = new RuntimeStateService();

    service.applyConfig({
      config: {
        responseTemplates: [
          {
            category: 'manual-backfeed',
            id: 'template-1',
            keywords: ['config', 'vault'],
            responseText: 'approved template response',
          },
          {
            category: 'broken-template',
            id: 'template-2',
            keywords: [],
          },
        ],
      },
      node: baseNode,
      persona: null,
      services: { openai: true },
    });

    expect(service.getResponseTemplates()).toEqual([
      {
        category: 'manual-backfeed',
        id: 'template-1',
        keywords: ['config', 'vault'],
        responseText: 'approved template response',
      },
    ]);
  });
});