import { createConnection, createServer, type Socket } from 'node:net';
import { Client, type ClientChannel } from 'ssh2';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ProtocolPersonaSnapshot } from '../src/protocols/protocol-persona-snapshot';
import type { ProtocolListenerHandle } from '../src/protocols/protocol-server.types';
import { startFtpServer } from '../src/protocols/traditional/ftp-server';
import { startSmtpServer } from '../src/protocols/traditional/smtp-server';
import { buildShellPrompt } from '../src/protocols/traditional/traditional-shell';
import { startSshServer } from '../src/protocols/traditional/ssh-server';
import { startTelnetServer } from '../src/protocols/traditional/telnet-server';

const snapshot: ProtocolPersonaSnapshot = {
  credentials: { anthropic: 'sk-ant-test', huggingface: 'hf_test', openai: 'sk-proj-test' },
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

const driftedSnapshot: ProtocolPersonaSnapshot = {
  ...snapshot,
  hostname: 'trap-node-99',
  primaryModel: 'mixtral-8x7b',
};

const activeHandles: ProtocolListenerHandle[] = [];
const activeSockets: Socket[] = [];
const activeSshClients: Client[] = [];

async function reservePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  return port;
}

async function openSocket(port: number): Promise<Socket> {
  return await new Promise<Socket>((resolve, reject) => {
    const socket = createConnection({ host: '127.0.0.1', port }, () => {
      socket.setEncoding('utf8');
      activeSockets.push(socket);
      resolve(socket);
    });
    socket.on('error', reject);
  });
}

async function readUntil(socket: Socket, predicate: (buffer: string) => boolean): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    let buffer = '';
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for socket output'));
    }, 5_000);

    const onData = (chunk: string | Buffer) => {
      buffer += chunk.toString();
      if (predicate(buffer)) {
        cleanup();
        resolve(buffer);
      }
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    function cleanup(): void {
      clearTimeout(timeout);
      socket.off('data', onData);
      socket.off('error', onError);
    }

    socket.on('data', onData);
    socket.on('error', onError);
  });
}

async function connectSsh(port: number): Promise<Client> {
  return await new Promise<Client>((resolve, reject) => {
    const client = new Client();
    client.on('ready', () => {
      activeSshClients.push(client);
      resolve(client);
    });
    client.on('error', reject);
    client.connect({ host: '127.0.0.1', password: 'secret', port, username: 'operator' });
  });
}

async function openSshShell(client: Client): Promise<ClientChannel> {
  return await new Promise<ClientChannel>((resolve, reject) => {
    client.shell((error, stream) => {
      if (error) {
        reject(error);
        return;
      }

      stream.setEncoding('utf8');
      resolve(stream);
    });
  });
}

async function collectBurst(stream: ClientChannel, idleMs = 250, timeoutMs = 4_000): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    let buffer = '';
    let idleTimer: NodeJS.Timeout | undefined;
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for SSH output'));
    }, timeoutMs);

    const onData = (chunk: string | Buffer) => {
      buffer += chunk.toString();
      if (idleTimer) {
        clearTimeout(idleTimer);
      }

      idleTimer = setTimeout(() => {
        cleanup();
        resolve(buffer);
      }, idleMs);
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    function cleanup(): void {
      clearTimeout(timeout);
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      stream.off('data', onData);
      stream.off('error', onError);
    }

    stream.on('data', onData);
    stream.on('error', onError);
  });
}

afterEach(async () => {
  while (activeSockets.length > 0) {
    activeSockets.pop()?.destroy();
  }

  while (activeSshClients.length > 0) {
    activeSshClients.pop()?.end();
  }

  while (activeHandles.length > 0) {
    const handle = activeHandles.pop();
    if (handle) {
      await handle.close();
    }
  }
});

