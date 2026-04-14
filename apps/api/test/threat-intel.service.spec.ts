import { prisma } from '@llmtrap/db';
import { describe, expect, it, vi } from 'vitest';

import { ThreatIntelService } from '../src/modules/threat-intel/threat-intel.service';

describe('ThreatIntelService', () => {
  it('builds blocklists, IOC feeds, and STIX bundles from captured data', async () => {
    vi.mocked(prisma.honeypotSession.findMany)
      .mockResolvedValueOnce([
        { sourceIp: '203.0.113.10' },
        { sourceIp: '203.0.113.11' },
        { sourceIp: '203.0.113.10' },
      ] as never)
      .mockResolvedValueOnce([
        { classification: 'scanner' },
      ] as never);
    vi.mocked(prisma.capturedRequest.findMany).mockResolvedValue([
      {
        classification: 'scanner',
        headerHash: 'hash-123',
        path: '/.env',
        service: 'ide-configs',
        sourceIp: '203.0.113.10',
        tlsFingerprint: 'ja3-1',
        userAgent: 'curl/8.4.0',
      },
    ] as never);
    const service = new ThreatIntelService();

    await expect(service.getBlocklist()).resolves.toEqual(['203.0.113.10', '203.0.113.11']);
    await expect(service.getIocFeed()).resolves.toEqual([
      {
        classification: 'scanner',
        headerHash: 'hash-123',
        path: '/.env',
        service: 'ide-configs',
        sourceIp: '203.0.113.10',
        tlsFingerprint: 'ja3-1',
        userAgent: 'curl/8.4.0',
      },
    ]);
    const stixBundle = await service.getStixBundle();

    expect(stixBundle).toMatchObject({
      objects: [
        {
          created: expect.any(String),
          modified: expect.any(String),
          name: 'ide-configs:203.0.113.10',
          pattern: "[ipv4-addr:value = '203.0.113.10']",
          pattern_type: 'stix',
          spec_version: '2.1',
          type: 'indicator',
          valid_from: expect.any(String),
        },
      ],
      spec_version: '2.1',
      type: 'bundle',
    });
    expect(stixBundle.id).toMatch(/^bundle--[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(stixBundle.objects[0]?.id).toMatch(/^indicator--[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('applies query filters to session, IOC, and MITRE lookups', async () => {
    vi.mocked(prisma.honeypotSession.findMany)
      .mockResolvedValueOnce([{ sourceIp: '203.0.113.20' }] as never)
      .mockResolvedValueOnce([{ classification: 'credential-theft' }] as never);
    vi.mocked(prisma.capturedRequest.findMany).mockResolvedValue([] as never);

    const service = new ThreatIntelService();
    const filters = {
      classification: 'credential-theft',
      days: 14,
      limit: 25,
      nodeId: 'node-1',
      service: 'openai',
      sourceIp: '203.0.113.20',
    };

    await service.getBlocklist(filters);
    await service.getIocFeed(filters);
    await service.getMitreSummary(filters);

    expect(prisma.honeypotSession.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        orderBy: { startedAt: 'desc' },
        take: 25,
        where: expect.objectContaining({
          classification: 'credential-theft',
          nodeId: 'node-1',
          requestCount: { gte: 1 },
          service: 'openai',
          sourceIp: '203.0.113.20',
          startedAt: { gte: expect.any(Date) },
        }),
      }),
    );
    expect(prisma.capturedRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { timestamp: 'desc' },
        take: 25,
        where: expect.objectContaining({
          classification: 'credential-theft',
          nodeId: 'node-1',
          service: 'openai',
          sourceIp: '203.0.113.20',
          timestamp: { gte: expect.any(Date) },
        }),
      }),
    );
    expect(prisma.honeypotSession.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        orderBy: { startedAt: 'desc' },
        take: 25,
        where: expect.objectContaining({
          classification: 'credential-theft',
          nodeId: 'node-1',
          requestCount: { gte: 1 },
          service: 'openai',
          sourceIp: '203.0.113.20',
          startedAt: { gte: expect.any(Date) },
        }),
      }),
    );
  });
});