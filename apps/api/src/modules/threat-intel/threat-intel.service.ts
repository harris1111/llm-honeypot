import { prisma } from '@llmtrap/db';
import { Injectable } from '@nestjs/common';

import { mitreMappings } from './mitre-mappings';

@Injectable()
export class ThreatIntelService {
  async getBlocklist() {
    const sessions = await prisma.honeypotSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: 200,
      where: {
        requestCount: { gte: 1 },
      },
    });

    return [...new Set(sessions.map((session) => session.sourceIp))].sort();
  }

  async getIocFeed() {
    const requests = await prisma.capturedRequest.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
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

  async getMitreSummary() {
    const sessions = await prisma.honeypotSession.findMany({ take: 200 });
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

  async getStixBundle() {
    const indicators = await this.getIocFeed();

    return {
      id: 'bundle--llmtrap',
      objects: indicators.map((indicator, index) => ({
        id: `indicator--${index + 1}`,
        name: `${indicator.service}:${indicator.sourceIp}`,
        pattern: `[ipv4-addr:value = '${indicator.sourceIp}']`,
        pattern_type: 'stix',
        type: 'indicator',
      })),
      type: 'bundle',
    };
  }
}