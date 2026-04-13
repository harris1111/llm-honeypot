import { Prisma, prisma } from '@llmtrap/db';
import type { CaptureBatchRequest, CaptureRecord } from '@llmtrap/shared';
import { createHash } from 'node:crypto';
import { ForbiddenException, Injectable } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';

@Injectable()
export class CaptureService {
  constructor(private readonly auditService: AuditService) {}

  async ingestBatch(rawNodeKey: string, input: CaptureBatchRequest) {
    const ingestedIds = await prisma.$transaction(async (transaction) => {
      const node = await transaction.node.findUnique({
        select: { nodeKeyHash: true, status: true },
        where: { id: input.nodeId },
      });

      if (!node || node.nodeKeyHash !== this.hashSecret(rawNodeKey)) {
        throw new ForbiddenException('Node key is invalid');
      }

      if (node.status !== 'ONLINE') {
        throw new ForbiddenException('Node is not approved');
      }

      const ids: string[] = [];

      for (const record of input.records) {
        const timestamp = new Date(record.timestamp);
        const duplicate = await transaction.capturedRequest.findFirst({
          where: {
            headerHash: record.headerHash ?? null,
            method: record.method,
            nodeId: input.nodeId,
            path: record.path ?? null,
            service: record.service,
            sourceIp: record.sourceIp,
            timestamp,
          },
        });

        if (duplicate) {
          ids.push(duplicate.id);
          continue;
        }

        const session = await this.resolveSession(transaction, input.nodeId, record);
        const created = await transaction.capturedRequest.create({
          data: {
            classification: record.classification,
            geo: record.geo as Prisma.InputJsonValue | undefined,
            headerHash: record.headerHash,
            headers: record.headers as Prisma.InputJsonValue | undefined,
            method: record.method,
            nodeId: input.nodeId,
            path: record.path,
            protocol: record.protocol,
            requestBody: record.requestBody as Prisma.InputJsonValue | undefined,
            responseBody: record.responseBody as Prisma.InputJsonValue | undefined,
            responseCode: record.responseCode,
            responseStrategy: record.responseStrategy,
            service: record.service,
            sessionId: session.id,
            sourceIp: record.sourceIp,
            sourcePort: record.sourcePort,
            timestamp,
            tlsFingerprint: record.tlsFingerprint,
            userAgent: record.userAgent,
          },
        });

        ids.push(created.id);
      }

      const updated = await transaction.node.updateMany({
        data: {
          lastHeartbeat: new Date(),
          status: 'ONLINE',
        },
        where: { id: input.nodeId, status: 'ONLINE' },
      });

      if (updated.count === 0) {
        throw new ForbiddenException('Node is not approved');
      }

      return ids;
    });

    await this.auditService.record({
      action: 'capture.batch-ingested',
      details: { count: ingestedIds.length },
      target: input.nodeId,
    });

    return {
      ingestedCount: ingestedIds.length,
      nodeId: input.nodeId,
    };
  }

  private async resolveSession(
    transaction: Prisma.TransactionClient,
    nodeId: string,
    record: CaptureRecord,
  ) {
    const timestamp = new Date(record.timestamp);
    const sessionWindowStart = new Date(timestamp.getTime() - 5 * 60 * 1000);

    const existing = await transaction.honeypotSession.findFirst({
      orderBy: { endedAt: 'desc' },
      where: {
        endedAt: {
          gte: sessionWindowStart,
        },
        nodeId,
        service: record.service,
        sourceIp: record.sourceIp,
      },
    });

    if (existing) {
      return transaction.honeypotSession.update({
        data: {
          classification: record.classification ?? existing.classification,
          endedAt: timestamp,
          requestCount: {
            increment: 1,
          },
          userAgent: record.userAgent ?? existing.userAgent,
        },
        where: { id: existing.id },
      });
    }

    return transaction.honeypotSession.create({
      data: {
        classification: record.classification,
        endedAt: timestamp,
        nodeId,
        requestCount: 1,
        service: record.service,
        sourceIp: record.sourceIp,
        startedAt: timestamp,
        userAgent: record.userAgent,
      },
    });
  }

  private hashSecret(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
  }
}