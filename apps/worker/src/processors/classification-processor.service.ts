import { prisma } from '@llmtrap/db';
import { Injectable } from '@nestjs/common';

import { WorkerRuntimeConfigService } from '../config/worker-runtime-config.service';
import type { ProcessorRunResult, WorkerProcessor } from './processor-contract';
import { classifySession } from './session-classifier';

@Injectable()
export class ClassificationProcessorService implements WorkerProcessor {
  readonly name = 'classification';

  constructor(private readonly configService: WorkerRuntimeConfigService) {}

  async run(): Promise<ProcessorRunResult> {
    const sessions = await prisma.honeypotSession.findMany({
      include: {
        requests: {
          orderBy: { timestamp: 'asc' },
          select: { method: true, path: true, requestBody: true },
          take: this.configService.snapshot.batchSize,
        },
      },
      orderBy: { startedAt: 'asc' },
      take: this.configService.snapshot.batchSize,
      where: {
        classification: null,
        endedAt: { not: null },
      },
    });

    let handled = 0;
    for (const session of sessions) {
      const classification = classifySession({
        methods: session.requests.map((request) => request.method),
        paths: session.requests.map((request) => request.path ?? '/'),
        requestBodies: session.requests.map((request) => request.requestBody),
        requestCount: session.requestCount,
        service: session.service,
      });

      await prisma.$transaction([
        prisma.honeypotSession.update({
          data: { classification },
          where: { id: session.id },
        }),
        prisma.capturedRequest.updateMany({
          data: { classification },
          where: { classification: null, sessionId: session.id },
        }),
      ]);
      handled += 1;
    }

    return {
      handled,
      summary: handled > 0 ? `classified ${handled} session(s)` : 'no completed sessions awaiting classification',
    };
  }
}