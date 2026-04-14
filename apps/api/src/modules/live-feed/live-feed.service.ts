import { prisma } from '@llmtrap/db';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';
import { Subject } from 'rxjs';

import { apiConfig } from '../../config/env-config';

export type LiveFeedFilters = {
  classification?: string;
  nodeId?: string;
  service?: string;
  sourceIp?: string;
};

export type LiveFeedEventRecord = {
  actorId: string | null;
  classification: string | null;
  id: string;
  method: string;
  nodeId: string;
  path: string | null;
  responseCode: number | null;
  service: string;
  sourceIp: string;
  strategy: string | null;
  timestamp: string;
  userAgent: string | null;
};

type LiveFeedPublishInput = Omit<LiveFeedEventRecord, 'timestamp'> & {
  timestamp: Date | string;
};

type RedisLiveFeedEnvelope = {
  event: LiveFeedEventRecord;
  origin: string;
};

const liveFeedChannel = 'llmtrap:live-feed';

@Injectable()
export class LiveFeedService implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(LiveFeedService.name);
  private readonly eventsSubject = new Subject<LiveFeedEventRecord>();
  private readonly instanceId = randomUUID();
  private readonly publisher = new Redis(apiConfig.env.REDIS_URL, {
    enableReadyCheck: false,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
  private readonly subscriber = new Redis(apiConfig.env.REDIS_URL, {
    enableReadyCheck: false,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
  private publisherConnectPromise: Promise<void> | null = null;
  private subscriberConnectPromise: Promise<void> | null = null;

  readonly events$ = this.eventsSubject.asObservable();

  async onModuleInit(): Promise<void> {
    await this.connectSubscriber();
    this.subscriber.on('message', this.handleRedisMessage);
    await this.subscriber.subscribe(liveFeedChannel);
  }

  async onModuleDestroy(): Promise<void> {
    this.subscriber.off('message', this.handleRedisMessage);

    await Promise.all([
      this.closeClient(this.publisher),
      this.closeClient(this.subscriber),
    ]);
  }

  async list(filters: LiveFeedFilters) {
    const events = await prisma.capturedRequest.findMany({
      include: {
        session: {
          select: { actorId: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
      where: {
        classification: filters.classification,
        nodeId: filters.nodeId,
        service: filters.service,
        sourceIp: filters.sourceIp,
      },
    });

    return events.map((event) =>
      this.serialize({
        actorId: event.session?.actorId ?? null,
        classification: event.classification,
        id: event.id,
        method: event.method,
        nodeId: event.nodeId,
        path: event.path,
        responseCode: event.responseCode,
        service: event.service,
        sourceIp: event.sourceIp,
        strategy: event.responseStrategy,
        timestamp: event.timestamp,
        userAgent: event.userAgent,
      }),
    );
  }

  publish(event: LiveFeedPublishInput): void {
    const serialized = this.serialize(event);

    this.eventsSubject.next(serialized);
    void this.publishRedis(serialized);
  }

  private async publishRedis(event: LiveFeedEventRecord): Promise<void> {
    try {
      await this.connectPublisher();
      await this.publisher.publish(
        liveFeedChannel,
        JSON.stringify({
          event,
          origin: this.instanceId,
        } satisfies RedisLiveFeedEnvelope),
      );
    } catch (error) {
      this.logger.warn(
        `Live-feed Redis publish failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  private readonly handleRedisMessage = (channel: string, message: string): void => {
    if (channel !== liveFeedChannel) {
      return;
    }

    try {
      const payload = JSON.parse(message) as RedisLiveFeedEnvelope;
      if (payload.origin === this.instanceId) {
        return;
      }

      this.eventsSubject.next(payload.event);
    } catch (error) {
      this.logger.warn(
        `Live-feed Redis message parse failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  };

  private async closeClient(client: Redis): Promise<void> {
    if (client.status === 'end') {
      return;
    }

    await client.quit().catch(() => {
      client.disconnect();
    });
  }

  private async connectPublisher(): Promise<void> {
    if (this.publisher.status === 'ready' || this.publisher.status === 'connect') {
      return;
    }

    if (!this.publisherConnectPromise) {
      this.publisherConnectPromise = this.publisher.connect().finally(() => {
        this.publisherConnectPromise = null;
      });
    }

    await this.publisherConnectPromise;
  }

  private async connectSubscriber(): Promise<void> {
    if (this.subscriber.status === 'ready' || this.subscriber.status === 'connect') {
      return;
    }

    if (!this.subscriberConnectPromise) {
      this.subscriberConnectPromise = this.subscriber.connect().finally(() => {
        this.subscriberConnectPromise = null;
      });
    }

    await this.subscriberConnectPromise;
  }

  private serialize(event: LiveFeedPublishInput): LiveFeedEventRecord {
    return {
      ...event,
      timestamp: event.timestamp instanceof Date ? event.timestamp.toISOString() : event.timestamp,
    };
  }
}