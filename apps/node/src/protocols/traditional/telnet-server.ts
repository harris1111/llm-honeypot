import { createServer } from 'node:net';

import { ProtocolCaptureService } from '../../capture/protocol-capture.service';
import { listenStreamServer } from '../protocol-listener';
import type { ProtocolListenerHandle } from '../protocol-server.types';
import type { ProtocolPersonaSnapshot } from '../protocol-persona-snapshot';
import { buildShellPrompt, consumeDelimitedLines, executeTraditionalShellCommand } from './traditional-shell';

type SnapshotFactory = () => ProtocolPersonaSnapshot;

const connectionTimeoutMs = 30_000;
const maxBufferedChars = 8_192;

export async function startTelnetServer(
  port: number,
  protocolCaptureService: ProtocolCaptureService,
  snapshotFactory: SnapshotFactory,
): Promise<ProtocolListenerHandle> {
  const server = createServer((socket) => {
    const connectionSnapshot = snapshotFactory();

    socket.setEncoding('utf8');
    socket.setTimeout(connectionTimeoutMs);
    socket.write(`Welcome to ${connectionSnapshot.hostname}\r\nlogin: `);

    let buffer = '';
    let login = '';
    let stage: 'password' | 'shell' | 'username' = 'username';

    socket.on('error', () => {
      socket.destroy();
    });
    socket.on('timeout', () => {
      socket.end('\r\nConnection timed out\r\n');
    });

    socket.on('data', (chunk) => {
      buffer += chunk;
      if (buffer.length > maxBufferedChars) {
        socket.end('\r\nInput too long\r\n');
        return;
      }

      const consumed = consumeDelimitedLines(buffer);
      buffer = consumed.rest;
      for (const line of consumed.lines) {
        if (!line) {
          if (stage === 'shell') {
            socket.write(buildShellPrompt(connectionSnapshot));
          }
          continue;
        }

        void handleLine(line);
      }
    });

    const handleLine = async (line: string) => {
      const snapshot = connectionSnapshot;
      if (stage === 'username') {
        login = line || snapshot.username;
        stage = 'password';
        socket.write('Password: ');
        await protocolCaptureService.record({
          method: 'LOGIN',
          path: login,
          protocol: 'telnet',
          requestBody: login,
          responseBody: 'Password: ',
          responseCode: 200,
          service: 'telnet',
          sourceIp: socket.remoteAddress ?? '0.0.0.0',
          sourcePort: socket.remotePort,
        });
        return;
      }

      if (stage === 'password') {
        stage = 'shell';
        socket.write(`\r\nLast login: ${new Date().toUTCString()}\r\n${buildShellPrompt(snapshot)}`);
        await protocolCaptureService.record({
          method: 'PASSWORD',
          path: login,
          protocol: 'telnet',
          requestBody: line,
          responseBody: 'authenticated',
          responseCode: 200,
          service: 'telnet',
          sourceIp: socket.remoteAddress ?? '0.0.0.0',
          sourcePort: socket.remotePort,
        });
        return;
      }

      const result = executeTraditionalShellCommand(line, snapshot);
      socket.write(`${result.output}\r\n`);
      await protocolCaptureService.record({
        method: 'CMD',
        path: line,
        protocol: 'telnet',
        requestBody: line,
        responseBody: result.output,
        responseCode: 200,
        service: 'telnet',
        sourceIp: socket.remoteAddress ?? '0.0.0.0',
        sourcePort: socket.remotePort,
      });

      if (result.close) {
        socket.end();
        return;
      }

      socket.write(buildShellPrompt(snapshot));
    };
  });

  return listenStreamServer('telnet', port, server);
}