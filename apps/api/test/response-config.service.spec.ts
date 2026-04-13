import { prisma } from '@llmtrap/db';
import { describe, expect, it, vi } from 'vitest';

import { AuditService } from '../src/modules/audit/audit.service';
import { ResponseConfigService } from '../src/modules/response-config/response-config.service';

function createService() {
  const auditService = {
    record: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;

  return {
    auditService,
    service: new ResponseConfigService(auditService),
  };
}

describe('ResponseConfigService', () => {
  it('returns defaults when a node has no saved response config', async () => {
    vi.mocked(prisma.node.findUnique).mockResolvedValue({
      config: {},
      id: 'node-123',
    } as never);
    const { service } = createService();

    const result = await service.get('node-123');

    expect(result.strategyChain).toEqual(['smart', 'fixed_n', 'budget']);
    expect(result.proxy.baseUrl).toBe('');
  });

  it('persists response config under node.config.responseConfig and audits the change', async () => {
    vi.mocked(prisma.node.findUnique).mockResolvedValue({
      config: { keep: 'me' },
      id: 'node-123',
    } as never);
    vi.mocked(prisma.node.update).mockResolvedValue({
      config: { keep: 'me' },
      id: 'node-123',
    } as never);
    const { auditService, service } = createService();

    const result = await service.update(
      'user-123',
      'node-123',
      {
        backfeed: { autoApprove: false, budgetLimitUsd: 2, enabled: true, maxPerDay: 50 },
        budget: { alertAt: [0.8, 1], monthlyLimitUsd: 10 },
        fixedN: { n: 5, resetPeriod: 'weekly' },
        proxy: { apiKey: 'secret', baseUrl: 'https://proxy.example.com/v1', maxRetries: 2, model: 'gpt-4.1-mini', systemPrompt: '', timeoutMs: 30000 },
        smart: { confidenceThreshold: 0.8, validationPatterns: ['what model are you'] },
        strategyChain: ['smart', 'budget'],
      },
      '203.0.113.10',
    );

    expect(prisma.node.update).toHaveBeenCalledWith({
      data: {
        config: expect.objectContaining({
          keep: 'me',
          responseConfig: expect.objectContaining({
            strategyChain: ['smart', 'budget'],
          }),
        }),
      },
      where: { id: 'node-123' },
    });
    expect(result.strategyChain).toEqual(['smart', 'budget']);
    expect(auditService.record).toHaveBeenCalledWith({
      action: 'response-config.update',
      details: { strategyChain: ['smart', 'budget'] },
      ip: '203.0.113.10',
      target: 'node-123',
      userId: 'user-123',
    });
  });
});