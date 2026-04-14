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
    const logs = await prisma.alertLog.findMany({
      include: {
        rule: {
          select: {
            name: true,
            severity: true,
          },
        },
      },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });

    return logs.map((log) => this.serializeLog(log));
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

  private serializeLog(
    log: Prisma.AlertLogGetPayload<{
      include: {
        rule: {
          select: {
            name: true;
            severity: true;
          };
        };
      };
    }>,
  ) {
    const payload = (log.payload as {
      actorId?: string | null;
      classification?: string | null;
      delivery?: {
        attemptedAt?: string;
        channel?: string;
        detail?: string;
        httpStatus?: number;
        status?: string;
      } | null;
      nodeId?: string;
      paths?: string[];
      requestCount?: number;
      service?: string;
      sessionId?: string;
      sourceIp?: string;
    } | null) ?? null;

    return {
      channel: log.channel,
      classification: payload?.classification ?? null,
      deliveryAttemptedAt: payload?.delivery?.attemptedAt ?? null,
      deliveryDetail: payload?.delivery?.detail ?? null,
      deliveryStatus: payload?.delivery?.status ?? (log.success ? 'sent' : 'failed'),
      deliveryStatusCode: payload?.delivery?.httpStatus ?? null,
      id: log.id,
      nodeId: payload?.nodeId ?? null,
      paths: payload?.paths ?? [],
      requestCount: payload?.requestCount ?? null,
      ruleId: log.ruleId,
      ruleName: log.rule.name,
      ruleSeverity: log.rule.severity,
      sentAt: log.sentAt.toISOString(),
      service: payload?.service ?? null,
      sessionId: payload?.sessionId ?? null,
      sourceIp: payload?.sourceIp ?? null,
      success: log.success,
    };
  }
}