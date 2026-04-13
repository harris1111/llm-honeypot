import { prisma } from '@llmtrap/db';
import { Injectable } from '@nestjs/common';

import { WorkerRuntimeConfigService } from '../config/worker-runtime-config.service';
import type { ProcessorRunResult, WorkerProcessor } from './processor-contract';
import { scoreActorMatch } from './actor-correlation';

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

@Injectable()
export class ActorCorrelationProcessorService implements WorkerProcessor {
  readonly name = 'actor';

  constructor(private readonly configService: WorkerRuntimeConfigService) {}

  async run(): Promise<ProcessorRunResult> {
    const sessions = await prisma.honeypotSession.findMany({
      include: {
        requests: {
          orderBy: { timestamp: 'asc' },
          select: { headerHash: true, path: true, tlsFingerprint: true, userAgent: true },
          take: 20,
        },
      },
      orderBy: { startedAt: 'asc' },
      take: this.configService.snapshot.batchSize,
      where: { actorId: null },
    });

    let handled = 0;
    for (const session of sessions) {
      const firstRequest = session.requests[0];
      const headerFingerprint = firstRequest?.headerHash ?? null;
      const tlsFingerprint = firstRequest?.tlsFingerprint ?? null;
      const userAgent = session.userAgent ?? firstRequest?.userAgent ?? null;
      const paths = uniqueStrings(session.requests.map((request) => request.path ?? '/'));
      const candidateFilters = [
        headerFingerprint ? { headerFingerprint } : null,
        tlsFingerprint ? { tlsFingerprints: { has: tlsFingerprint } } : null,
        userAgent ? { userAgents: { has: userAgent } } : null,
      ].filter((value): value is NonNullable<typeof value> => value !== null);

      const candidates = await prisma.actor.findMany({
        take: 10,
        where: candidateFilters.length > 0 ? { OR: candidateFilters } : undefined,
      });

      const bestCandidate = candidates
        .map((actor) => ({
          actor,
          score: scoreActorMatch(
            { headerFingerprint, paths, tlsFingerprint, userAgent },
            {
              headerFingerprint: actor.headerFingerprint,
              paths: [],
              tlsFingerprints: actor.tlsFingerprints,
              userAgents: actor.userAgents,
            },
          ),
        }))
        .sort((left, right) => right.score - left.score)[0];

      if (bestCandidate && bestCandidate.score >= 60) {
        await prisma.$transaction([
          prisma.actor.update({
            data: {
              headerFingerprint: headerFingerprint ?? bestCandidate.actor.headerFingerprint,
              lastSeen: session.endedAt ?? session.startedAt,
              sessionCount: { increment: 1 },
              tlsFingerprints: { set: uniqueStrings([...bestCandidate.actor.tlsFingerprints, tlsFingerprint]) },
              userAgents: { set: uniqueStrings([...bestCandidate.actor.userAgents, userAgent]) },
            },
            where: { id: bestCandidate.actor.id },
          }),
          prisma.honeypotSession.update({
            data: { actorId: bestCandidate.actor.id },
            where: { id: session.id },
          }),
        ]);
        handled += 1;
        continue;
      }

      const created = await prisma.actor.create({
        data: {
          firstSeen: session.startedAt,
          headerFingerprint,
          label: `Actor ${session.sourceIp}`,
          lastSeen: session.endedAt ?? session.startedAt,
          sessionCount: 1,
          tlsFingerprints: uniqueStrings([tlsFingerprint]),
          userAgents: uniqueStrings([userAgent]),
        },
      });

      await prisma.honeypotSession.update({
        data: { actorId: created.id },
        where: { id: session.id },
      });
      handled += 1;
    }

    return {
      handled,
      summary: handled > 0 ? `correlated ${handled} session(s) to actors` : 'no sessions awaiting actor correlation',
    };
  }
}