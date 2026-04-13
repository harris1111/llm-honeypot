import { Prisma, prisma } from '@llmtrap/db';
import type { NodeConfig, NodeRegistrationRequest } from '@llmtrap/shared';
import {
  createNodeRequestSchema,
  nodeHeartbeatSchema,
  updateNodeRequestSchema,
} from '@llmtrap/shared';
import { createHash, randomBytes } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { z } from 'zod';

import { apiConfig } from '../../config/env-config';
import { AuditService } from '../audit/audit.service';

type NodeEntity = Prisma.NodeGetPayload<{
  include: { persona: true };
}>;

@Injectable()
export class NodesService {
  private readonly auditService: AuditService;

  constructor(@Inject(AuditService) auditService: AuditService) {
    this.auditService = auditService;
  }

  async approve(currentUserId: string, nodeId: string, ipAddress?: string) {
    const approved = await prisma.node.updateMany({
      data: {
        status: 'ONLINE',
      },
      where: { id: nodeId, status: 'PENDING' },
    });

    if (approved.count === 0) {
      const node = await this.getNodeEntity(nodeId);
      if (node.status === 'DISABLED') {
        throw new ForbiddenException('Disabled nodes cannot be approved');
      }

      throw new ConflictException('Only pending nodes can be approved');
    }

    const updated = await this.getNodeEntity(nodeId);

    await this.auditService.record({
      action: 'nodes.approve',
      ip: ipAddress,
      target: updated.id,
      userId: currentUserId,
    });

    return this.serializeNode(updated);
  }

  async authorizeNodeKey(nodeId: string, rawNodeKey: string, allowPending = false) {
    const node = await this.getNodeEntity(nodeId);
    if (node.nodeKeyHash !== this.hashSecret(rawNodeKey)) {
      throw new UnauthorizedException('Node key is invalid');
    }

    if (!allowPending && node.status !== 'ONLINE') {
      throw new ForbiddenException('Node is not approved');
    }

    return node;
  }

  async create(currentUserId: string, input: z.infer<typeof createNodeRequestSchema>, ipAddress?: string) {
    const nodeKey = `llt_${randomBytes(24).toString('base64url')}`;
    const node = await prisma.node.create({
      data: {
        config: this.toJsonValue(input.config ?? {}),
        hostname: input.hostname,
        name: input.name,
        nodeKeyHash: this.hashSecret(nodeKey),
        nodeKeyPrefix: nodeKey.slice(0, 12),
        personaId: input.personaId ?? null,
        publicIp: input.publicIp,
      },
      include: { persona: true },
    });

    await this.auditService.record({
      action: 'nodes.create',
      details: { name: node.name, nodeKeyPrefix: node.nodeKeyPrefix },
      ip: ipAddress,
      target: node.id,
      userId: currentUserId,
    });

    return {
      node: this.serializeNode(node),
      nodeKey,
    };
  }

  async getConfig(nodeId: string, rawNodeKey: string): Promise<NodeConfig> {
    const node = await this.authorizeNodeKey(nodeId, rawNodeKey);
    return this.serializeNodeConfig(node);
  }

  async getOne(nodeId: string) {
    const node = await this.getNodeEntity(nodeId);
    return this.serializeNode(node);
  }

  async list() {
    const nodes = await prisma.node.findMany({
      include: { persona: true },
      orderBy: { createdAt: 'asc' },
    });

    return nodes.map((node) => this.serializeNode(node));
  }

  async recordHeartbeat(nodeId: string, rawNodeKey: string, input: z.infer<typeof nodeHeartbeatSchema>) {
    const node = await this.authorizeNodeKey(nodeId, rawNodeKey);

    const updated = await prisma.node.updateMany({
      data: {
        lastHeartbeat: new Date(input.receivedAt),
        status: 'ONLINE',
      },
      where: { id: node.id, status: 'ONLINE' },
    });

    if (updated.count === 0) {
      throw new ForbiddenException('Node is not approved');
    }

    return {
      bufferSize: input.bufferSize,
      graceSeconds: apiConfig.nodes.heartbeatGraceSeconds,
      requestCount: input.requestCount,
      status: 'ONLINE',
    };
  }

