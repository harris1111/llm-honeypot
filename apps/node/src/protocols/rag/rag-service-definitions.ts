import type { NodeRuntimeConfig } from '../../config/node-runtime-config';
import type { ProtocolPersonaSnapshot } from '../protocol-persona-snapshot';
import type { ProtocolHttpServiceDefinition } from '../protocol-server.types';

type SnapshotFactory = () => ProtocolPersonaSnapshot;

function vectorCollections(snapshot: ProtocolPersonaSnapshot) {
  return ['model-cache', 'prompt-history', `${snapshot.hostname}-documents`];
}

export function buildRagServiceDefinitions(
  config: NodeRuntimeConfig,
  snapshotFactory: SnapshotFactory,
): ProtocolHttpServiceDefinition[] {
  return [
    {
      port: config.ragPorts.qdrant,
      routes: [
        { handle: () => ({ body: { result: { collections: vectorCollections(snapshotFactory()).map((name) => ({ name })) }, status: 'ok' } }), method: 'GET', path: '/collections' },
        { handle: () => ({ body: { result: [{ id: 'doc-1', payload: { score: 0.93, source: 'prompt-history' } }], status: 'ok' } }), method: 'POST', path: '/collections/llmtrap-docs/points/search' },
      ],
      service: 'qdrant',
    },
    {
      port: config.ragPorts.chromadb,
      routes: [
        { handle: () => ({ body: vectorCollections(snapshotFactory()).map((name) => ({ id: `${name}-id`, metadata: { tenant: 'llmtrap' }, name })) }), method: 'GET', path: '/api/v1/collections' },
        { handle: () => ({ body: { distances: [[0.07]], ids: [['embedding-1']], metadatas: [[{ collection: 'model-cache' }]] } }), method: 'POST', path: '/api/v1/collections/search' },
      ],
      service: 'chromadb',
    },
    {
      port: config.ragPorts.neo4j,
      routes: [
        { handle: () => ({ body: { bolt_direct: 'bolt://localhost:7687', neo4j_version: '5.21.0' } }), method: 'GET', path: '/db/data/' },
        { handle: () => ({ body: { results: [{ columns: ['name'], data: [{ row: [snapshotFactory().hostname] }] }] } }), method: 'POST', path: '/db/neo4j/tx/commit' },
      ],
      service: 'neo4j',
    },
    {
      port: config.ragPorts.weaviate,
      routes: [
        { handle: () => ({ body: { classes: [{ class: 'PromptCache' }, { class: 'ModelRuns' }, { class: snapshotFactory().hostname.replace(/[^a-z0-9]/gi, '') || 'NodeDocs' }] } }), method: 'GET', path: '/v1/schema' },
        { handle: () => ({ body: { data: { Get: { PromptCache: [{ content: 'cached context', model: snapshotFactory().primaryModel }] } } } }), method: 'POST', path: '/v1/graphql' },
      ],
      service: 'weaviate',
    },
    {
      port: config.ragPorts.milvus,
      routes: [
        { handle: () => ({ body: { collections: vectorCollections(snapshotFactory()).map((name) => ({ name, row_count: 12 })) } }), method: 'GET', path: '/v1/vector/collections' },
        { handle: () => ({ body: { data: [{ distance: 0.12, id: 'vec-1', model: snapshotFactory().primaryModel }] } }), method: 'POST', path: '/v1/vector/search' },
      ],
      service: 'milvus',
    },
  ];
}