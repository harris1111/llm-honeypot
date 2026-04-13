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
    await expect(service.getStixBundle()).resolves.toEqual({
      id: 'bundle--llmtrap',
      objects: [
        {
          id: 'indicator--1',
          name: 'ide-configs:203.0.113.10',
          pattern: "[ipv4-addr:value = '203.0.113.10']",
          pattern_type: 'stix',
          type: 'indicator',
        },
      ],
      type: 'bundle',
    });
  });
});