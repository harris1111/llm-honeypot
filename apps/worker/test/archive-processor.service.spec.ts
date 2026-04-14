import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma } = vi.hoisted(() => ({
  prisma: {
    archiveManifest: {
      create: vi.fn(),
    },
    honeypotSession: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

const sendMock = vi.hoisted(() => vi.fn());

vi.mock('@llmtrap/db', () => ({ Prisma: {}, prisma }));
vi.mock('@aws-sdk/client-s3', () => ({
  PutObjectCommand: class PutObjectCommand {
    constructor(readonly input: unknown) {}
  },
  S3Client: class S3Client {
    send = sendMock;
  },
}));

import { ArchiveProcessorService } from '../src/processors/archive-processor.service';

function createConfig(configured = true) {
  return {
    snapshot: {
      alerts: {
        webhookTimeoutMs: 250,
        webhookUrl: undefined,
      },
      batchSize: 50,
      concurrency: 4,
      intervals: {
        actorMs: 30_000,
        alertMs: 15_000,
        archiveMs: 60_000,
        classificationMs: 15_000,
        enrichmentMs: 60_000,
      },
      port: 4100,
      storage: {
        archivePrefix: 'archives',
        bucket: configured ? 'llmtrap-archive' : undefined,
        endpoint: configured ? 'http://minio:9000' : undefined,
        forcePathStyle: true,
        region: 'auto',
        retentionDays: 30,
      },
    },
    storageCredentials: {
      accessKeyId: configured ? 'minioadmin' : undefined,
      secretAccessKey: configured ? 'minioadmin' : undefined,
    },
  };
}

describe('ArchiveProcessorService', () => {
  beforeEach(() => {
    prisma.archiveManifest.create.mockResolvedValue({ id: 'manifest-1' });
    prisma.honeypotSession.findMany.mockResolvedValue([]);
    prisma.honeypotSession.updateMany.mockResolvedValue({ count: 0 });
    sendMock.mockResolvedValue({ ETag: 'etag-1' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('skips archival when storage is not configured', async () => {
    const service = new ArchiveProcessorService(createConfig(false) as never);
    const result = await service.run();

    expect(result).toMatchObject({ handled: 0, summary: 'archive storage not configured' });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('uploads archived sessions and records a manifest', async () => {
    prisma.honeypotSession.findMany.mockResolvedValue([
      {
        actorId: 'actor-1',
        archivedAt: null,
        classification: 'attacker',
        endedAt: new Date('2026-03-01T00:30:00.000Z'),
        id: 'session-1',
        nodeId: 'node-1',
        requestCount: 2,
        requests: [
          {
            classification: 'attacker',
            headerHash: 'header-1',
            id: 'request-1',
            method: 'GET',
            path: '/.env',
            responseCode: 200,
            responseStrategy: 'template',
            service: 'openai',
            sourceIp: '203.0.113.10',
            timestamp: new Date('2026-03-01T00:00:00.000Z'),
            userAgent: 'curl/8.4.0',
          },
        ],
        service: 'openai',
        sourceIp: '203.0.113.10',
        startedAt: new Date('2026-03-01T00:00:00.000Z'),
        userAgent: 'curl/8.4.0',
      },
    ]);

    const service = new ArchiveProcessorService(createConfig() as never);
    const result = await service.run();

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(prisma.archiveManifest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bucket: 'llmtrap-archive',
        requestCount: 2,
        sessionCount: 1,
      }),
    });
    expect(prisma.honeypotSession.updateMany).toHaveBeenCalledWith({
      data: expect.objectContaining({ archiveManifestId: 'manifest-1', archivedAt: expect.any(Date) }),
      where: { id: { in: ['session-1'] } },
    });
    expect(result).toMatchObject({ handled: 1 });
  });
});