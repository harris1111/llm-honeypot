import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma } = vi.hoisted(() => ({
  prisma: {
    alertLog: {
      createMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    alertRule: {
      findMany: vi.fn(),
    },
    honeypotSession: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@llmtrap/db', () => ({ Prisma: {}, prisma }));

import { AlertProcessorService } from '../src/processors/alert-processor.service';

function createConfig(webhookUrl?: string) {
  return {
    snapshot: {
      alerts: {
        webhookTimeoutMs: 250,
        webhookUrl,
      },
      batchSize: 50,
      concurrency: 4,
      intervals: {
        actorMs: 30_000,
        alertMs: 15_000,
        classificationMs: 15_000,
        enrichmentMs: 60_000,
      },
      port: 4100,
    },
  };
}

describe('AlertProcessorService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    prisma.alertRule.findMany.mockResolvedValue([
      {
        channels: ['internal', 'webhook'],
        conditions: { classification: 'attacker' },
        cooldownMin: 5,
        id: 'rule-1',
        name: 'Attacker webhook',
        severity: 'critical',
      },
    ]);
    prisma.honeypotSession.findMany.mockResolvedValue([
      {
        actorId: 'actor-1',
        classification: 'attacker',
        endedAt: new Date('2026-04-14T10:00:00.000Z'),
        id: 'session-1',
        nodeId: 'node-1',
        requestCount: 4,
        requests: [{ path: '/.env' }, { path: '/admin' }],
        service: 'openai',
        sourceIp: '203.0.113.10',
        startedAt: new Date('2026-04-14T09:59:00.000Z'),
      },
    ]);
    prisma.alertLog.findMany.mockResolvedValue([]);
    prisma.alertLog.findFirst.mockResolvedValue(null);
    prisma.alertLog.createMany.mockResolvedValue({ count: 2 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('records successful internal and webhook deliveries', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' },
        status: 202,
      }),
    );

    const service = new AlertProcessorService(createConfig('https://alerts.example.com/webhook') as never);
    const result = await service.run();

    expect(fetch).toHaveBeenCalledWith(
      'https://alerts.example.com/webhook',
      expect.objectContaining({
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    );
    expect(prisma.alertLog.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ channel: 'internal', success: true }),
        expect.objectContaining({ channel: 'webhook', success: true }),
      ]),
    });
    expect(result).toMatchObject({ handled: 2 });
  });

  it('records webhook failures when the worker webhook URL is not configured', async () => {
    const service = new AlertProcessorService(createConfig() as never);
    const result = await service.run();

    expect(fetch).not.toHaveBeenCalled();
    expect(prisma.alertLog.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ channel: 'internal', success: true }),
        expect.objectContaining({
          channel: 'webhook',
          payload: expect.objectContaining({
            delivery: expect.objectContaining({ detail: 'Worker webhook URL is not configured', status: 'failed' }),
          }),
          success: false,
        }),
      ]),
    });
    expect(result).toMatchObject({ handled: 2 });
  });
});