import { Prisma, prisma } from '@llmtrap/db';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { responseConfigSchema, type ResponseConfigRecord } from './response-config.schemas';

const defaultResponseConfig = responseConfigSchema.parse({});

@Injectable()
export class ResponseConfigService {
  constructor(@Inject(AuditService) private readonly auditService: AuditService) {}

  async get(nodeId: string): Promise<ResponseConfigRecord> {
    const node = await prisma.node.findUnique({ where: { id: nodeId } });
    if (!node) {
      throw new NotFoundException('Node not found');
    }

    return this.readResponseConfig(node.config);
  }

  async update(
    currentUserId: string,
    nodeId: string,
    input: ResponseConfigRecord,
    ipAddress?: string,
  ): Promise<ResponseConfigRecord> {
    const node = await prisma.node.findUnique({ where: { id: nodeId } });
    if (!node) {
      throw new NotFoundException('Node not found');
    }

    const nextConfig = {
      ...((node.config as Record<string, unknown> | null) ?? {}),
      responseConfig: responseConfigSchema.parse(input),
    };

    await prisma.node.update({
      data: {
        config: nextConfig as Prisma.InputJsonValue,
      },
      where: { id: nodeId },
    });

    await this.auditService.record({
      action: 'response-config.update',
      details: { strategyChain: input.strategyChain },
      ip: ipAddress,
      target: nodeId,
      userId: currentUserId,
    });

    return responseConfigSchema.parse(input);
  }

  private readResponseConfig(config: Prisma.JsonValue | null | undefined): ResponseConfigRecord {
    if (!config || typeof config !== 'object' || !('responseConfig' in config)) {
      return defaultResponseConfig;
    }

    return responseConfigSchema.parse((config as { responseConfig?: unknown }).responseConfig ?? {});
  }
}