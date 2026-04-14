import { prisma } from '@llmtrap/db';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { ArchiveStorageService } from './archive-storage.service';
import { renderReport, renderSessionExportCsv } from './report-renderer';
import type { ReportSnapshot } from './report-renderer';

type ArchiveManifestRecord = {
  archiveSizeBytes: number;
  bucket: string;
  createdAt: string;
  format: string;
  id: string;
  periodEnd: string;
  periodStart: string;
  requestCount: number;
  sessionCount: number;
  storageKey: string;
};

type SessionRow = {
  actorId: string | null;
  classification: string | null;
  id: string;
  requestCount: number;
  service: string;
  sourceIp: string;
  startedAt: string;
};

@Injectable()
export class ExportService {
  constructor(
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(ArchiveStorageService) private readonly archiveStorageService: ArchiveStorageService,
  ) {}

  async getArchive(currentUserId: string, archiveId: string, ipAddress?: string, previewLines: number | null = null) {
    const manifest = await prisma.archiveManifest.findUnique({ where: { id: archiveId } });
    if (!manifest) {
      throw new NotFoundException('Archive not found');
    }

    const preview = previewLines
      ? await this.archiveStorageService.readArchivePreview(manifest.bucket, manifest.storageKey, previewLines)
      : null;
    const content = preview
      ? preview.content
      : await this.archiveStorageService.readArchive(manifest.bucket, manifest.storageKey);

    await this.auditService.record({
      action: 'export.archive.read',
      details: preview ? { previewLines: preview.lineCount, truncated: preview.truncated } : undefined,
      ip: ipAddress,
      target: archiveId,
      userId: currentUserId,
    });

    return {
      content,
      filename: manifest.storageKey.split('/').at(-1) ?? `${manifest.id}.${manifest.format}`,
      format: manifest.format,
      manifest: this.serializeArchiveManifest(manifest),
      previewLineCount: preview?.lineCount ?? null,
      truncated: preview?.truncated ?? false,
    };
  }

  async getData(currentUserId: string, format: 'csv' | 'json', days: number, ipAddress?: string) {
    const snapshot = await this.buildSnapshot(days);
    const content = format === 'csv' ? renderSessionExportCsv(snapshot) : JSON.stringify(snapshot, null, 2);

    await this.auditService.record({
      action: 'export.data',
      details: { days, format },
      ip: ipAddress,
      target: `dataset:${format}`,
      userId: currentUserId,
    });

    return {
      content,
      filename: `llmtrap-export-${days}d.${format === 'csv' ? 'csv' : 'json'}`,
      format,
      generatedAt: snapshot.generatedAt,
      summary: snapshot.summary,
    };
  }

  async listArchives(currentUserId: string, ipAddress?: string): Promise<ArchiveManifestRecord[]> {
    const manifests = await prisma.archiveManifest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    await this.auditService.record({
      action: 'export.archive.list',
      ip: ipAddress,
      target: 'archive:list',
      userId: currentUserId,
    });

    return manifests.map((manifest) => this.serializeArchiveManifest(manifest));
  }

  async getReport(currentUserId: string, format: 'html' | 'json' | 'markdown', days: number, ipAddress?: string) {
    const snapshot = await this.buildSnapshot(days);
    const content = renderReport(snapshot, format);

    await this.auditService.record({
      action: 'export.report',
      details: { days, format },
      ip: ipAddress,
      target: `report:${format}`,
      userId: currentUserId,
    });

    return {
      content,
      filename: `llmtrap-report-${days}d.${format === 'markdown' ? 'md' : format}`,
      format,
      generatedAt: snapshot.generatedAt,
      summary: snapshot.summary,
    };
  }

  private async buildSnapshot(days: number): Promise<ReportSnapshot & { sessions: SessionRow[] }> {
    const periodDays = Number.isFinite(days) && days > 0 ? Math.min(Math.floor(days), 30) : 7;
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1_000);

    const [sessions, requestCount] = await Promise.all([
      prisma.honeypotSession.findMany({
        orderBy: { startedAt: 'desc' },
        where: { startedAt: { gte: since } },
      }),
      prisma.capturedRequest.count({ where: { timestamp: { gte: since } } }),
    ]);

    const actorIds = [...new Set(sessions.map((session) => session.actorId).filter((actorId): actorId is string => Boolean(actorId)))];
    const actors = actorIds.length > 0 ? await prisma.actor.findMany({ where: { id: { in: actorIds } } }) : [];
    const actorMap = new Map(actors.map((actor) => [actor.id, actor]));
    const actorCounts = new Map<string, number>();
    const classificationCounts = new Map<string, number>();

    for (const session of sessions) {
      classificationCounts.set(session.classification ?? 'unknown', (classificationCounts.get(session.classification ?? 'unknown') ?? 0) + 1);
      if (session.actorId) {
        actorCounts.set(session.actorId, (actorCounts.get(session.actorId) ?? 0) + 1);
      }
    }

    const snapshotSessions: SessionRow[] = sessions.map((session) => ({
      actorId: session.actorId,
      classification: session.classification,
      id: session.id,
      requestCount: session.requestCount,
      service: session.service,
      sourceIp: session.sourceIp,
      startedAt: session.startedAt.toISOString(),
    }));

    return {
      classificationBreakdown: [...classificationCounts.entries()]
        .map(([classification, count]) => ({ classification, count }))
        .sort((left, right) => right.count - left.count),
      generatedAt: new Date().toISOString(),
      notableSessions: snapshotSessions
        .slice()
        .sort((left, right) => right.requestCount - left.requestCount)
        .slice(0, 10),
      periodDays,
      sessions: snapshotSessions,
      summary: {
        requests: requestCount,
        sessions: sessions.length,
        uniqueSourceIps: new Set(sessions.map((session) => session.sourceIp)).size,
      },
      topActors: [...actorCounts.entries()]
        .map(([actorId, count]) => ({ id: actorId, label: actorMap.get(actorId)?.label ?? null, sessions: count }))
        .sort((left, right) => right.sessions - left.sessions)
        .slice(0, 10),
    };
  }

  private serializeArchiveManifest(
    manifest: Awaited<ReturnType<typeof prisma.archiveManifest.findUnique>> extends infer TValue
      ? NonNullable<TValue>
      : never,
  ): ArchiveManifestRecord {
    return {
      archiveSizeBytes: manifest.archiveSizeBytes,
      bucket: manifest.bucket,
      createdAt: manifest.createdAt.toISOString(),
      format: manifest.format,
      id: manifest.id,
      periodEnd: manifest.periodEnd.toISOString(),
      periodStart: manifest.periodStart.toISOString(),
      requestCount: manifest.requestCount,
      sessionCount: manifest.sessionCount,
      storageKey: manifest.storageKey,
    };
  }
}