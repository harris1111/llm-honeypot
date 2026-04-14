import { prisma } from '@llmtrap/db';
import { describe, expect, it, vi } from 'vitest';

import { ArchiveStorageService } from '../src/modules/export/archive-storage.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { ExportService } from '../src/modules/export/export.service';

function createService() {
  const archiveStorageService = {
    readArchive: vi.fn().mockResolvedValue('archived-session-jsonl'),
    readArchivePreview: vi.fn().mockResolvedValue({
      content: 'archived-session-preview',
      lineCount: 2,
      truncated: true,
    }),
  } as unknown as ArchiveStorageService;
  const auditService = { record: vi.fn().mockResolvedValue(undefined) } as unknown as AuditService;

  return {
    archiveStorageService,
    auditService,
    service: new ExportService(auditService, archiveStorageService),
  };
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

    const { service } = createService();
    const report = await service.getReport('user-1', 'markdown', 7, '127.0.0.1');

    expect(report.content).toContain('# LLMTrap Report');
    expect(report.content).toContain('Sessions: 1');
    expect(report.content).toContain('Scanner Group');
  });

  it('lists archive manifests for the export surface', async () => {
    vi.mocked(prisma.archiveManifest.findMany).mockResolvedValueOnce([
      {
        archiveSizeBytes: 1024,
        bucket: 'llmtrap-archive',
        createdAt: new Date('2026-04-14T12:00:00.000Z'),
        format: 'jsonl.gz',
        id: 'archive-1',
        periodEnd: new Date('2026-03-31T23:59:59.000Z'),
        periodStart: new Date('2026-03-01T00:00:00.000Z'),
        requestCount: 10,
        sessionCount: 3,
        storageKey: 'archives/2026-03/archive-1.jsonl.gz',
      },
    ] as never);

    const { service } = createService();
    const manifests = await service.listArchives('user-1', '127.0.0.1');

    expect(manifests).toEqual([
      expect.objectContaining({
        bucket: 'llmtrap-archive',
        id: 'archive-1',
        requestCount: 10,
      }),
    ]);
  });

  it('reads archived content through archive storage', async () => {
    vi.mocked(prisma.archiveManifest.findUnique).mockResolvedValueOnce({
      archiveSizeBytes: 2048,
      bucket: 'llmtrap-archive',
      createdAt: new Date('2026-04-14T12:00:00.000Z'),
      format: 'jsonl.gz',
      id: 'archive-1',
      periodEnd: new Date('2026-03-31T23:59:59.000Z'),
      periodStart: new Date('2026-03-01T00:00:00.000Z'),
      requestCount: 10,
      sessionCount: 3,
      storageKey: 'archives/2026-03/archive-1.jsonl.gz',
    } as never);

    const { archiveStorageService, service } = createService();
    const archive = await service.getArchive('user-1', 'archive-1', '127.0.0.1');

    expect(archiveStorageService.readArchive).toHaveBeenCalledWith(
      'llmtrap-archive',
      'archives/2026-03/archive-1.jsonl.gz',
    );
    expect(archive).toEqual(
      expect.objectContaining({
        content: 'archived-session-jsonl',
        filename: 'archive-1.jsonl.gz',
        previewLineCount: null,
        truncated: false,
      }),
    );
  });

  it('returns a bounded archive preview when requested', async () => {
    vi.mocked(prisma.archiveManifest.findUnique).mockResolvedValueOnce({
      archiveSizeBytes: 2048,
      bucket: 'llmtrap-archive',
      createdAt: new Date('2026-04-14T12:00:00.000Z'),
      format: 'jsonl.gz',
      id: 'archive-1',
      periodEnd: new Date('2026-03-31T23:59:59.000Z'),
      periodStart: new Date('2026-03-01T00:00:00.000Z'),
      requestCount: 10,
      sessionCount: 3,
      storageKey: 'archives/2026-03/archive-1.jsonl.gz',
    } as never);

    const { archiveStorageService, service } = createService();
    const archive = await service.getArchive('user-1', 'archive-1', '127.0.0.1', 200);

    expect(archiveStorageService.readArchivePreview).toHaveBeenCalledWith(
      'llmtrap-archive',
      'archives/2026-03/archive-1.jsonl.gz',
      200,
    );
    expect(archiveStorageService.readArchive).not.toHaveBeenCalled();
    expect(archive).toEqual(
      expect.objectContaining({
        content: 'archived-session-preview',
        filename: 'archive-1.jsonl.gz',
        previewLineCount: 2,
        truncated: true,
      }),
    );
  });
});