import { Prisma, prisma } from '@llmtrap/db';
import { Injectable } from '@nestjs/common';

export interface AuditLogInput {
  action: string;
  details?: Record<string, unknown>;
  ip?: string;
  target?: string;
  userId?: string;
}

@Injectable()
export class AuditService {
  async record(input: AuditLogInput): Promise<void> {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        details: input.details as Prisma.InputJsonValue | undefined,
        ip: input.ip,
        target: input.target,
        user: input.userId ? { connect: { id: input.userId } } : undefined,
      },
    });
  }
}