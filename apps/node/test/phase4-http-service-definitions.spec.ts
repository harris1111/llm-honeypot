import { describe, expect, it } from 'vitest';

import { getNodeRuntimeConfig } from '../src/config/node-runtime-config';
import { buildHomelabServiceDefinitions } from '../src/protocols/homelab/homelab-service-definitions';
import type { ProtocolPersonaSnapshot } from '../src/protocols/protocol-persona-snapshot';
import { buildRagServiceDefinitions } from '../src/protocols/rag/rag-service-definitions';

const snapshot: ProtocolPersonaSnapshot = {
  credentials: { anthropic: 'sk-ant-test', openai: 'sk-proj-test' },
  gpu: 'NVIDIA L4',
  hostname: 'trap-node-01',
  kernel: 'Linux trap-node-01 6.8.0 x86_64 GNU/Linux',
  nodeId: 'node123',
  nodeKey: 'llt_node123',
  primaryModel: 'llama-3.3-70b',
  sshBanner: 'SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.8',
  username: 'operator',
  vramGb: 24,
};

const config = getNodeRuntimeConfig({
  LLMTRAP_DASHBOARD_URL: 'http://dashboard.local',
  LLMTRAP_NODE_KEY: snapshot.nodeKey,
  REDIS_URL: 'redis://localhost:6379',
});

describe('Phase 4 HTTP service definitions', () => {
  it('returns vector collection listings for qdrant and chromadb', () => {
    const ragDefinitions = buildRagServiceDefinitions(config, () => snapshot);
    const qdrant = ragDefinitions.find((definition) => definition.service === 'qdrant');
    const chromadb = ragDefinitions.find((definition) => definition.service === 'chromadb');

    const qdrantPayload = qdrant?.routes.find((route) => route.path === '/collections')?.handle({
      bodyText: '',
      headers: {},
      method: 'GET',
      path: '/collections',
      query: new URLSearchParams(),
      sourceIp: '203.0.113.10',
    });
    const chromadbPayload = chromadb?.routes.find((route) => route.path === '/api/v1/collections')?.handle({
      bodyText: '',
      headers: {},
      method: 'GET',
      path: '/api/v1/collections',
      query: new URLSearchParams(),
      sourceIp: '203.0.113.10',
    });

    expect(JSON.stringify(qdrantPayload?.body)).toContain('trap-node-01-documents');
    expect(JSON.stringify(chromadbPayload?.body)).toContain('model-cache');
  });

  it('returns realistic homelab health payloads', () => {
    const homelabDefinitions = buildHomelabServiceDefinitions(config, () => snapshot);
    const grafana = homelabDefinitions.find((definition) => definition.service === 'grafana');
    const homeAssistant = homelabDefinitions.find((definition) => definition.service === 'home-assistant');

    const grafanaPayload = grafana?.routes.find((route) => route.path === '/api/health')?.handle({
      bodyText: '',
      headers: {},
      method: 'GET',
      path: '/api/health',
      query: new URLSearchParams(),
      sourceIp: '203.0.113.10',
    });
    const homeAssistantPayload = homeAssistant?.routes.find((route) => route.path === '/api/')?.handle({
      bodyText: '',
      headers: {},
      method: 'GET',
      path: '/api/',
      query: new URLSearchParams(),
      sourceIp: '203.0.113.10',
    });

    expect(grafanaPayload?.body).toEqual(expect.objectContaining({ version: '11.0.0' }));
    expect(homeAssistantPayload?.body).toEqual(expect.objectContaining({ location_name: 'trap-node-01' }));
  });
});