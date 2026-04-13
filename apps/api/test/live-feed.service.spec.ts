import { prisma } from '@llmtrap/db';
import { describe, expect, it, vi } from 'vitest';

import { LiveFeedService } from '../src/modules/live-feed/live-feed.service';

describe('LiveFeedService', () => {
  it('lists recent capture events with actor ids', async () => {
    vi.mocked(prisma.capturedRequest.findMany).mockResolvedValueOnce([
      {
        classification: 'scanner',
        id: 'capture-1',
        method: 'GET',
        nodeId: 'node-1',
        path: '/v1/models',
        responseCode: 200,
        responseStrategy: 'template',
        service: 'openai',
        session: { actorId: 'actor-1' },
        sourceIp: '203.0.113.10',
        timestamp: new Date('2026-04-13T12:00:00Z'),
        userAgent: 'scanner/1.0',
      },
    ] as never);

    const service = new LiveFeedService();
    await expect(service.list({ service: 'openai' })).resolves.toEqual([
      expect.objectContaining({ actorId: 'actor-1', id: 'capture-1', service: 'openai' }),
    ]);
  });
});