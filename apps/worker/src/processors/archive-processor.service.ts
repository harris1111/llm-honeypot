import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { prisma } from '@llmtrap/db';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { gzipSync } from 'node:zlib';

import { WorkerRuntimeConfigService } from '../config/worker-runtime-config.service';
import type { WorkerProcessor } from './processor-contract';

@Injectable()
export class ArchiveProcessorService implements WorkerProcessor {
  readonly name = 'archive';

  constructor(private readonly configService: WorkerRuntimeConfigService) {}

  async run() {
    if (!this.isStorageConfigured()) {
      return {
        handled: 0,
        summary: 'archive storage not configured',
      };
    }

    const cutoff = new Date(Date.now() - this.configService.snapshot.storage.retentionDays * 24 * 60 * 60 * 1_000);
    const sessions = await prisma.honeypotSession.findMany({
      include: {
        requests: {
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { endedAt: 'asc' },
      take: this.configService.snapshot.batchSize,
      where: {
        archivedAt: null,
        endedAt: {
          lte: cutoff,
          not: null,
        },
      },
    });

    if (sessions.length === 0) {
      return {
        handled: 0,
        summary: 'no sessions eligible for archival',
      };
    }

    const payload = sessions
      .map((session) =>
        JSON.stringify({
          session: {
            actorId: session.actorId,
            classification: session.classification,
            endedAt: session.endedAt?.toISOString() ?? null,
            id: session.id,
            nodeId: session.nodeId,
            requestCount: session.requestCount,
            service: session.service,
            sourceIp: session.sourceIp,
            startedAt: session.startedAt.toISOString(),
            userAgent: session.userAgent,
          },
          requests: session.requests.map((request) => ({
            classification: request.classification,
            headerHash: request.headerHash,
            id: request.id,
            method: request.method,
            path: request.path,
            responseCode: request.responseCode,
            responseStrategy: request.responseStrategy,
            service: request.service,
            sourceIp: request.sourceIp,
            timestamp: request.timestamp.toISOString(),
            userAgent: request.userAgent,
          })),
        }),
      )
      .join('\n');
    const gzippedPayload = gzipSync(Buffer.from(payload, 'utf8'));
    const storageKey = this.buildStorageKey();
    const requestCount = sessions.reduce((total, session) => total + session.requestCount, 0);
    const archivedAt = new Date();
    const periodStart = sessions.reduce(
      (current, session) => (session.startedAt < current ? session.startedAt : current),
      sessions[0].startedAt,
    );
    const periodEnd = sessions.reduce(
      (current, session) => {
        const endedAt = session.endedAt ?? session.startedAt;
        return endedAt > current ? endedAt : current;
      },
      sessions[0].endedAt ?? sessions[0].startedAt,
    );

    await this.createClient().send(
      new PutObjectCommand({
        Body: gzippedPayload,
        Bucket: this.configService.snapshot.storage.bucket,
        ContentEncoding: 'gzip',
        ContentType: 'application/x-ndjson',
        Key: storageKey,
      }),
    );

    const manifest = await prisma.archiveManifest.create({
      data: {
        archiveSizeBytes: gzippedPayload.byteLength,
        bucket: this.configService.snapshot.storage.bucket ?? '',
        periodEnd,
        periodStart,
        requestCount,
        sessionCount: sessions.length,
        storageKey,
      },
    });

    await prisma.honeypotSession.updateMany({
      data: {
        archiveManifestId: manifest.id,
        archivedAt,
      },
      where: {
        id: {
          in: sessions.map((session) => session.id),
        },
      },
    });

    return {
      handled: sessions.length,
      summary: `archived ${sessions.length} session(s) to ${storageKey}`,
    };
  }

  private buildStorageKey(): string {
    const now = new Date();
    const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

    return `${this.configService.snapshot.storage.archivePrefix}/${month}/${randomUUID()}.jsonl.gz`;
  }

  private createClient(): S3Client {
    return new S3Client({
      credentials: {
        accessKeyId: this.configService.storageCredentials.accessKeyId ?? '',
        secretAccessKey: this.configService.storageCredentials.secretAccessKey ?? '',
      },
      endpoint: this.configService.snapshot.storage.endpoint,
      forcePathStyle: this.configService.snapshot.storage.forcePathStyle,
      region: this.configService.snapshot.storage.region,
    });
  }

  private isStorageConfigured(): boolean {
    return Boolean(
      this.configService.snapshot.storage.bucket &&
        this.configService.snapshot.storage.endpoint &&
        this.configService.storageCredentials.accessKeyId &&
        this.configService.storageCredentials.secretAccessKey,
    );
  }
}