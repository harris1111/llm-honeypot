export type UserRole = 'ADMIN' | 'ANALYST' | 'VIEWER';

export type NodeStatus = 'PENDING' | 'ONLINE' | 'OFFLINE' | 'DISABLED';

export type AttackClassification =
  | 'free_rider'
  | 'scanner'
  | 'config_hunter'
  | 'attacker'
  | 'mcp_prober'
  | 'validator'
  | 'unknown';

export type RagProtocolService = 'chromadb' | 'milvus' | 'neo4j' | 'qdrant' | 'weaviate';

export type HomelabProtocolService =
  | 'gitea'
  | 'grafana'
  | 'home-assistant'
  | 'plex'
  | 'portainer'
  | 'prometheus'
  | 'prowlarr'
  | 'radarr'
  | 'sonarr'
  | 'uptime-kuma';

export type TraditionalProtocolService = 'dns' | 'ftp' | 'smb' | 'smtp' | 'smtp-submission' | 'ssh' | 'telnet';

export type ProtocolService =
  | 'api'
  | 'openai'
  | 'autogpt'
  | 'chromadb'
  | 'gitea'
  | 'grafana'
  | 'home-assistant'
  | 'ide-configs'
  | 'langserve'
  | 'lm-studio'
  | 'llamacpp'
  | 'mcp'
  | 'milvus'
  | 'neo4j'
  | 'ollama'
  | 'anthropic'
  | 'plex'
  | 'portainer'
  | 'prometheus'
  | 'prowlarr'
  | 'qdrant'
  | 'radarr'
  | 'sonarr'
  | 'text-generation-webui'
  | 'uptime-kuma'
  | 'vllm'
  | 'weaviate'
  | 'node'
  | 'worker'
  | TraditionalProtocolService;

export interface ModelDescriptor {
  name: string;
  family: string;
  parameterSize: string;
  sizeGb: number;
}

export interface PersonaIdentity {
  hostname: string;
  os: string;
  sshBanner: string;
  kernel: string;
  username: string;
}

export interface PersonaHardware {
  gpu: string;
  vramGb: number;
  cpu: string;
  ramGb: number;
  diskGb: number;
}

export interface PersonaTiming {
  uptimeDays: [number, number];
  gpuUtilizationPct: [number, number];
  loadAverage: [number, number, number];
}

export interface PersonaDefinition {
  name: string;
  preset: string | null;
  identity: PersonaIdentity;
  hardware: PersonaHardware;
  models: ModelDescriptor[];
  services: Record<string, boolean>;
  configFiles: Record<string, boolean>;
  timing: PersonaTiming;
  credentials: Record<string, string>;
}

export interface CapturedRequestRecord {
  nodeId: string;
  sourceIp: string;
  protocol: string;
  service: string;
  method: string;
  path?: string;
  userAgent?: string;
  classification?: AttackClassification;
}