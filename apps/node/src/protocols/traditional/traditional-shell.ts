import type { ProtocolPersonaSnapshot } from '../protocol-persona-snapshot';

export interface ShellCommandResult {
  close: boolean;
  output: string;
}

function fallbackCredential(snapshot: ProtocolPersonaSnapshot, key: string, prefix: string): string {
  return snapshot.credentials[key] ?? `${prefix}${snapshot.nodeId.padEnd(24, 'x').slice(0, 24)}`;
}

export function buildShellPrompt(snapshot: ProtocolPersonaSnapshot): string {
  return `${snapshot.username}@${snapshot.hostname}:~$ `;
}

export function consumeDelimitedLines(buffer: string): { lines: string[]; rest: string } {
  const lines: string[] = [];
  let rest = buffer;

  while (rest.includes('\n') || rest.includes('\r')) {
    const delimiterIndex = Math.min(...['\n', '\r'].map((value) => {
      const index = rest.indexOf(value);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    }));
    const delimiterLength = rest[delimiterIndex] === '\r' && rest[delimiterIndex + 1] === '\n' ? 2 : 1;

    lines.push(rest.slice(0, delimiterIndex).trim());
    rest = rest.slice(delimiterIndex + delimiterLength);
  }

  return { lines, rest };
}

export function buildVirtualEnvFile(snapshot: ProtocolPersonaSnapshot): string {
  return [
    `OPENAI_API_KEY=${fallbackCredential(snapshot, 'openai', 'sk-proj-')}`,
    `ANTHROPIC_API_KEY=${fallbackCredential(snapshot, 'anthropic', 'sk-ant-')}`,
    `HF_TOKEN=${fallbackCredential(snapshot, 'huggingface', 'hf_')}`,
    `LLMTRAP_NODE_KEY=${snapshot.nodeKey}`,
  ].join('\n');
}

export function buildVirtualFileListing(snapshot: ProtocolPersonaSnapshot): string {
  const owner = snapshot.username;

  return [
    'total 20',
    `drwxr-xr-x 5 ${owner} ${owner} 4096 Apr 13 09:12 .`,
    'drwxr-xr-x 3 root     root     4096 Apr 13 08:00 ..',
    `-rw------- 1 ${owner} ${owner}  184 Apr 13 09:10 .env`,
    `-rw-r--r-- 1 ${owner} ${owner}  232 Apr 13 09:11 docker-compose.yml`,
    `drwxr-xr-x 2 ${owner} ${owner} 4096 Apr 13 09:12 models`,
    `drwxr-xr-x 2 ${owner} ${owner} 4096 Apr 13 09:12 workspace`,
    `-rw-r--r-- 1 ${owner} ${owner}   57 Apr 13 09:12 ${snapshot.primaryModel}.txt`,
  ].join('\n');
}

export function renderVirtualFile(path: string, snapshot: ProtocolPersonaSnapshot): string {
  const normalized = path.trim().replace(/^cat\s+/i, '').replace(/^RETR\s+/i, '').replace(/\\/g, '/');

  if (normalized.endsWith('.env') || normalized === `/home/${snapshot.username}/.env`) {
    return buildVirtualEnvFile(snapshot);
  }

  if (normalized.endsWith('docker-compose.yml')) {
    return ['services:', `  ${snapshot.primaryModel}:`, '    image: ghcr.io/harris1111/llmtrap:latest', '    restart: unless-stopped'].join('\n');
  }

  if (normalized.endsWith('notes.txt')) {
    return `remember to rotate ${snapshot.primaryModel} proxy credentials after the next maintenance window`;
  }

  return `cat: ${normalized}: No such file or directory`;
}

export function executeTraditionalShellCommand(command: string, snapshot: ProtocolPersonaSnapshot): ShellCommandResult {
  const normalized = command.trim();

  if (!normalized) {
    return { close: false, output: '' };
  }

  if (normalized === 'exit' || normalized === 'logout' || normalized === 'quit') {
    return { close: true, output: 'logout' };
  }

  if (normalized === 'help') {
    return { close: false, output: 'help whoami hostname pwd ls cat uname -a nvidia-smi docker ps exit' };
  }

  if (normalized === 'whoami') {
    return { close: false, output: snapshot.username };
  }

  if (normalized === 'hostname') {
    return { close: false, output: snapshot.hostname };
  }

  if (normalized === 'pwd') {
    return { close: false, output: `/home/${snapshot.username}` };
  }

  if (normalized === 'ls' || normalized === 'ls -la') {
    return { close: false, output: buildVirtualFileListing(snapshot) };
  }

  if (normalized === 'uname -a') {
    return { close: false, output: snapshot.kernel };
  }

  if (normalized === 'nvidia-smi') {
    return { close: false, output: `GPU 0: ${snapshot.gpu} (${snapshot.vramGb} GiB)\nProcesses: ${snapshot.primaryModel}` };
  }

  if (normalized === 'docker ps') {
    return {
      close: false,
      output: [
        'CONTAINER ID   IMAGE                          NAMES',
        `a1b2c3d4e5f6   ghcr.io/llmtrap/node:latest   ${snapshot.hostname}`,
        `b2c3d4e5f6g7   vllm/vllm-openai:latest       ${snapshot.primaryModel}-proxy`,
      ].join('\n'),
    };
  }

  if (normalized.startsWith('cat ')) {
    return { close: false, output: renderVirtualFile(normalized, snapshot) };
  }

  return { close: false, output: `bash: ${normalized}: command not found` };
}