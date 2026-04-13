import { createServer } from 'node:net';

import { ProtocolCaptureService } from '../../capture/protocol-capture.service';
import { listenStreamServer } from '../protocol-listener';
import type { ProtocolListenerHandle } from '../protocol-server.types';
import type { ProtocolPersonaSnapshot } from '../protocol-persona-snapshot';
import { buildVirtualFileListing, renderVirtualFile } from './traditional-shell';

type SnapshotFactory = () => ProtocolPersonaSnapshot;

const connectionTimeoutMs = 30_000;
const maxBufferedChars = 8_192;

export async function startFtpServer(
  port: number,
  protocolCaptureService: ProtocolCaptureService,
  snapshotFactory: SnapshotFactory,
): Promise<ProtocolListenerHandle> {
  const server = createServer((socket) => {
    const connectionSnapshot = snapshotFactory();

    socket.setEncoding('utf8');
    socket.setTimeout(connectionTimeoutMs);
    socket.write(`220 ${connectionSnapshot.hostname} FTP server ready\r\n`);

    let buffer = '';
    let username = 'anonymous';

    socket.on('error', () => {
      socket.destroy();
    });
    socket.on('timeout', () => {
      socket.end('421 Idle timeout\r\n');
    });

    socket.on('data', (chunk) => {
      buffer += chunk;
      if (buffer.length > maxBufferedChars) {
        socket.end('421 Input too long\r\n');
        return;
      }

      while (buffer.includes('\n')) {
        const line = buffer.slice(0, buffer.indexOf('\n')).replace(/\r$/, '').trim();
        buffer = buffer.slice(buffer.indexOf('\n') + 1);
        if (!line) {
          continue;
        }

        void handleLine(line);
      }
    });

    const handleLine = async (line: string) => {
      const [rawCommand, ...rest] = line.split(' ');
      const command = rawCommand.toUpperCase();
      const argument = rest.join(' ').trim();
      const snapshot = connectionSnapshot;
      let response = '502 Command not implemented\r\n';
      let closeConnection = false;

      if (command === 'USER') {
        username = argument || username;
        response = '331 Username ok, need password\r\n';
      } else if (command === 'PASS') {
        response = `230 User ${username} logged in\r\n`;
      } else if (command === 'SYST') {
        response = '215 UNIX Type: L8\r\n';
      } else if (command === 'FEAT') {
        response = '211-Features\r\n UTF8\r\n MLSD\r\n211 End\r\n';
      } else if (command === 'PWD') {
        response = `257 "/home/${snapshot.username}" is current directory\r\n`;
      } else if (command === 'LIST') {
        response = `150 Opening ASCII mode data connection\r\n${buildVirtualFileListing(snapshot)}\r\n226 Transfer complete\r\n`;
      } else if (command === 'RETR') {
        response = `150 Opening BINARY mode data connection\r\n${renderVirtualFile(argument, snapshot)}\r\n226 Transfer complete\r\n`;
      } else if (command === 'QUIT') {
        response = '221 Goodbye\r\n';
        closeConnection = true;
      }

      socket.write(response);
      await protocolCaptureService.record({
        method: command,
        path: argument || undefined,
        protocol: 'ftp',
        requestBody: line,
        responseBody: response,
        responseCode: response.startsWith('5') ? 502 : 200,
        service: 'ftp',
        sourceIp: socket.remoteAddress ?? '0.0.0.0',
        sourcePort: socket.remotePort,
      });

      if (closeConnection) {
        socket.end();
      }
    };
  });

  return listenStreamServer('ftp', port, server);
}