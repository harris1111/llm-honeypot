import { Prisma, prisma } from '@llmtrap/db';
import { Injectable } from '@nestjs/common';

import { WorkerRuntimeConfigService } from '../config/worker-runtime-config.service';
import type { ProcessorRunResult, WorkerProcessor } from './processor-contract';
import { matchesAlertConditions } from './alert-evaluator';

type SessionWithPaths = Awaited<ReturnType<typeof prisma.honeypotSession.findMany>>[number] & { requests: Array<{ path: string | null }> };

function buildPayload(session: SessionWithPaths) {
  return {
    actorId: session.actorId,
    classification: session.classification,
    nodeId: session.nodeId,
    paths: session.requests.map((request) => request.path ?? '/'),
    requestCount: session.requestCount,
    service: session.service,
    sessionId: session.id,
    sourceIp: session.sourceIp,
  } satisfies Prisma.InputJsonValue;
}

async function isSuppressed(ruleId: string, sessionId: string, cooldownMin: number, recentLogs: Awaited<ReturnType<typeof prisma.alertLog.findMany>>): Promise<boolean> {
  const existingSessionLog = await prisma.alertLog.findFirst({
    where: {
      payload: {
        path: ['sessionId'],
        equals: sessionId,
      },
      ruleId,
    },
  });
  if (existingSessionLog) {
    return true;
  }

  const cutoff = Date.now() - cooldownMin * 60_000;
  return recentLogs.some((log) => {
    if (log.ruleId !== ruleId || log.sentAt.getTime() < cutoff) {
      return false;
    }

    const payload = log.payload as { sessionId?: string } | null;
    return payload?.sessionId === sessionId;
  });
}

@Injectable()
export class AlertProcessorService implements WorkerProcessor {
  readonly name = 'alert';

  constructor(private readonly configService: WorkerRuntimeConfigService) {}

  async run(): Promise<ProcessorRunResult> {
    const [rules, sessions, recentLogs] = await Promise.all([
      prisma.alertRule.findMany({ where: { enabled: true } }),
      prisma.honeypotSession.findMany({
        include: {
          requests: {
            orderBy: { timestamp: 'desc' },
            select: { path: true },
            take: 10,
          },
        },
        orderBy: { startedAt: 'desc' },
        take: this.configService.snapshot.batchSize,
        where: { classification: { not: null }, endedAt: { not: null } },
      }),
      prisma.alertLog.findMany({
        orderBy: { sentAt: 'desc' },
        take: 500,
      }),
    ]);

    let handled = 0;
    for (const rule of rules) {
      for (const session of sessions) {
        const candidate = {
          actorId: session.actorId,
          classification: session.classification,
          nodeId: session.nodeId,
          paths: session.requests.map((request) => request.path ?? '/'),
          requestCount: session.requestCount,
          service: session.service,
          sourceIp: session.sourceIp,
        };

        if (!matchesAlertConditions(rule.conditions as Record<string, unknown>, candidate)) {
          continue;
        }

        if (await isSuppressed(rule.id, session.id, rule.cooldownMin, recentLogs)) {
          continue;
        }

        const channels = rule.channels.length > 0 ? rule.channels : ['internal'];
        await prisma.alertLog.createMany({
          data: channels.map((channel) => ({
            channel,
            payload: buildPayload(session),
            ruleId: rule.id,
            success: true,
          })),
        });
        handled += channels.length;
      }
    }

    return {
      handled,
      summary: handled > 0 ? `materialized ${handled} alert log entry(ies)` : 'no alert events matched enabled rules',
    };
  }
}