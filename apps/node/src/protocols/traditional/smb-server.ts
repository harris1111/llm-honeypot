import { createServer } from 'node:net';

import { ProtocolCaptureService } from '../../capture/protocol-capture.service';
import { listenStreamServer } from '../protocol-listener';
import type { ProtocolListenerHandle } from '../protocol-server.types';

const smbDenyResponse = Buffer.from([
  0x00, 0x00, 0x00, 0x48,
  0xfe, 0x53, 0x4d, 0x42,
  0x40, 0x00, 0x00, 0x00,
  0x22, 0x00, 0x00, 0xc0,
  0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
  0x09, 0x00, 0x48, 0x00,
  0x00, 0x00, 0x00, 0x00,
]);

export async function startSmbServer(
  port: number,
  protocolCaptureService: ProtocolCaptureService,
): Promise<ProtocolListenerHandle> {
  const server = createServer((socket) => {
    socket.setTimeout(30_000);
    socket.on('error', () => {
      socket.destroy();
    });
    socket.on('timeout', () => {
      socket.destroy();
    });

    socket.once('data', (chunk) => {
      socket.write(smbDenyResponse);
      socket.end();

      void protocolCaptureService.record({
        method: 'NEGOTIATE',
        path: '/share',
        protocol: 'smb',
        requestBody: chunk.toString('hex'),
        responseBody: 'STATUS_ACCESS_DENIED',
        responseCode: 5,
        service: 'smb',
        sourceIp: socket.remoteAddress ?? '0.0.0.0',
        sourcePort: socket.remotePort,
      });
    });
  });

  return listenStreamServer('smb', port, server);
}