import { Prisma, prisma } from '@llmtrap/db';
import { userRoleSchema } from '@llmtrap/shared';
import { hash } from 'bcryptjs';
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';

import { AuditService } from '../audit/audit.service';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  role: userRoleSchema.default('VIEWER'),
});

export const updateUserSchema = z.object({
  role: userRoleSchema,
});

@Injectable()
export class UsersService {
  constructor(private readonly auditService: AuditService) {}

  async create(currentUserId: string, input: z.infer<typeof createUserSchema>, ipAddress?: string) {
    const passwordHash = await hash(input.password, 12);
    let user;

    try {
      user = await prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          role: input.role,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A user with that email already exists');
      }

      throw error;
    }

    await this.auditService.record({
      action: 'users.create',
      details: { email: user.email, role: user.role },
      ip: ipAddress,
      target: user.id,
      userId: currentUserId,
    });

    return this.toUserSummary(user.id, user.email, user.role, user.totpEnabled, user.createdAt, user.updatedAt);
  }

  async list() {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return users.map((user) =>
      this.toUserSummary(user.id, user.email, user.role, user.totpEnabled, user.createdAt, user.updatedAt),
    );
  }

  async remove(currentUserId: string, userId: string, ipAddress?: string) {
    if (currentUserId === userId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    await this.runAdminMutation(async (transaction) => {
      const user = await transaction.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role === 'ADMIN') {
        const adminCount = await transaction.user.count({ where: { role: 'ADMIN' } });
        if (adminCount <= 1) {
          throw new ForbiddenException('You cannot remove the last admin');
        }
      }

      await transaction.user.delete({ where: { id: userId } });
    });

    await this.auditService.record({
      action: 'users.delete',
      ip: ipAddress,
      target: userId,
      userId: currentUserId,
    });

    return { success: true };
  }

  async update(currentUserId: string, userId: string, input: z.infer<typeof updateUserSchema>, ipAddress?: string) {
    const updated = await this.runAdminMutation(async (transaction) => {
      const user = await transaction.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role === 'ADMIN' && input.role !== 'ADMIN') {
        const adminCount = await transaction.user.count({ where: { role: 'ADMIN' } });
        if (adminCount <= 1) {
          throw new ForbiddenException('You cannot demote the last admin');
        }
      }

      return transaction.user.update({
        data: {
          role: input.role,
        },
        where: { id: userId },
      });
    });

    await this.auditService.record({
      action: 'users.update',
      details: { role: updated.role },
      ip: ipAddress,
      target: updated.id,
      userId: currentUserId,
    });

    return this.toUserSummary(updated.id, updated.email, updated.role, updated.totpEnabled, updated.createdAt, updated.updatedAt);
  }

  private toUserSummary(
    id: string,
    email: string,
    role: z.infer<typeof userRoleSchema>,
    totpEnabled: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    return {
      createdAt: createdAt.toISOString(),
      email,
      id,
      role,
      totpEnabled,
      updatedAt: updatedAt.toISOString(),
    };
  }

  private async runAdminMutation<T>(operation: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await prisma.$transaction((transaction) => operation(transaction), {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if (error instanceof ForbiddenException || error instanceof NotFoundException) {
          throw error;
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            throw new NotFoundException('User not found');
          }

          if (error.code === 'P2034' && attempt < 2) {
            continue;
          }
        }

        throw error;
      }
    }

    throw new ConflictException('Concurrent admin update detected. Please retry.');
  }
}