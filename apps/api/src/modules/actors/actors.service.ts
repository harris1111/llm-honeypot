import { prisma } from '@llmtrap/db';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import type { MergeActorsRequest, SplitActorRequest } from './actors.schemas';

type ActorSessionRecord = {
  classification: string | null;
  endedAt: string | null;
  id: string;
  nodeId: string;
  requestCount: number;
  service: string;
  sourceIp: string;
  startedAt: string;
  userAgent: string | null;
};

type ActorRecord = {
  firstSeen: string;
  headerFingerprint: string | null;
  id: string;
  label: string | null;
  lastSeen: string;
  mergedFrom: string[];
  recentServices: string[];
  sessionCount: number;
  sourceIps: string[];
  tlsFingerprints: string[];
  userAgents: string[];
};

type ActorDetailRecord = ActorRecord & {
  sessions: ActorSessionRecord[];
};

type ActorSummaryShape = {
  firstSeen: Date;
  headerFingerprint: string | null;
  id: string;
  label: string | null;
  lastSeen: Date;
  mergedFrom: string[];
  sessionCount: number;
  sessions: Array<{ service: string; sourceIp: string }>;
  tlsFingerprints: string[];
  userAgents: string[];
};

type ActorDetailShape = {
  firstSeen: Date;
  headerFingerprint: string | null;
  id: string;
  label: string | null;
  lastSeen: Date;
  mergedFrom: string[];
  sessionCount: number;
  sessions: Array<{
    classification: string | null;
    endedAt: Date | null;
    id: string;
    nodeId: string;
    requestCount: number;
    service: string;
    sourceIp: string;
    startedAt: Date;
    userAgent: string | null;
  }>;
  tlsFingerprints: string[];
  userAgents: string[];
};

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function minDate(values: Date[]): Date {
  return new Date(Math.min(...values.map((value) => value.getTime())));
}

function maxDate(values: Date[]): Date {
  return new Date(Math.max(...values.map((value) => value.getTime())));
}

async function buildActorSignals(sessionIds: string[]) {
  const requests = await prisma.capturedRequest.findMany({
    orderBy: { timestamp: 'asc' },
    select: { headerHash: true, tlsFingerprint: true, userAgent: true },
    where: { sessionId: { in: sessionIds } },
  });

  return {
    headerFingerprint: requests.find((request) => request.headerHash)?.headerHash ?? null,
    tlsFingerprints: uniqueStrings(requests.map((request) => request.tlsFingerprint)),
    userAgents: uniqueStrings(requests.map((request) => request.userAgent)),
  };
}

function serializeBase(actor: ActorSummaryShape | ActorDetailShape): ActorRecord {
  return {
    firstSeen: actor.firstSeen.toISOString(),
    headerFingerprint: actor.headerFingerprint,
    id: actor.id,
    label: actor.label,
    lastSeen: actor.lastSeen.toISOString(),
    mergedFrom: actor.mergedFrom,
    recentServices: uniqueStrings(actor.sessions.map((session) => session.service)),
    sessionCount: actor.sessionCount,
    sourceIps: uniqueStrings(actor.sessions.map((session) => session.sourceIp)),
    tlsFingerprints: actor.tlsFingerprints,
    userAgents: actor.userAgents,
  };
}

function serializeDetail(actor: ActorDetailShape): ActorDetailRecord {
  return {
    ...serializeBase(actor),
    sessions: actor.sessions.map((session) => ({
      classification: session.classification,
      endedAt: session.endedAt?.toISOString() ?? null,
      id: session.id,
      nodeId: session.nodeId,
      requestCount: session.requestCount,
      service: session.service,
      sourceIp: session.sourceIp,
      startedAt: session.startedAt.toISOString(),
      userAgent: session.userAgent,
    })),
  };
}

@Injectable()
export class ActorsService {
  constructor(@Inject(AuditService) private readonly auditService: AuditService) {}

  async getOne(actorId: string): Promise<ActorDetailRecord> {
    const actor = await prisma.actor.findUnique({
      include: {
        sessions: {
          orderBy: { startedAt: 'desc' },
          select: {
            classification: true,
            endedAt: true,
            id: true,
            nodeId: true,
            requestCount: true,
            service: true,
            sourceIp: true,
            startedAt: true,
            userAgent: true,
          },
          take: 50,
        },
      },
      where: { id: actorId },
    });
    if (!actor) {
      throw new NotFoundException('Actor not found');
    }

    return serializeDetail(actor);
  }

  async list(): Promise<ActorRecord[]> {
    const actors = await prisma.actor.findMany({
      include: {
        sessions: {
          orderBy: { startedAt: 'desc' },
          select: { service: true, sourceIp: true },
          take: 10,
        },
      },
      orderBy: { lastSeen: 'desc' },
      take: 100,
    });

    return actors.map((actor) => serializeBase(actor));
  }

