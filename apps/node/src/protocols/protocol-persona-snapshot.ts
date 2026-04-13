import { RuntimeStateService } from '../runtime/runtime-state.service';

export interface ProtocolPersonaSnapshot {
  credentials: Record<string, string>;
  gpu: string;
  hostname: string;
  kernel: string;
  nodeId: string;
  nodeKey: string;
  primaryModel: string;
  sshBanner: string;
  username: string;
  vramGb: number;
}

function sanitizeNodeId(value: string): string {
  const sanitized = value.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return sanitized || 'node';
}

function createHoneytoken(prefix: string, nodeId: string, size: number): string {
  return `${prefix}${nodeId.padEnd(size, 'x').slice(0, size)}`;
}

function buildDecoyCredentials(nodeId: string): Record<string, string> {
  return {
    anthropic: createHoneytoken('sk-ant-', nodeId, 32),
    huggingface: createHoneytoken('hf_', nodeId, 24),
    openai: createHoneytoken('sk-proj-', nodeId, 32),
  };
}

export function createProtocolPersonaSnapshot(
  runtimeStateService: RuntimeStateService,
): ProtocolPersonaSnapshot {
  const persona = runtimeStateService.getPersona();
  const nodeId = sanitizeNodeId(runtimeStateService.getNodeId() ?? persona?.identity.hostname ?? 'node');

  return {
    credentials: buildDecoyCredentials(nodeId),
    gpu: persona?.hardware.gpu ?? 'NVIDIA L4',
    hostname: persona?.identity.hostname ?? 'llmtrap-node',
    kernel: persona?.identity.kernel ?? 'Linux llmtrap-node 6.8.0-llmtrap x86_64 GNU/Linux',
    nodeId,
    nodeKey: createHoneytoken('llt_', nodeId, 32),
    primaryModel: persona?.models[0]?.name ?? 'llmtrap-placeholder',
    sshBanner: persona?.identity.sshBanner ?? 'SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.8',
    username: persona?.identity.username ?? 'operator',
    vramGb: persona?.hardware.vramGb ?? 24,
  };
}