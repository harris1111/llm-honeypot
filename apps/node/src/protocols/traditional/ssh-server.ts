import { generateKeyPairSync } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { Socket } from 'node:net';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Server as SshServer } from 'ssh2';

import { ProtocolCaptureService } from '../../capture/protocol-capture.service';
import { listenStreamServer } from '../protocol-listener';
import type { ProtocolListenerHandle } from '../protocol-server.types';
import type { ProtocolPersonaSnapshot } from '../protocol-persona-snapshot';
import { buildShellPrompt, consumeDelimitedLines, executeTraditionalShellCommand } from './traditional-shell';

type SnapshotFactory = () => ProtocolPersonaSnapshot;

const clientTimeoutMs = 30_000;
const shellBufferLimit = 8_192;
const defaultSshIdent = 'SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.8';

function readRemoteInfo(client: object): { sourceIp: string; sourcePort?: number } {
  const socket = Reflect.get(client, '_sock') as { remoteAddress?: string; remotePort?: number } | undefined;
  return {
    sourceIp: socket?.remoteAddress ?? '0.0.0.0',
    sourcePort: socket?.remotePort,
  };
}

function bindClientSocketGuards(client: object): void {
  const socket = Reflect.get(client, '_sock') as Socket | undefined;
  if (!socket) {
    return;
  }

  socket.setTimeout(clientTimeoutMs, () => {
    socket.destroy();
  });
  socket.on('error', () => {
    socket.destroy();
  });
}

function readOrCreateHostKey(snapshot: ProtocolPersonaSnapshot): string {
  const runtimeDir = process.env.LLMTRAP_RUNTIME_DIR ?? join(homedir(), '.llmtrap-runtime');
  const keyPath = join(runtimeDir, `ssh-host-${snapshot.nodeId}.pem`);

  mkdirSync(runtimeDir, { recursive: true });
  if (existsSync(keyPath)) {
    return readFileSync(keyPath, 'utf8');
  }

  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { format: 'pem', type: 'pkcs1' },
    publicKeyEncoding: { format: 'pem', type: 'pkcs1' },
  });
  writeFileSync(keyPath, privateKey, 'utf8');

  return privateKey;
}

export async function startSshServer(
  port: number,
  protocolCaptureService: ProtocolCaptureService,
  snapshotFactory: SnapshotFactory,
): Promise<ProtocolListenerHandle> {
  const initialSnapshot = snapshotFactory();
  const hostKey = readOrCreateHostKey(initialSnapshot);

  const server = new SshServer(
    {
      banner: 'Secure shell service',
      hostKeys: [hostKey],
      ident: defaultSshIdent,
    },
    (client) => {
    const connectionSnapshot = snapshotFactory();

    bindClientSocketGuards(client as object);
    client.on('error', () => undefined);

    client.on('authentication', (context) => {
      const remote = readRemoteInfo(client as object);
      void protocolCaptureService.record({
        method: 'AUTH',
        path: context.method,
        protocol: 'ssh',
        requestBody: {
          password: 'password' in context ? context.password : undefined,
          username: context.username,
        },
        responseBody: 'accepted',
        responseCode: 200,
        service: 'ssh',
        sourceIp: remote.sourceIp,
        sourcePort: remote.sourcePort,
      });
      context.accept();
    });

    client.on('ready', () => {
      client.on('session', (accept) => {
        const session = accept();

        session.on('pty', (acceptPty) => acceptPty());
        session.on('exec', (acceptExec, _reject, info) => {
          const stream = acceptExec();
          const remote = readRemoteInfo(client as object);
          const result = executeTraditionalShellCommand(info.command, connectionSnapshot);
          stream.on('error', () => {
            stream.end();
          });
          stream.end(`${result.output}\n`);
          void protocolCaptureService.record({
            method: 'EXEC',
            path: info.command,
            protocol: 'ssh',
            requestBody: info.command,
            responseBody: result.output,
            responseCode: 200,
            service: 'ssh',
            sourceIp: remote.sourceIp,
            sourcePort: remote.sourcePort,
          });
        });
        session.on('shell', (acceptShell) => {
          const stream = acceptShell();
          const remote = readRemoteInfo(client as object);
          let buffer = '';

          stream.write(`Last login: ${new Date().toUTCString()}\n${buildShellPrompt(connectionSnapshot)}`);
          stream.on('error', () => {
            stream.end();
          });
          stream.on('data', (chunk: Buffer) => {
            buffer += chunk.toString('utf8').replaceAll('\u0003', '');
            if (buffer.length > shellBufferLimit) {
              stream.end('Input too long\n');
              return;
            }

            const consumed = consumeDelimitedLines(buffer);
            buffer = consumed.rest;
            for (const command of consumed.lines) {
              if (!command) {
                stream.write(buildShellPrompt(connectionSnapshot));
                continue;
              }

              const result = executeTraditionalShellCommand(command, connectionSnapshot);

              stream.write(`${result.output}\n`);
              void protocolCaptureService.record({
                method: 'CMD',
                path: command,
                protocol: 'ssh',
                requestBody: command,
                responseBody: result.output,
                responseCode: 200,
                service: 'ssh',
                sourceIp: remote.sourceIp,
                sourcePort: remote.sourcePort,
              });

              if (result.close) {
                stream.end();
                return;
              }

              stream.write(buildShellPrompt(connectionSnapshot));
            }
          });
        });
      });
    });
    },
  );

  return listenStreamServer('ssh', port, server);
}