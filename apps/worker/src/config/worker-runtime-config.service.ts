import { Injectable } from '@nestjs/common';
import { parseWorkerEnv } from '@llmtrap/shared';

export interface WorkerRuntimeConfig {
  alerts: {
    webhookTimeoutMs: number;
    webhookUrl?: string;
  };
  batchSize: number;
  concurrency: number;
  intervals: {
    archiveMs: number;
    actorMs: number;
    alertMs: number;
    classificationMs: number;
    enrichmentMs: number;
  };
  port: number;
  storage: {
    archivePrefix: string;
    bucket?: string;
    endpoint?: string;
    forcePathStyle: boolean;
    region: string;
    retentionDays: number;
  };
}

type WorkerStorageCredentials = {
  accessKeyId?: string;
  secretAccessKey?: string;
};

function readNumber(name: string, fallback: number, allowZero = false): number {
  const value = Number(process.env[name]);
  const minimum = allowZero ? 0 : 1;
  return Number.isFinite(value) && value >= minimum ? value : fallback;
}

function buildConfig(): WorkerRuntimeConfig {
  const env = parseWorkerEnv(process.env);

  return {
    alerts: {
      webhookTimeoutMs: env.WORKER_ALERT_WEBHOOK_TIMEOUT_MS,
      webhookUrl: env.WORKER_ALERT_WEBHOOK_URL,
    },
    batchSize: readNumber('WORKER_BATCH_SIZE', 50),
    concurrency: env.WORKER_CONCURRENCY,
    intervals: {
      archiveMs: readNumber('WORKER_ARCHIVE_INTERVAL_MS', 6 * 60 * 60 * 1_000),
      actorMs: readNumber('WORKER_ACTOR_INTERVAL_MS', 30_000),
      alertMs: readNumber('WORKER_ALERT_INTERVAL_MS', 15_000),
      classificationMs: readNumber('WORKER_CLASSIFICATION_INTERVAL_MS', 15_000),
      enrichmentMs: readNumber('WORKER_ENRICHMENT_INTERVAL_MS', 60_000),
    },
    port: env.WORKER_PORT,
    storage: {
      archivePrefix: process.env.ARCHIVE_PREFIX?.trim() || 'archives',
      bucket: env.S3_BUCKET,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE ?? false,
      region: env.S3_REGION ?? 'auto',
      retentionDays: readNumber('ARCHIVE_RETENTION_DAYS', 30, true),
    },
  };
}

function buildStorageCredentials(): WorkerStorageCredentials {
  const env = parseWorkerEnv(process.env);

  return {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  };
}

@Injectable()
export class WorkerRuntimeConfigService {
  private readonly config = buildConfig();
  private readonly credentials = buildStorageCredentials();

  get snapshot(): WorkerRuntimeConfig {
    return this.config;
  }

  get storageCredentials(): WorkerStorageCredentials {
    return this.credentials;
  }
}