  async register(input: NodeRegistrationRequest) {
    const nodeKeyHash = this.hashSecret(input.nodeKey);

    return this.runNodeMutation(async (transaction) => {
      const node = await transaction.node.findFirst({
        include: { persona: true },
        where: { nodeKeyHash },
      });

      if (!node) {
        throw new UnauthorizedException('Node key is invalid');
      }

      if (node.status === 'DISABLED') {
        throw new ForbiddenException('Node is disabled');
      }

      const nextStatus = node.status === 'PENDING' && !apiConfig.nodes.autoApprove ? 'PENDING' : 'ONLINE';
      const updated = await transaction.node.update({
        data: {
          hostname: input.hostname,
          lastHeartbeat: nextStatus === 'ONLINE' ? new Date() : node.lastHeartbeat,
          publicIp: input.publicIp ?? node.publicIp,
          status: nextStatus,
        },
        include: { persona: true },
        where: { id: node.id },
      });

      return {
        autoApproved: nextStatus === 'ONLINE',
        config: nextStatus === 'ONLINE' ? this.serializeNodeConfig(updated) : null,
        node: this.serializeNode(updated),
      };
    });
  }

  async remove(currentUserId: string, nodeId: string, ipAddress?: string) {
    await this.getNodeEntity(nodeId);
    await prisma.node.delete({ where: { id: nodeId } });

    await this.auditService.record({
      action: 'nodes.delete',
      ip: ipAddress,
      target: nodeId,
      userId: currentUserId,
    });

    return { success: true };
  }

  async update(currentUserId: string, nodeId: string, input: z.infer<typeof updateNodeRequestSchema>, ipAddress?: string) {
    const updated = await this.runNodeMutation(async (transaction) => {
      const node = await transaction.node.findUnique({
        include: { persona: true },
        where: { id: nodeId },
      });

      if (!node) {
        throw new NotFoundException('Node not found');
      }

      const nextStatus = input.status ?? node.status;
      if (node.status === 'DISABLED' && nextStatus !== 'DISABLED') {
        throw new ForbiddenException('Disabled nodes cannot be reactivated via update');
      }

      if (nextStatus === 'ONLINE' && node.status !== 'ONLINE') {
        throw new ForbiddenException('Use node approval or node registration to bring a node online');
      }

      return transaction.node.update({
        data: {
          config: input.config ? this.toJsonValue(input.config) : undefined,
          hostname: input.hostname,
          name: input.name,
          personaId: input.personaId,
          publicIp: input.publicIp,
          status: input.status,
        },
        include: { persona: true },
        where: { id: nodeId },
      });
    });

    await this.auditService.record({
      action: 'nodes.update',
      details: { status: updated.status },
      ip: ipAddress,
      target: updated.id,
      userId: currentUserId,
    });

    return this.serializeNode(updated);
  }

  private async getNodeEntity(nodeId: string) {
    const node = await prisma.node.findUnique({
      include: { persona: true },
      where: { id: nodeId },
    });

    if (!node) {
      throw new NotFoundException('Node not found');
    }

    return node;
  }

  private hashSecret(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
  }

  private serializeNode(node: NodeEntity) {
    return {
      config: (node.config as Record<string, unknown> | null) ?? {},
      hostname: node.hostname,
      id: node.id,
      lastHeartbeat: node.lastHeartbeat?.toISOString() ?? null,
      name: node.name,
      nodeKeyPrefix: node.nodeKeyPrefix,
      personaId: node.personaId,
      publicIp: node.publicIp,
      status: node.status,
    };
  }

  private serializeNodeConfig(node: NodeEntity): NodeConfig {
    const persona = node.persona
      ? ({
          configFiles: node.persona.configFiles as Record<string, boolean>,
          credentials: node.persona.credentials as Record<string, string>,
          hardware: node.persona.hardware,
          identity: node.persona.identity,
          models: node.persona.models,
          name: node.persona.name,
          preset: node.persona.preset,
          services: node.persona.services as Record<string, boolean>,
          timing: node.persona.timing,
        } as NonNullable<NodeConfig['persona']>)
      : null;

    return {
      config: (node.config as Record<string, unknown> | null) ?? {},
      node: this.serializeNode(node),
      persona,
      services: (node.persona?.services as Record<string, boolean> | null) ?? {},
    };
  }

  private toJsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }

  private async runNodeMutation<T>(operation: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await prisma.$transaction((transaction) => operation(transaction), {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if (
          error instanceof ForbiddenException ||
          error instanceof NotFoundException ||
          error instanceof UnauthorizedException
        ) {
          throw error;
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 2) {
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException('Concurrent node update detected. Please retry.');
  }
}