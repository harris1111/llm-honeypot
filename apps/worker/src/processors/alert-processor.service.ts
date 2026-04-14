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
    delivery: null,
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
        const alertLogs = await Promise.all(channels.map((channel) => this.dispatchAlert(channel, rule, session)));
        await prisma.alertLog.createMany({
          data: alertLogs.map((log) => ({
            channel: log.channel,
            payload: log.payload,
            ruleId: rule.id,
            success: log.success,
          })),
        });
        handled += alertLogs.length;
      }
    }

    return {
      handled,
      summary: handled > 0 ? `materialized ${handled} alert log entry(ies)` : 'no alert events matched enabled rules',
    };
  }

  private async dispatchAlert(
    channel: string,
    rule: Awaited<ReturnType<typeof prisma.alertRule.findMany>>[number],
    session: SessionWithPaths,
  ) {
    const basePayload = buildPayload(session) as AlertPayloadRecord;

    if (channel === 'internal') {
      return {
        channel,
        payload: {
          ...basePayload,
          delivery: {
            channel,
            detail: 'Logged for internal dashboard review',
            mode: 'internal',
            attemptedAt: new Date().toISOString(),
            status: 'sent',
          },
        } satisfies Prisma.InputJsonValue,
        success: true,
      };
    }

    if (channel === 'webhook') {
      return this.dispatchWebhookAlert(rule, session, basePayload);
    }

    return {
      channel,
      payload: {
        ...basePayload,
        delivery: {
          channel,
          detail: `Unsupported alert channel: ${channel}`,
          mode: 'unsupported',
          attemptedAt: new Date().toISOString(),
          status: 'failed',
        },
      } satisfies Prisma.InputJsonValue,
      success: false,
    };
  }

  private async dispatchWebhookAlert(
    rule: Awaited<ReturnType<typeof prisma.alertRule.findMany>>[number],
    session: SessionWithPaths,
    basePayload: AlertPayloadRecord,
  ) {
    const webhookUrl = this.configService.snapshot.alerts.webhookUrl;
    const attemptedAt = new Date().toISOString();

    if (!webhookUrl) {
      return {
        channel: 'webhook',
        payload: {
          ...basePayload,
          delivery: {
            channel: 'webhook',
            detail: 'Worker webhook URL is not configured',
            mode: 'webhook',
            attemptedAt,
            status: 'failed',
          },
        } satisfies Prisma.InputJsonValue,
        success: false,
      };
    }

    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), this.configService.snapshot.alerts.webhookTimeoutMs);

    try {
      const response = await globalThis.fetch(webhookUrl, {
        body: JSON.stringify({
          alert: {
            channel: 'webhook',
            cooldownMin: rule.cooldownMin,
            name: rule.name,
            ruleId: rule.id,
            severity: rule.severity,
          },
          session: basePayload,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        signal: controller.signal,
      });

      if (!response.ok) {
        const responseText = await response.text();
        return {
          channel: 'webhook',
          payload: {
            ...basePayload,
            delivery: {
              channel: 'webhook',
              detail: responseText || `Webhook request failed with status ${response.status}`,
              httpStatus: response.status,
              mode: 'webhook',
              attemptedAt,
              status: 'failed',
            },
          } satisfies Prisma.InputJsonValue,
          success: false,
        };
      }

      return {
        channel: 'webhook',
        payload: {
          ...basePayload,
          delivery: {
            channel: 'webhook',
            detail: 'Delivered to configured webhook endpoint',
            httpStatus: response.status,
            mode: 'webhook',
            attemptedAt,
            status: 'sent',
          },
        } satisfies Prisma.InputJsonValue,
        success: true,
      };
    } catch (error) {
      return {
        channel: 'webhook',
        payload: {
          ...basePayload,
          delivery: {
            channel: 'webhook',
            detail: error instanceof Error ? error.message : 'Webhook delivery failed',
            mode: 'webhook',
            attemptedAt,
            status: 'failed',
          },
        } satisfies Prisma.InputJsonValue,
        success: false,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

type AlertPayloadRecord = {
  actorId: string | null;
  classification: string | null;
  delivery: null | {
    attemptedAt: string;
    channel: string;
    detail: string;
    httpStatus?: number;
    mode: 'internal' | 'unsupported' | 'webhook';
    status: 'failed' | 'sent';
  };
  nodeId: string;
  paths: string[];
  requestCount: number;
  service: string;
  sessionId: string;
  sourceIp: string;
};