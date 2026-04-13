import type { ProtocolService } from '../types';

export const protocolPorts: Record<ProtocolService, number> = {
  anthropic: 8081,
  api: 4000,
  dns: 53,
  ftp: 21,
  node: 11434,
  ollama: 11434,
  openai: 8080,
  smb: 445,
  smtp: 25,
  ssh: 22,
  telnet: 23,
  worker: 4100,
};

export const protocolFamilies = {
  dashboard: ['api', 'worker'] as const,
  honeypot: ['openai', 'ollama', 'anthropic', 'ssh', 'ftp', 'smtp', 'dns', 'smb', 'telnet'] as const,
};