describe('traditional protocol listeners', () => {
  it('keeps the telnet login and password prompts on separate CRLF frames', async () => {
    const port = await reservePort();
    let snapshotCalls = 0;
    const handle = await startTelnetServer(
      port,
      { record: vi.fn().mockResolvedValue(undefined) } as never,
      () => (++snapshotCalls <= 1 ? snapshot : driftedSnapshot),
    );
    activeHandles.push(handle);

    const socket = await openSocket(port);
    await readUntil(socket, (buffer) => buffer.includes('login: '));

    socket.write('operator\r\n');
    const passwordPrompt = await readUntil(socket, (buffer) => buffer.includes('Password: '));

    expect(passwordPrompt).toContain('Password: ');
    expect(passwordPrompt).not.toContain(buildShellPrompt(snapshot));

    socket.write('secret\r\n');
    const shellBanner = await readUntil(socket, (buffer) => buffer.includes(buildShellPrompt(snapshot)));

    expect(shellBanner).toContain(buildShellPrompt(snapshot));
    expect(shellBanner).not.toContain(buildShellPrompt(driftedSnapshot));
  });

  it('sends the SMTP DATA completion response before the pipelined QUIT reply', async () => {
    const port = await reservePort();
    const record = vi.fn().mockResolvedValue(undefined);
    const handle = await startSmtpServer('smtp', port, { record } as never, () => snapshot);
    activeHandles.push(handle);

    const socket = await openSocket(port);
    await readUntil(socket, (buffer) => buffer.includes('220 trap-node-01 ESMTP ready'));

    socket.write('EHLO example.com\r\nDATA\r\nhello\r\n.\r\nQUIT\r\n');
    const transcript = await readUntil(socket, (buffer) => buffer.includes('221 2.0.0 Bye'));

    expect(transcript).toContain('250 2.0.0 Queued as llmtrap');
    expect(transcript.indexOf('250 2.0.0 Queued as llmtrap')).toBeLessThan(transcript.indexOf('221 2.0.0 Bye'));

    await vi.waitFor(() => {
      expect(record).toHaveBeenCalledWith(expect.objectContaining({ method: 'DATA', path: '/smtp/message' }));
      expect(record).toHaveBeenCalledWith(expect.objectContaining({ method: 'QUIT', path: '/smtp' }));
    });
  });

  it('records submission traffic under a distinct service label', async () => {
    const port = await reservePort();
    const record = vi.fn().mockResolvedValue(undefined);
    const handle = await startSmtpServer('smtp-submission', port, { record } as never, () => snapshot);
    activeHandles.push(handle);

    const socket = await openSocket(port);
    await readUntil(socket, (buffer) => buffer.includes('220 trap-node-01 ESMTP ready'));

    socket.write('QUIT\r\n');
    const transcript = await readUntil(socket, (buffer) => buffer.includes('221 2.0.0 Bye'));

    expect(transcript).toContain('221 2.0.0 Bye');

    await vi.waitFor(() => {
      expect(record).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'QUIT', path: '/smtp-submission', protocol: 'smtp-submission', service: 'smtp-submission' }),
      );
    });
  });

  it('keeps FTP persona state stable for the lifetime of the connection', async () => {
    const port = await reservePort();
    let snapshotCalls = 0;
    const ftpDriftedSnapshot: ProtocolPersonaSnapshot = {
      ...driftedSnapshot,
      username: 'drifter',
    };
    const handle = await startFtpServer(
      port,
      { record: vi.fn().mockResolvedValue(undefined) } as never,
      () => (++snapshotCalls <= 1 ? snapshot : ftpDriftedSnapshot),
    );
    activeHandles.push(handle);

    const socket = await openSocket(port);
    const banner = await readUntil(socket, (buffer) => buffer.includes('FTP server ready'));

    expect(banner).toContain(snapshot.hostname);
    expect(banner).not.toContain(ftpDriftedSnapshot.hostname);

    socket.write('PWD\r\n');
    const pwdTranscript = await readUntil(socket, (buffer) => buffer.includes('is current directory'));

    expect(pwdTranscript).toContain(`/home/${snapshot.username}`);
    expect(pwdTranscript).not.toContain(`/home/${ftpDriftedSnapshot.username}`);

    socket.end();
  });

  it('keeps a single SSH prompt after CRLF-delimited commands', async () => {
    const port = await reservePort();
    let snapshotCalls = 0;
    const handle = await startSshServer(
      port,
      { record: vi.fn().mockResolvedValue(undefined) } as never,
      () => (++snapshotCalls <= 2 ? snapshot : driftedSnapshot),
    );
    activeHandles.push(handle);

    const client = await connectSsh(port);
    const shell = await openSshShell(client);
    const prompt = buildShellPrompt(snapshot);

    const initial = await collectBurst(shell);
    expect(initial).toContain(prompt);

    shell.write('hostname\r\n');
    const response = await collectBurst(shell);

    expect(response).toContain(snapshot.hostname);
    expect(response).not.toContain(driftedSnapshot.hostname);
    expect(response.split(prompt).length - 1).toBe(1);

    shell.end('exit\n');
  });
});