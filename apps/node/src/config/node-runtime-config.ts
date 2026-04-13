import { parseNodeEnv } from '@llmtrap/shared';
import type {
  HomelabProtocolService,
  ProtocolService,
  RagProtocolService,
} from '@llmtrap/shared';

export const NODE_RUNTIME_CONFIG = Symbol('NODE_RUNTIME_CONFIG');

export interface TraditionalPortConfig {
  dns: number;
  ftp: number;
  smb: number;
  smtp: number;
  smtpSubmission: number;
  ssh: number;
  telnet: number;
}

export interface NodeRuntimeConfig {
  anthropicPort: number;
  autoGptPort: number;
  captureBatchSize: number;
  configRefreshIntervalMs: number;
  dashboardUrl: string;
  flushIntervalMs: number;
  heartbeatIntervalMs: number;
  homelabPorts: Record<HomelabProtocolService, number>;
  langservePort: number;
  llamaCppPort: number;
  listenPort: number;
  lmStudioPort: number;
  maxBufferSize: number;
  nodeKey: string;
  openAiPort: number;
  ragPorts: Record<RagProtocolService, number>;
  redisUrl: string;
  serviceList: ProtocolService[];
  traditionalPorts: TraditionalPortConfig;
  textGenerationWebuiPort: number;
  vllmPort: number;
  version: string;
}

function readPort(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (Number.isInteger(parsedValue) && parsedValue > 0 && parsedValue <= 65_535) {
    return parsedValue;
  }

  throw new Error(`Invalid port for ${name}: ${value}`);
}

function validatePortAssignments(config: NodeRuntimeConfig): void {
  const assignments: Array<{ name: string; port: number }> = [
    { name: 'node-http', port: config.listenPort },
    { name: 'openai', port: config.openAiPort },
    { name: 'anthropic', port: config.anthropicPort },
    { name: 'text-generation-webui', port: config.textGenerationWebuiPort },
    { name: 'langserve', port: config.langservePort },
    { name: 'autogpt', port: config.autoGptPort },
    { name: 'lm-studio', port: config.lmStudioPort },
    { name: 'llamacpp', port: config.llamaCppPort },
    { name: 'vllm', port: config.vllmPort },
    ...Object.entries(config.ragPorts).map(([name, port]) => ({ name, port })),
    ...Object.entries(config.homelabPorts).map(([name, port]) => ({ name, port })),
    ...Object.entries(config.traditionalPorts).map(([name, port]) => ({ name, port })),
  ];
  const seen = new Map<number, string>();

  for (const assignment of assignments) {
    const existing = seen.get(assignment.port);
    if (existing) {
      throw new Error(`Port ${assignment.port} is assigned to both ${existing} and ${assignment.name}`);
    }

    seen.set(assignment.port, assignment.name);
  }
}

export function getNodeRuntimeConfig(env: NodeJS.ProcessEnv = process.env): NodeRuntimeConfig {
  const parsed = parseNodeEnv(env);

  const config: NodeRuntimeConfig = {
    anthropicPort: readPort(env.ANTHROPIC_HTTP_PORT, 8081, 'ANTHROPIC_HTTP_PORT'),
    autoGptPort: readPort(env.AUTOGPT_HTTP_PORT, 8084, 'AUTOGPT_HTTP_PORT'),
    captureBatchSize: 100,
    configRefreshIntervalMs: 300_000,
    dashboardUrl: parsed.LLMTRAP_DASHBOARD_URL,
    flushIntervalMs: 15_000,
    heartbeatIntervalMs: 30_000,
    homelabPorts: {
      gitea: readPort(env.GITEA_HTTP_PORT, 3001, 'GITEA_HTTP_PORT'),
      grafana: readPort(env.GRAFANA_HTTP_PORT, 3002, 'GRAFANA_HTTP_PORT'),
      'home-assistant': readPort(env.HOME_ASSISTANT_HTTP_PORT, 8123, 'HOME_ASSISTANT_HTTP_PORT'),
      plex: readPort(env.PLEX_HTTP_PORT, 32400, 'PLEX_HTTP_PORT'),
      portainer: readPort(env.PORTAINER_HTTP_PORT, 9000, 'PORTAINER_HTTP_PORT'),
      prometheus: readPort(env.PROMETHEUS_HTTP_PORT, 9090, 'PROMETHEUS_HTTP_PORT'),
      prowlarr: readPort(env.PROWLARR_HTTP_PORT, 9696, 'PROWLARR_HTTP_PORT'),
      radarr: readPort(env.RADARR_HTTP_PORT, 7878, 'RADARR_HTTP_PORT'),
      sonarr: readPort(env.SONARR_HTTP_PORT, 8989, 'SONARR_HTTP_PORT'),
      'uptime-kuma': readPort(env.UPTIME_KUMA_HTTP_PORT, 3003, 'UPTIME_KUMA_HTTP_PORT'),
    },
    langservePort: readPort(env.LANGSERVE_HTTP_PORT, 8000, 'LANGSERVE_HTTP_PORT'),
    llamaCppPort: readPort(env.LLAMACPP_HTTP_PORT, 8082, 'LLAMACPP_HTTP_PORT'),
    listenPort: parsed.NODE_HTTP_PORT,
    lmStudioPort: readPort(env.LM_STUDIO_HTTP_PORT, 1234, 'LM_STUDIO_HTTP_PORT'),
    maxBufferSize: 100_000,
    nodeKey: parsed.LLMTRAP_NODE_KEY,
    openAiPort: readPort(env.OPENAI_HTTP_PORT, 8080, 'OPENAI_HTTP_PORT'),
    ragPorts: {
      chromadb: readPort(env.CHROMADB_HTTP_PORT, 8085, 'CHROMADB_HTTP_PORT'),
      milvus: readPort(env.MILVUS_HTTP_PORT, 19530, 'MILVUS_HTTP_PORT'),
      neo4j: readPort(env.NEO4J_HTTP_PORT, 7474, 'NEO4J_HTTP_PORT'),
      qdrant: readPort(env.QDRANT_HTTP_PORT, 6333, 'QDRANT_HTTP_PORT'),
      weaviate: readPort(env.WEAVIATE_HTTP_PORT, 8086, 'WEAVIATE_HTTP_PORT'),
    },
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
    ],
    traditionalPorts: {
      dns: readPort(env.DNS_PORT, 1053, 'DNS_PORT'),
      ftp: readPort(env.FTP_PORT, 10021, 'FTP_PORT'),
      smb: readPort(env.SMB_PORT, 10445, 'SMB_PORT'),
      smtp: readPort(env.SMTP_PORT, 10025, 'SMTP_PORT'),
      smtpSubmission: readPort(env.SMTP_SUBMISSION_PORT, 10587, 'SMTP_SUBMISSION_PORT'),
      ssh: readPort(env.SSH_PORT, 10022, 'SSH_PORT'),
      telnet: readPort(env.TELNET_PORT, 10023, 'TELNET_PORT'),
    },
    textGenerationWebuiPort: readPort(env.TEXT_GENERATION_WEBUI_HTTP_PORT, 5000, 'TEXT_GENERATION_WEBUI_HTTP_PORT'),
    vllmPort: readPort(env.VLLM_HTTP_PORT, 8083, 'VLLM_HTTP_PORT'),
    version: '0.1.0',
  };

  validatePortAssignments(config);

  return config;
}