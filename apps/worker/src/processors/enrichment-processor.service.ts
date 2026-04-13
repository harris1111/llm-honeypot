import { Prisma, prisma } from '@llmtrap/db';
import { Injectable } from '@nestjs/common';

import { WorkerRuntimeConfigService } from '../config/worker-runtime-config.service';
import type { ProcessorRunResult, WorkerProcessor } from './processor-contract';
import { buildSyntheticIpEnrichment } from './ip-enrichment';

function buildGeoValue(enrichment: {
  city: string | null;
  cloudProvider: string | null;
  country: string | null;
  org: string | null;
  region: string | null;
}): Prisma.InputJsonValue {
  return {
    city: enrichment.city,
    cloudProvider: enrichment.cloudProvider,
    country: enrichment.country,
    org: enrichment.org,
    region: enrichment.region,
  };
}

@Injectable()
export class EnrichmentProcessorService implements WorkerProcessor {
  readonly name = 'enrichment';

  constructor(private readonly configService: WorkerRuntimeConfigService) {}

  async run(): Promise<ProcessorRunResult> {
    const recentIps = await prisma.honeypotSession.findMany({
      distinct: ['sourceIp'],
      orderBy: { startedAt: 'desc' },
      select: { sourceIp: true },
      take: this.configService.snapshot.batchSize,
    });
    const ips = recentIps.map((entry) => entry.sourceIp);
    if (ips.length === 0) {
      return { handled: 0, summary: 'no IPs available for enrichment' };
    }

    const existing = await prisma.ipEnrichment.findMany({ where: { ip: { in: ips } } });
    const now = new Date();
    const existingMap = new Map(existing.map((entry) => [entry.ip, entry]));
    const enrichmentMap = new Map(existing.map((entry) => [entry.ip, entry]));
    const dueIps = ips.filter((ip) => {
      const record = existingMap.get(ip);
      return !record || record.expiresAt <= now;
    });

    for (const ip of dueIps) {
      const enrichment = buildSyntheticIpEnrichment(ip, now);
      enrichmentMap.set(ip, { ip, ...enrichment });

      await prisma.ipEnrichment.upsert({
        create: { ip, ...enrichment },
        update: enrichment,
        where: { ip },
      });
    }

    for (const ip of ips) {
      const enrichment = enrichmentMap.get(ip);
      if (!enrichment) {
        continue;
      }

      await prisma.capturedRequest.updateMany({
        data: { geo: buildGeoValue(enrichment) },
        where: { geo: { equals: Prisma.AnyNull }, sourceIp: ip },
      });
    }

    return {
      handled: dueIps.length,
      summary: dueIps.length > 0 ? `enriched ${dueIps.length} IP(s)` : 'no IPs due for enrichment',
    };
  }
}