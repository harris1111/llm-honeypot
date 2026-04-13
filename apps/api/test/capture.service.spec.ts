import { prisma } from '@llmtrap/db';
import type { CaptureBatchRequest, CaptureRecord } from '@llmtrap/shared';
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

import { AuditService } from '../src/modules/audit/audit.service';
import { CaptureService } from '../src/modules/capture/capture.service';

function createService() {
  const auditService = {
    record: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;

  return {
    auditService,
    service: new CaptureService(auditService),
  };
}

function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

function createRecord(overrides: Partial<CaptureRecord> = {}): CaptureRecord {
  return {
    classification: 'attacker',
    headerHash: 'header-hash-123',
    headers: {
      authorization: 'Bearer token',
    },
    method: 'POST',
    path: '/v1/chat/completions',
    protocol: 'openai',
    requestBody: {
      model: 'gpt-4o',
    },
    responseCode: 200,
    responseStrategy: 'static',
    service: 'openai-http',
    sourceIp: '203.0.113.10',
    sourcePort: 44321,
    timestamp: '2026-04-13T09:30:00.000Z',
    userAgent: 'curl/8.4.0',
    ...overrides,
  };
}

describe('CaptureService', () => {
  it('rejects batches when the provided node key does not match', async () => {
    const transaction = {
      node: {
        findUnique: vi.fn().mockResolvedValue({
          nodeKeyHash: hashSecret('valid-node-key'),
          status: 'ONLINE',
        }),
        updateMany: vi.fn(),
      },
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(transaction as never));
    const { auditService, service } = createService();
    const input: CaptureBatchRequest = {
      nodeId: 'node-123',
      records: [createRecord()],
    };

    await expect(service.ingestBatch('wrong-node-key', input)).rejects.toThrow('Node key is invalid');

    expect(transaction.node.findUnique).toHaveBeenCalledWith({
      select: { nodeKeyHash: true, status: true },
      where: { id: 'node-123' },
    });
    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('deduplicates repeated captures and groups fresh requests into the active session', async () => {
    const duplicate = { id: 'capture-duplicate' };
    const session = {
      classification: 'scanner',
      id: 'session-123',
      userAgent: 'curl/8.3.0',
    };
    const transaction = {
      capturedRequest: {
        create: vi.fn().mockResolvedValue({ id: 'capture-created' }),
        findFirst: vi
          .fn()
          .mockResolvedValueOnce(duplicate)
          .mockResolvedValueOnce(null),
      },
      honeypotSession: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(session),
        update: vi.fn().mockResolvedValue({ id: 'session-123' }),
      },
      node: {
        findUnique: vi.fn().mockResolvedValue({
          nodeKeyHash: hashSecret('valid-node-key'),
          status: 'ONLINE',
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(transaction as never));
    const { auditService, service } = createService();
    const input: CaptureBatchRequest = {
      nodeId: 'node-123',
      records: [
        createRecord(),
        createRecord({
          headerHash: 'header-hash-456',
          timestamp: '2026-04-13T09:31:00.000Z',
        }),
      ],
    };

    const result = await service.ingestBatch('valid-node-key', input);

    expect(result).toEqual({
      ingestedCount: 2,
      nodeId: 'node-123',
    });
    expect(transaction.capturedRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        method: 'POST',
        nodeId: 'node-123',
        path: '/v1/chat/completions',
        protocol: 'openai',
        service: 'openai-http',
        sessionId: 'session-123',
        sourceIp: '203.0.113.10',
        timestamp: new Date('2026-04-13T09:31:00.000Z'),
      }),
    });
    expect(transaction.honeypotSession.update).toHaveBeenCalledWith({
      data: {
        classification: 'attacker',
        endedAt: new Date('2026-04-13T09:31:00.000Z'),
        requestCount: {
          increment: 1,
        },
        userAgent: 'curl/8.4.0',
      },
      where: { id: 'session-123' },
    });
    expect(transaction.node.updateMany).toHaveBeenCalledWith({
      data: {
        lastHeartbeat: expect.any(Date),
        status: 'ONLINE',
      },
      where: {
        id: 'node-123',
        status: 'ONLINE',
      },
    });
    expect(auditService.record).toHaveBeenCalledWith({
      action: 'capture.batch-ingested',
      details: { count: 2 },
      target: 'node-123',
    });
  });
});