import { prisma } from '@llmtrap/db';
import { describe, expect, it, vi } from 'vitest';

import { AuditService } from '../src/modules/audit/audit.service';
import { ExportService } from '../src/modules/export/export.service';

function createAuditService(): AuditService {
  return { record: vi.fn().mockResolvedValue(undefined) } as unknown as AuditService;
}

describe('ExportService', () => {
  it('generates a markdown report with summary content', async () => {
    vi.mocked(prisma.honeypotSession.findMany).mockResolvedValueOnce([
      {
        actorId: 'actor-1',
        classification: 'scanner',
        id: 'session-1',
        requestCount: 4,
        service: 'openai',
        sourceIp: '203.0.113.10',
        startedAt: new Date('2026-04-13T10:00:00Z'),
      },
    ] as never);
    vi.mocked(prisma.capturedRequest.count).mockResolvedValueOnce(7);
    vi.mocked(prisma.actor.findMany).mockResolvedValueOnce([{ id: 'actor-1', label: 'Scanner Group' }] as never);

    const service = new ExportService(createAuditService());
    const report = await service.getReport('user-1', 'markdown', 7, '127.0.0.1');

    expect(report.content).toContain('# LLMTrap Report');
    expect(report.content).toContain('Sessions: 1');
    expect(report.content).toContain('Scanner Group');
  });
});