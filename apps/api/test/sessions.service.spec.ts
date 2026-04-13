import { prisma } from '@llmtrap/db';
import { describe, expect, it, vi } from 'vitest';

import { SessionsService } from '../src/modules/sessions/sessions.service';

describe('SessionsService', () => {
  it('lists recent sessions with applied filters', async () => {
    vi.mocked(prisma.honeypotSession.findMany).mockResolvedValue([
      {
        actorId: null,
        classification: 'validator',
        endedAt: new Date('2026-04-13T12:05:00.000Z'),
        id: 'session-123',
        nodeId: 'node-123',
        requestCount: 4,
        service: 'openai',
        sourceIp: '203.0.113.10',
        startedAt: new Date('2026-04-13T12:00:00.000Z'),
        userAgent: 'curl/8.4.0',
      },
    ] as never);
    const service = new SessionsService();

    const result = await service.list({ classification: 'validator', nodeId: 'node-123', service: 'openai' });

    expect(prisma.honeypotSession.findMany).toHaveBeenCalledWith({
      orderBy: { startedAt: 'desc' },
      take: 100,
      where: {
        classification: 'validator',
        nodeId: 'node-123',
        service: 'openai',
      },
    });
    expect(result[0]).toEqual(expect.objectContaining({ id: 'session-123', service: 'openai' }));
  });

  it('returns a session detail with request timeline', async () => {
    vi.mocked(prisma.honeypotSession.findUnique).mockResolvedValue({
      actorId: 'actor-123',
      classification: 'scanner',
      endedAt: new Date('2026-04-13T12:10:00.000Z'),
      id: 'session-123',
      nodeId: 'node-123',
      requestCount: 2,
      service: 'mcp',
      sourceIp: '203.0.113.10',
      startedAt: new Date('2026-04-13T12:00:00.000Z'),
      userAgent: 'curl/8.4.0',
    } as never);
    vi.mocked(prisma.capturedRequest.findMany).mockResolvedValue([
      {
        classification: 'scanner',
        id: 'req-1',
        method: 'GET',
        path: '/.well-known/mcp.json',
        responseCode: 200,
        service: 'mcp',
        timestamp: new Date('2026-04-13T12:00:01.000Z'),
      },
    ] as never);
    const service = new SessionsService();

    const result = await service.getOne('session-123');

    expect(result.requests).toEqual([
      {
        classification: 'scanner',
        id: 'req-1',
        method: 'GET',
        path: '/.well-known/mcp.json',
        responseCode: 200,
        service: 'mcp',
        timestamp: '2026-04-13T12:00:01.000Z',
      },
    ]);
  });
});