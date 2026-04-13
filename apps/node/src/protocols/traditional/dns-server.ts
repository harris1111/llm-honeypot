import { createSocket } from 'node:dgram';

import { ProtocolCaptureService } from '../../capture/protocol-capture.service';
import { bindDatagramSocket } from '../protocol-listener';
import type { ProtocolListenerHandle } from '../protocol-server.types';
import type { ProtocolPersonaSnapshot } from '../protocol-persona-snapshot';

type SnapshotFactory = () => ProtocolPersonaSnapshot;

function buildAnswerIp(snapshot: ProtocolPersonaSnapshot): [number, number, number, number] {
  const suffix = Math.max(10, Math.min(250, snapshot.nodeId.length * 7));
  return [203, 0, 113, suffix];
}

function buildDnsResponse(question: Buffer, answerIp: [number, number, number, number]): Buffer {
  let offset = 12;
  while (question[offset] !== 0 && offset < question.length) {
    offset += question[offset] + 1;
  }
  offset += 5;

  const header = Buffer.alloc(12);
  question.copy(header, 0, 0, 2);
  header[2] = 0x81;
  header[3] = 0x80;
  header[5] = 0x01;
  header[7] = 0x01;

  const querySection = question.subarray(12, offset);
  const answer = Buffer.from([0xc0, 0x0c, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x3c, 0x00, 0x04, ...answerIp]);
  return Buffer.concat([header, querySection, answer]);
}

function parseQueryName(message: Buffer): string {
  const labels: string[] = [];
  let offset = 12;

  while (offset < message.length && message[offset] !== 0) {
    const length = message[offset] ?? 0;
    labels.push(message.subarray(offset + 1, offset + 1 + length).toString('utf8'));
    offset += length + 1;
  }

  return labels.join('.') || 'unknown.local';
}

export async function startDnsServer(
  port: number,
  protocolCaptureService: ProtocolCaptureService,
  snapshotFactory: SnapshotFactory,
): Promise<ProtocolListenerHandle> {
  const socket = createSocket('udp4');

  socket.on('error', () => undefined);

  socket.on('message', (message, remote) => {
    const snapshot = snapshotFactory();
    const answerIp = buildAnswerIp(snapshot);
    const response = buildDnsResponse(message, answerIp);
    const name = parseQueryName(message);
    socket.send(response, remote.port, remote.address);

    void protocolCaptureService.record({
      method: 'QUERY',
      path: name,
      protocol: 'dns',
      requestBody: message.toString('hex'),
      responseBody: { answer: answerIp.join('.') },
      responseCode: 200,
      service: 'dns',
      sourceIp: remote.address,
      sourcePort: remote.port,
    });
  });

  return bindDatagramSocket('dns', port, socket);
}