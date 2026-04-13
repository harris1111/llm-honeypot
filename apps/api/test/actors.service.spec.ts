import { prisma } from '@llmtrap/db';
import { describe, expect, it, vi } from 'vitest';

import { ActorsService } from '../src/modules/actors/actors.service';
import { AuditService } from '../src/modules/audit/audit.service';

function createAuditService(): AuditService {
  return { record: vi.fn().mockResolvedValue(undefined) } as unknown as AuditService;
}

describe('ActorsService', () => {
  it('lists actors with derived source IPs and services', async () => {
    vi.mocked(prisma.actor.findMany).mockResolvedValueOnce([
      {
        firstSeen: new Date('2026-04-13T10:00:00Z'),
        headerFingerprint: 'hdr-1',
        id: 'actor-1',
        label: 'Actor 1',
        lastSeen: new Date('2026-04-13T11:00:00Z'),
        mergedFrom: [],
        sessionCount: 2,
        sessions: [
          { service: 'openai', sourceIp: '203.0.113.10' },
          { service: 'mcp', sourceIp: '203.0.113.10' },
        ],
        tlsFingerprints: ['tls-1'],
        userAgents: ['scanner/1.0'],
      },
    ] as never);

    const service = new ActorsService(createAuditService());
    await expect(service.list()).resolves.toEqual([
      expect.objectContaining({
        id: 'actor-1',
        recentServices: ['openai', 'mcp'],
        sourceIps: ['203.0.113.10'],
      }),
    ]);
  });

  it('merges actors and returns the refreshed target actor', async () => {
    vi.mocked(prisma.actor.findMany).mockResolvedValueOnce([
      {
        firstSeen: new Date('2026-04-13T09:00:00Z'),
        headerFingerprint: 'hdr-1',
        id: 'actor-a',
        label: 'Alpha',
        lastSeen: new Date('2026-04-13T11:00:00Z'),
        mergedFrom: [],
        sessionCount: 1,
        tlsFingerprints: ['tls-a'],
        userAgents: ['ua-a'],
      },
      {
        firstSeen: new Date('2026-04-13T08:00:00Z'),
        headerFingerprint: null,
        id: 'actor-b',
        label: 'Bravo',
        lastSeen: new Date('2026-04-13T12:00:00Z'),
        mergedFrom: [],
        sessionCount: 1,
        tlsFingerprints: ['tls-b'],
        userAgents: ['ua-b'],
      },
    ] as never);
    vi.mocked(prisma.honeypotSession.findMany).mockResolvedValueOnce([{ id: 'session-1' }, { id: 'session-2' }] as never);
    vi.mocked(prisma.honeypotSession.updateMany).mockResolvedValueOnce({ count: 1 } as never);
    vi.mocked(prisma.actor.update).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.actor.deleteMany).mockResolvedValueOnce({ count: 1 } as never);
    (prisma.$transaction as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(async (callback: (tx: typeof prisma) => Promise<unknown>) =>
      callback(prisma),
    );
    vi.mocked(prisma.actor.findUnique).mockResolvedValueOnce({
      firstSeen: new Date('2026-04-13T08:00:00Z'),
      headerFingerprint: 'hdr-1',
      id: 'actor-a',
      label: 'Combined',
      lastSeen: new Date('2026-04-13T12:00:00Z'),
      mergedFrom: ['actor-b'],
      sessionCount: 2,
      sessions: [
        {
          classification: 'scanner',
          endedAt: null,
          id: 'session-1',
          nodeId: 'node-1',
          requestCount: 2,
          service: 'openai',
          sourceIp: '203.0.113.5',
          startedAt: new Date('2026-04-13T09:00:00Z'),
          userAgent: 'ua-a',
        },
      ],
      tlsFingerprints: ['tls-a', 'tls-b'],
      userAgents: ['ua-a', 'ua-b'],
    } as never);

    const service = new ActorsService(createAuditService());
    await expect(service.merge('user-1', { label: 'Combined', sourceActorIds: ['actor-a', 'actor-b'] }, '127.0.0.1')).resolves.toEqual(
      expect.objectContaining({ id: 'actor-a', label: 'Combined', mergedFrom: ['actor-b'] }),
    );
  });

  it('splits an actor and deletes the source actor when no sessions remain', async () => {
    vi.mocked(prisma.actor.findUnique).mockResolvedValueOnce({
      firstSeen: new Date('2026-04-13T08:00:00Z'),
      headerFingerprint: 'hdr-1',
      id: 'actor-a',
      label: 'Alpha',
      lastSeen: new Date('2026-04-13T12:00:00Z'),
      mergedFrom: [],
      sessionCount: 1,
      tlsFingerprints: ['tls-a'],
      userAgents: ['ua-a'],
    } as never);
    vi.mocked(prisma.honeypotSession.findMany)
      .mockResolvedValueOnce([
        {
          endedAt: null,
          id: 'session-1',
          startedAt: new Date('2026-04-13T09:00:00Z'),
          userAgent: 'ua-a',
        },
      ] as never)
      .mockResolvedValueOnce([] as never);
    vi.mocked(prisma.capturedRequest.findMany).mockResolvedValueOnce([
      { headerHash: 'hdr-1', tlsFingerprint: 'tls-a', userAgent: 'ua-a' },
    ] as never);
    vi.mocked(prisma.actor.create).mockResolvedValueOnce({ id: 'actor-split' } as never);
    vi.mocked(prisma.honeypotSession.updateMany).mockResolvedValueOnce({ count: 1 } as never);
    vi.mocked(prisma.actor.deleteMany).mockResolvedValueOnce({ count: 1 } as never);
    (prisma.$transaction as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(async (callback: (tx: typeof prisma) => Promise<unknown>) =>
      callback(prisma),
    );
    vi.mocked(prisma.actor.findUnique).mockResolvedValueOnce({
      firstSeen: new Date('2026-04-13T09:00:00Z'),
      headerFingerprint: 'hdr-1',
      id: 'actor-split',
      label: 'Alpha split',
      lastSeen: new Date('2026-04-13T09:00:00Z'),
      mergedFrom: ['actor-a'],
      sessionCount: 1,
      sessions: [
        {
          classification: 'scanner',
          endedAt: null,
          id: 'session-1',
          nodeId: 'node-1',
          requestCount: 2,
          service: 'openai',
          sourceIp: '203.0.113.5',
          startedAt: new Date('2026-04-13T09:00:00Z'),
          userAgent: 'ua-a',
        },
      ],
      tlsFingerprints: ['tls-a'],
      userAgents: ['ua-a'],
    } as never);

    const service = new ActorsService(createAuditService());
    await expect(service.split('user-1', 'actor-a', { label: 'Alpha split', sessionIds: ['session-1'] }, '127.0.0.1')).resolves.toEqual(
      expect.objectContaining({ id: 'actor-split', label: 'Alpha split', mergedFrom: ['actor-a'] }),
    );
  });
});