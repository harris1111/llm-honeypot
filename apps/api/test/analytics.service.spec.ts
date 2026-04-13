import { prisma } from '@llmtrap/db';
import { describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from '../src/modules/analytics/analytics.service';

describe('AnalyticsService', () => {
  it('aggregates overview counters and recent top services', async () => {
    vi.mocked(prisma.node.count)
      .mockResolvedValueOnce(5 as never)
      .mockResolvedValueOnce(3 as never)
      .mockResolvedValueOnce(1 as never);
    vi.mocked(prisma.honeypotSession.count).mockResolvedValue(12 as never);
    vi.mocked(prisma.capturedRequest.count).mockResolvedValue(48 as never);
    vi.mocked(prisma.capturedRequest.findMany).mockResolvedValue([
      { service: 'openai' },
      { service: 'openai' },
      { service: 'mcp' },
    ] as never);
    const service = new AnalyticsService();

    await expect(service.getOverview()).resolves.toEqual({
      captures: { total: 48 },
      nodes: { online: 3, pending: 1, total: 5 },
      sessions: { total: 12 },
      topServices: [
        { count: 2, service: 'openai' },
        { count: 1, service: 'mcp' },
      ],
    });
  });
});