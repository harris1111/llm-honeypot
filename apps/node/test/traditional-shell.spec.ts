import { describe, expect, it } from 'vitest';

import { createProtocolPersonaSnapshot } from '../src/protocols/protocol-persona-snapshot';
import type { ProtocolPersonaSnapshot } from '../src/protocols/protocol-persona-snapshot';
import {
  buildShellPrompt,
  consumeDelimitedLines,
  buildVirtualEnvFile,
  buildVirtualFileListing,
  executeTraditionalShellCommand,
} from '../src/protocols/traditional/traditional-shell';

const snapshot: ProtocolPersonaSnapshot = {
  credentials: { anthropic: 'sk-ant-test', openai: 'sk-proj-test' },
  gpu: 'NVIDIA L4',
  hostname: 'trap-node-01',
  kernel: 'Linux trap-node-01 6.8.0 x86_64 GNU/Linux',
  nodeId: 'node123',
  nodeKey: 'llt_honey_node123',
  primaryModel: 'llama-3.3-70b',
  sshBanner: 'SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.8',
  username: 'operator',
  vramGb: 24,
};

describe('traditional shell helpers', () => {
  it('renders persona-specific prompts and file listings', () => {
    expect(buildShellPrompt(snapshot)).toBe('operator@trap-node-01:~$ ');
    expect(buildVirtualFileListing(snapshot)).toContain('docker-compose.yml');
    expect(buildVirtualEnvFile(snapshot)).toContain('OPENAI_API_KEY=sk-proj-test');
  });

  it('uses the persona username inside virtual file listings and home-directory file lookups', () => {
    const analystSnapshot: ProtocolPersonaSnapshot = {
      ...snapshot,
      username: 'analyst',
    };

    expect(buildVirtualFileListing(analystSnapshot)).toContain('analyst analyst');
    expect(executeTraditionalShellCommand('pwd', analystSnapshot)).toEqual({ close: false, output: '/home/analyst' });
    expect(executeTraditionalShellCommand('cat /home/analyst/.env', analystSnapshot).output).toContain('LLMTRAP_NODE_KEY=llt_honey_node123');
  });

  it('returns command output for common shell probes', () => {
    expect(executeTraditionalShellCommand('whoami', snapshot)).toEqual({ close: false, output: 'operator' });
    expect(executeTraditionalShellCommand('cat .env', snapshot).output).toContain('LLMTRAP_NODE_KEY=llt_honey_node123');
    expect(executeTraditionalShellCommand('docker ps', snapshot).output).toContain('llama-3.3-70b-proxy');
  });

  it('closes the session on exit-like commands', () => {
    expect(executeTraditionalShellCommand('exit', snapshot)).toEqual({ close: true, output: 'logout' });
  });

  it('consumes CRLF-delimited commands without introducing a duplicate blank command', () => {
    expect(consumeDelimitedLines('whoami\r\n')).toEqual({ lines: ['whoami'], rest: '' });
    expect(consumeDelimitedLines('whoami\r\n\r\n')).toEqual({ lines: ['whoami', ''], rest: '' });
  });

  it('generates decoy credentials instead of exposing persona secrets', () => {
    const runtimeStateService = {
      getNodeId: () => undefined,
      getPersona: () => ({
        credentials: {
          anthropic: 'sk-ant-live-secret',
          huggingface: 'hf_live_secret',
          openai: 'sk-proj-live-secret',
        },
        hardware: { gpu: 'NVIDIA L4', vramGb: 24 },
        identity: { hostname: 'edge-node-01', kernel: 'Linux edge-node-01', sshBanner: snapshot.sshBanner, username: 'operator' },
        models: [{ name: 'llama-3.3-70b' }],
      }),
    };

    const generated = createProtocolPersonaSnapshot(runtimeStateService as never);
    const envFile = buildVirtualEnvFile(generated);

    expect(generated.credentials.openai).not.toBe('sk-proj-live-secret');
    expect(generated.credentials.anthropic).not.toBe('sk-ant-live-secret');
    expect(generated.credentials.huggingface).not.toBe('hf_live_secret');
    expect(envFile).not.toContain('live-secret');
    expect(generated.nodeKey).toMatch(/^llt_/);
  });
});