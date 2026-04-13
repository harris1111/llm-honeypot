import { Injectable } from '@nestjs/common';
import { parseWorkerEnv } from '@llmtrap/shared';

export interface WorkerRuntimeConfig {
  batchSize: number;
  concurrency: number;
  intervals: {
    actorMs: number;
    alertMs: number;
    classificationMs: number;
    enrichmentMs: number;
  };
  port: number;
}

function readNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function buildConfig(): WorkerRuntimeConfig {
  const env = parseWorkerEnv(process.env);

  return {
    batchSize: readNumber('WORKER_BATCH_SIZE', 50),
    concurrency: env.WORKER_CONCURRENCY,
    intervals: {
      actorMs: readNumber('WORKER_ACTOR_INTERVAL_MS', 30_000),
      alertMs: readNumber('WORKER_ALERT_INTERVAL_MS', 15_000),
      classificationMs: readNumber('WORKER_CLASSIFICATION_INTERVAL_MS', 15_000),
      enrichmentMs: readNumber('WORKER_ENRICHMENT_INTERVAL_MS', 60_000),
    },
    port: env.WORKER_PORT,
  };
}

@Injectable()
export class WorkerRuntimeConfigService {
  private readonly config = buildConfig();

  get snapshot(): WorkerRuntimeConfig {
    return this.config;
  }
}