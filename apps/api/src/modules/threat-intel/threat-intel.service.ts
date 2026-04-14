import { Prisma, prisma } from '@llmtrap/db';
import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { mitreMappings } from './mitre-mappings';
import type { ThreatIntelFilters } from './threat-intel.schemas';

@Injectable()
export class ThreatIntelService {
  async getBlocklist(filters: ThreatIntelFilters = {}) {
    const sessions = await prisma.honeypotSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: filters.limit ?? 200,
      where: this.buildSessionWhere(filters),
    });

    return [...new Set(sessions.map((session) => session.sourceIp))].sort();
  }

  async getIocFeed(filters: ThreatIntelFilters = {}) {
    const requests = await prisma.capturedRequest.findMany({
      orderBy: { timestamp: 'desc' },
      take: filters.limit ?? 100,
      where: this.buildRequestWhere(filters),
    });

    return requests.map((request) => ({
      classification: request.classification,
      headerHash: request.headerHash,
      path: request.path,
      service: request.service,
      sourceIp: request.sourceIp,
      tlsFingerprint: request.tlsFingerprint,
      userAgent: request.userAgent,
    }));
  }

  async getMitreSummary(filters: ThreatIntelFilters = {}) {
    const sessions = await prisma.honeypotSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: filters.limit ?? 200,
      where: this.buildSessionWhere(filters),
    });
    const counters = new Map<string, number>();

    for (const session of sessions) {
      const mapping = mitreMappings.find((entry) => entry.classification === session.classification);
      if (!mapping) {
        continue;
      }

      counters.set(mapping.techniqueId, (counters.get(mapping.techniqueId) ?? 0) + 1);
    }

    return mitreMappings
      .map((mapping) => ({ ...mapping, count: counters.get(mapping.techniqueId) ?? 0 }))
      .filter((mapping) => mapping.count > 0);
  }

  async getStixBundle(filters: ThreatIntelFilters = {}) {
    const indicators = await this.getIocFeed(filters);
    const now = new Date().toISOString();
    const indicatorObjects = indicators.map((indicator, index) => ({
      created: now,
      id: this.buildStixId('indicator', `${indicator.service}:${indicator.sourceIp}:${indicator.path ?? index}`),
      modified: now,
      name: `${indicator.service}:${indicator.sourceIp}`,
      pattern: `[ipv4-addr:value = '${indicator.sourceIp}']`,
      pattern_type: 'stix',
      spec_version: '2.1',
      type: 'indicator',
      valid_from: now,
    }));

    return {
      id: this.buildStixId('bundle', indicatorObjects.map((indicator) => indicator.id).join('|') || 'llmtrap'),
      objects: indicatorObjects,
      spec_version: '2.1',
      type: 'bundle',
    };
  }

  private buildStixId(type: 'bundle' | 'indicator', seed: string) {
    const hex = createHash('sha256').update(seed).digest('hex');
    const version = `5${hex.slice(13, 16)}`;
    const variantPrefix = ['8', '9', 'a', 'b'][Number.parseInt(hex.slice(16, 17), 16) % 4];
    const variant = `${variantPrefix}${hex.slice(17, 20)}`;
    const uuid = [hex.slice(0, 8), hex.slice(8, 12), version, variant, hex.slice(20, 32)].join('-');

    return `${type}--${uuid}`;
  }

  private buildRequestWhere(filters: ThreatIntelFilters): Prisma.CapturedRequestWhereInput {
    const since = this.resolveSince(filters.days);

    return {
      classification: filters.classification,
      nodeId: filters.nodeId,
      service: filters.service,
      sourceIp: filters.sourceIp,
      timestamp: since ? { gte: since } : undefined,
    };
  }

  private buildSessionWhere(filters: ThreatIntelFilters): Prisma.HoneypotSessionWhereInput {
    const since = this.resolveSince(filters.days);

    return {
      classification: filters.classification,
      nodeId: filters.nodeId,
      requestCount: { gte: 1 },
      service: filters.service,
      sourceIp: filters.sourceIp,
      startedAt: since ? { gte: since } : undefined,
    };
  }

  private resolveSince(days?: number) {
    if (!days) {
      return undefined;
    }

    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }
}