import { Prisma, prisma } from '@llmtrap/db';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import type { AlertRuleInput } from './alerts.schemas';

@Injectable()
export class AlertsService {
  constructor(@Inject(AuditService) private readonly auditService: AuditService) {}

  async create(currentUserId: string, input: AlertRuleInput, ipAddress?: string) {
    const created = await prisma.alertRule.create({
      data: {
        channels: input.channels,
        conditions: input.conditions as Prisma.InputJsonValue,
        cooldownMin: input.cooldownMin,
        enabled: input.enabled,
        name: input.name,
        severity: input.severity,
      },
    });

    await this.auditService.record({ action: 'alerts.create', ip: ipAddress, target: created.id, userId: currentUserId });
    return this.serializeRule(created);
  }

  async listRules() {
    const rules = await prisma.alertRule.findMany({ orderBy: { createdAt: 'asc' } });
    return rules.map((rule) => this.serializeRule(rule));
  }

  async listLogs() {
    return prisma.alertLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 100,
    });
  }

  async remove(currentUserId: string, ruleId: string, ipAddress?: string) {
    await this.requireRule(ruleId);
    await prisma.alertRule.delete({ where: { id: ruleId } });
    await this.auditService.record({ action: 'alerts.delete', ip: ipAddress, target: ruleId, userId: currentUserId });
    return { success: true };
  }

  async update(currentUserId: string, ruleId: string, input: AlertRuleInput, ipAddress?: string) {
    await this.requireRule(ruleId);
    const updated = await prisma.alertRule.update({
      data: {
        channels: input.channels,
        conditions: input.conditions as Prisma.InputJsonValue,
        cooldownMin: input.cooldownMin,
        enabled: input.enabled,
        name: input.name,
        severity: input.severity,
      },
      where: { id: ruleId },
    });

    await this.auditService.record({ action: 'alerts.update', ip: ipAddress, target: ruleId, userId: currentUserId });
    return this.serializeRule(updated);
  }

  private async requireRule(ruleId: string) {
    const rule = await prisma.alertRule.findUnique({ where: { id: ruleId } });
    if (!rule) {
      throw new NotFoundException('Alert rule not found');
    }

    return rule;
  }

  private serializeRule(rule: Prisma.AlertRuleGetPayload<Record<string, never>>) {
    return {
      channels: rule.channels,
      conditions: rule.conditions,
      cooldownMin: rule.cooldownMin,
      createdAt: rule.createdAt.toISOString(),
      enabled: rule.enabled,
      id: rule.id,
      name: rule.name,
      severity: rule.severity,
      updatedAt: rule.updatedAt.toISOString(),
    };
  }
}