  async merge(currentUserId: string, input: MergeActorsRequest, ipAddress?: string): Promise<ActorDetailRecord> {
    const actorIds = [...new Set(input.sourceActorIds)];
    const actors = await prisma.actor.findMany({ where: { id: { in: actorIds } } });
    if (actors.length !== actorIds.length) {
      throw new NotFoundException('One or more actors were not found');
    }
    const actorsById = new Map(actors.map((actor) => [actor.id, actor]));
    const orderedActors = actorIds.map((actorId) => actorsById.get(actorId)).filter((actor): actor is NonNullable<typeof actor> => Boolean(actor));

    const target = input.targetActorId ? actorsById.get(input.targetActorId) : orderedActors[0];
    if (!target) {
      throw new BadRequestException('Target actor must be included in sourceActorIds');
    }

    const sourceIds = actorIds.filter((actorId) => actorId !== target.id);
    const allSessions = await prisma.honeypotSession.findMany({ where: { actorId: { in: actorIds } } });

    await prisma.$transaction(async (tx) => {
      await tx.honeypotSession.updateMany({ data: { actorId: target.id }, where: { actorId: { in: sourceIds } } });
      await tx.actor.update({
        data: {
          firstSeen: minDate(orderedActors.map((actor) => actor.firstSeen)),
          headerFingerprint: target.headerFingerprint ?? orderedActors.find((actor) => actor.headerFingerprint)?.headerFingerprint ?? null,
          label: input.label ?? target.label,
          lastSeen: maxDate(orderedActors.map((actor) => actor.lastSeen)),
          mergedFrom: { set: uniqueStrings([...target.mergedFrom, ...sourceIds, ...orderedActors.flatMap((actor) => actor.mergedFrom)]) },
          sessionCount: allSessions.length,
          tlsFingerprints: { set: uniqueStrings(orderedActors.flatMap((actor) => actor.tlsFingerprints)) },
          userAgents: { set: uniqueStrings(orderedActors.flatMap((actor) => actor.userAgents)) },
        },
        where: { id: target.id },
      });
      await tx.actor.deleteMany({ where: { id: { in: sourceIds } } });
    });

    await this.auditService.record({ action: 'actors.merge', ip: ipAddress, target: target.id, userId: currentUserId });
    return this.getOne(target.id);
  }

  async split(currentUserId: string, actorId: string, input: SplitActorRequest, ipAddress?: string): Promise<ActorDetailRecord> {
    const actor = await prisma.actor.findUnique({ where: { id: actorId } });
    if (!actor) {
      throw new NotFoundException('Actor not found');
    }

    const sessions = await prisma.honeypotSession.findMany({
      orderBy: { startedAt: 'asc' },
      where: { actorId, id: { in: input.sessionIds } },
    });
    if (sessions.length === 0) {
      throw new BadRequestException('No actor sessions matched the split request');
    }

    const movedSignals = await buildActorSignals(sessions.map((session) => session.id));

    const created = await prisma.$transaction(async (tx) => {
      const nextActor = await tx.actor.create({
        data: {
          firstSeen: minDate(sessions.map((session) => session.startedAt)),
          headerFingerprint: movedSignals.headerFingerprint ?? actor.headerFingerprint,
          label: input.label ?? `${actor.label ?? 'Actor'} split`,
          lastSeen: maxDate(sessions.map((session) => session.endedAt ?? session.startedAt)),
          mergedFrom: [actor.id],
          sessionCount: sessions.length,
          tlsFingerprints: movedSignals.tlsFingerprints,
          userAgents: uniqueStrings([...sessions.map((session) => session.userAgent), ...movedSignals.userAgents]),
        },
      });

      await tx.honeypotSession.updateMany({
        data: { actorId: nextActor.id },
        where: { id: { in: sessions.map((session) => session.id) } },
      });

      const remainingSessions = await tx.honeypotSession.findMany({ where: { actorId } });
      if (remainingSessions.length > 0) {
        const remainingSignals = await buildActorSignals(remainingSessions.map((session) => session.id));
        await tx.actor.update({
          data: {
            firstSeen: minDate(remainingSessions.map((session) => session.startedAt)),
            headerFingerprint: remainingSignals.headerFingerprint,
            lastSeen: maxDate(remainingSessions.map((session) => session.endedAt ?? session.startedAt)),
            sessionCount: remainingSessions.length,
            tlsFingerprints: { set: remainingSignals.tlsFingerprints },
            userAgents: { set: uniqueStrings([...remainingSessions.map((session) => session.userAgent), ...remainingSignals.userAgents]) },
          },
          where: { id: actorId },
        });
      } else {
        await tx.actor.deleteMany({ where: { id: { in: [actorId] } } });
      }

      return nextActor;
    });

    await this.auditService.record({ action: 'actors.split', ip: ipAddress, target: created.id, userId: currentUserId });
    return this.getOne(created.id);
  }
}