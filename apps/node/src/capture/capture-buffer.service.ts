import type { CaptureRecord } from '@llmtrap/shared';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

import { NODE_RUNTIME_CONFIG } from '../config/node-runtime-config';
import type { NodeRuntimeConfig } from '../config/node-runtime-config';

@Injectable()
export class CaptureBufferService implements OnModuleDestroy {
  private readonly client: Redis;
  private connectPromise: Promise<void> | null = null;
  private readonly queueKey = 'llmtrap:captures:pending';

  constructor(@Inject(NODE_RUNTIME_CONFIG) private readonly config: NodeRuntimeConfig) {
    this.client = new Redis(this.config.redisUrl, {
      enableReadyCheck: false,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async acknowledge(count: number): Promise<void> {
    if (count <= 0) {
      return;
    }

    await this.connect();
    await this.client.ltrim(this.queueKey, count, -1);
  }

  async enqueue(record: CaptureRecord): Promise<void> {
    await this.connect();
    const payload = JSON.stringify(record);

    await this.client
      .multi()
      .rpush(this.queueKey, payload)
      .ltrim(this.queueKey, -this.config.maxBufferSize, -1)
      .exec();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status === 'end') {
      return;
    }

    await this.client.quit().catch(() => {
      this.client.disconnect();
    });
  }

  async peek(limit: number): Promise<CaptureRecord[]> {
    await this.connect();
    const items = await this.client.lrange(this.queueKey, 0, Math.max(limit - 1, 0));
    return items.map((item) => JSON.parse(item) as CaptureRecord);
  }

  async size(): Promise<number> {
    await this.connect();
    return this.client.llen(this.queueKey);
  }

  private async connect(): Promise<void> {
    if (this.client.status === 'ready' || this.client.status === 'connect') {
      return;
    }

    if (!this.connectPromise) {
      this.connectPromise = this.client.connect().finally(() => {
        this.connectPromise = null;
      });
    }

    await this.connectPromise;
  }
}