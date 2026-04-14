import { prisma } from '@llmtrap/db';
import { describe, expect, it, vi } from 'vitest';

import { AlertsService } from '../src/modules/alerts/alerts.service';
import { AuditService } from '../src/modules/audit/audit.service';

function createService() {
  const auditService = {
    record: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;

  return {
    auditService,
    service: new AlertsService(auditService),
  };
}

describe('AlertsService', () => {
  it('creates alert rules and records audit state', async () => {
    vi.mocked(prisma.alertRule.create).mockResolvedValue({
      channels: ['discord'],
      conditions: { classification: 'attacker' },
      cooldownMin: 10,
      createdAt: new Date('2026-04-13T12:00:00.000Z'),
      enabled: true,
      id: 'rule-123',
      name: 'Critical attacker',
      severity: 'critical',
      updatedAt: new Date('2026-04-13T12:00:00.000Z'),
    } as never);
    const { auditService, service } = createService();

    const result = await service.create(
      'user-123',
      {
        channels: ['discord'],
        conditions: { classification: 'attacker' },
        cooldownMin: 10,
        enabled: true,
        name: 'Critical attacker',
        severity: 'critical',
      },
      '203.0.113.10',
    );

    expect(result.id).toBe('rule-123');
    expect(auditService.record).toHaveBeenCalledWith({
      action: 'alerts.create',
      ip: '203.0.113.10',
      target: 'rule-123',
      userId: 'user-123',
    });
  });

  it('serializes delivery detail for alert logs', async () => {
    vi.mocked(prisma.alertLog.findMany).mockResolvedValue([
      {
        channel: 'webhook',
        id: 'log-1',
        payload: {
          classification: 'attacker',
          delivery: {
            attemptedAt: '2026-04-14T10:05:00.000Z',
            detail: 'Webhook request failed with status 500',
            httpStatus: 500,
            status: 'failed',
          },
          nodeId: 'node-1',
          paths: ['/.env'],
          requestCount: 4,
          service: 'openai',
          sessionId: 'session-1',
          sourceIp: '203.0.113.10',
        },
        rule: {
          name: 'Attacker webhook',
          severity: 'critical',
        },
        ruleId: 'rule-1',
        sentAt: new Date('2026-04-14T10:05:00.000Z'),
        success: false,
      },
    ] as never);

    const { service } = createService();
    const logs = await service.listLogs();

    expect(logs).toEqual([
      expect.objectContaining({
        channel: 'webhook',
        deliveryDetail: 'Webhook request failed with status 500',
        deliveryStatus: 'failed',
        deliveryStatusCode: 500,
        ruleName: 'Attacker webhook',
        ruleSeverity: 'critical',
        sourceIp: '203.0.113.10',
      }),
    ]);
  });
});