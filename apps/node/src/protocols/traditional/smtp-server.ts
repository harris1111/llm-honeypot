import { createServer } from 'node:net';

import { ProtocolCaptureService } from '../../capture/protocol-capture.service';
import { listenStreamServer } from '../protocol-listener';
import type { ProtocolListenerHandle } from '../protocol-server.types';
import type { ProtocolPersonaSnapshot } from '../protocol-persona-snapshot';

type SnapshotFactory = () => ProtocolPersonaSnapshot;
type SmtpListenerName = 'smtp' | 'smtp-submission';

const connectionTimeoutMs = 30_000;
const maxBufferedChars = 8_192;
const maxDataChars = 65_536;

export async function startSmtpServer(
  name: SmtpListenerName,
  port: number,
  protocolCaptureService: ProtocolCaptureService,
  snapshotFactory: SnapshotFactory,
): Promise<ProtocolListenerHandle> {
  const server = createServer((socket) => {
    const connectionSnapshot = snapshotFactory();
    const listenerPath = `/${name}`;

    socket.setEncoding('utf8');
    socket.setTimeout(connectionTimeoutMs);
    socket.write(`220 ${connectionSnapshot.hostname} ESMTP ready\r\n`);

    let authStage: 'password' | 'username' | null = null;
    let buffer = '';
    let dataLines: string[] = [];
    let dataSize = 0;
    let inData = false;

    socket.on('error', () => {
      socket.destroy();
    });
    socket.on('timeout', () => {
      socket.end('421 4.4.2 Idle timeout\r\n');
    });

    socket.on('data', (chunk) => {
      buffer += chunk;
      if (buffer.length > maxBufferedChars) {
        socket.end('421 4.7.0 Input too long\r\n');
        return;
      }

      while (buffer.includes('\n')) {
        const line = buffer.slice(0, buffer.indexOf('\n')).replace(/\r$/, '');
        buffer = buffer.slice(buffer.indexOf('\n') + 1);
        void handleLine(line);
      }
    });

    const handleLine = async (line: string) => {
      const trimmed = line.trim();
      let method = 'SMTP';
      let response = '250 Ok\r\n';
      let closeConnection = false;

      if (inData) {
        if (trimmed === '.') {
          inData = false;
          method = 'DATA';
          response = '250 2.0.0 Queued as llmtrap\r\n';
          socket.write(response);
          await protocolCaptureService.record({
            method,
            path: `${listenerPath}/message`,
            protocol: name,
            requestBody: dataLines.join('\n'),
            responseBody: response,
            responseCode: 200,
            service: name,
            sourceIp: socket.remoteAddress ?? '0.0.0.0',
            sourcePort: socket.remotePort,
          });
          dataLines = [];
          dataSize = 0;
          return;
        }

        dataSize += line.length;
        if (dataSize > maxDataChars) {
          inData = false;
          dataLines = [];
          dataSize = 0;
          socket.write('552 5.3.4 Message size exceeds fixed maximum message size\r\n');
          return;
        }

        dataLines.push(line);
        return;
      }

      if (authStage === 'username') {
        authStage = 'password';
        method = 'AUTH-USERNAME';
        response = '334 UGFzc3dvcmQ6\r\n';
      } else if (authStage === 'password') {
        authStage = null;
        method = 'AUTH-PASSWORD';
        response = '235 2.7.0 Authentication successful\r\n';
      } else {
        const [command = 'NOOP'] = trimmed.split(' ');
        method = command.toUpperCase();

        if (method === 'EHLO' || method === 'HELO') {
          response = `250-${connectionSnapshot.hostname}\r\n250-AUTH LOGIN\r\n250 8BITMIME\r\n`;
        } else if (method === 'AUTH') {
          authStage = 'username';
          response = '334 VXNlcm5hbWU6\r\n';
        } else if (method === 'DATA') {
          inData = true;
          response = '354 End data with <CR><LF>.<CR><LF>\r\n';
        } else if (method === 'QUIT') {
          response = '221 2.0.0 Bye\r\n';
          closeConnection = true;
        }
      }

      socket.write(response);
      await protocolCaptureService.record({
        method,
        path: listenerPath,
        protocol: name,
        requestBody: trimmed,
        responseBody: response,
        responseCode: 200,
        service: name,
        sourceIp: socket.remoteAddress ?? '0.0.0.0',
        sourcePort: socket.remotePort,
      });

      if (closeConnection) {
        socket.end();
      }
    };
  });

  return listenStreamServer(name, port, server);
}