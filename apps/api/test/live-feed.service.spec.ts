import { prisma } from '@llmtrap/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const redisPublish = vi.fn();
const redisSubscribe = vi.fn();
const redisOn = vi.fn();
const redisOff = vi.fn();
const redisQuit = vi.fn().mockResolvedValue(undefined);

vi.mock('ioredis', () => {
  return {
    default: class MockRedis {
      status = 'wait';

      connect = vi.fn().mockImplementation(async () => {
        this.status = 'ready';
      });

      disconnect = vi.fn();

      off = redisOff;

      on = redisOn;

      publish = redisPublish;

      quit = redisQuit;

      subscribe = redisSubscribe;
    },
  };
});

import { LiveFeedService } from '../src/modules/live-feed/live-feed.service';

describe('LiveFeedService', () => {
  beforeEach(() => {
    redisOff.mockReset();
    redisOn.mockReset();
    redisPublish.mockReset().mockResolvedValue(1);
    redisQuit.mockReset().mockResolvedValue(undefined);
    redisSubscribe.mockReset().mockResolvedValue(1);
  });

  it('lists recent capture events with actor ids', async () => {
    vi.mocked(prisma.capturedRequest.findMany).mockResolvedValueOnce([
      {
        classification: 'scanner',
        id: 'capture-1',
        method: 'GET',
        nodeId: 'node-1',
        path: '/v1/models',
        responseCode: 200,
        responseStrategy: 'template',
        service: 'openai',
        session: { actorId: 'actor-1' },
        sourceIp: '203.0.113.10',
        timestamp: new Date('2026-04-13T12:00:00Z'),
        userAgent: 'scanner/1.0',
      },
    ] as never);

    const service = new LiveFeedService();
    await expect(service.list({ service: 'openai' })).resolves.toEqual([
      expect.objectContaining({ actorId: 'actor-1', id: 'capture-1', service: 'openai' }),
    ]);
  });

  it('publishes normalized websocket events', () => {
    const service = new LiveFeedService();
    const received: unknown[] = [];
    const subscription = service.events$.subscribe((event) => received.push(event));

    service.publish({
      actorId: 'actor-1',
      classification: 'attacker',
      id: 'capture-2',
      method: 'POST',
      nodeId: 'node-1',
      path: '/v1/chat/completions',
      responseCode: 200,
      service: 'openai',
      sourceIp: '203.0.113.11',
      strategy: 'proxy',
      timestamp: new Date('2026-04-14T10:15:00.000Z'),
      userAgent: 'curl/8.4.0',
    });

    expect(received).toEqual([
      expect.objectContaining({
        id: 'capture-2',
        timestamp: '2026-04-14T10:15:00.000Z',
      }),
    ]);

    subscription.unsubscribe();
  });

  it('forwards remote Redis pubsub events to subscribers', async () => {
    const service = new LiveFeedService();
    const received: unknown[] = [];
    const subscription = service.events$.subscribe((event) => received.push(event));

    await service.onModuleInit();

    const handler = redisOn.mock.calls.find(([eventName]) => eventName === 'message')?.[1] as
      | ((channel: string, payload: string) => void)
      | undefined;

    expect(handler).toBeDefined();

    handler?.(
      'llmtrap:live-feed',
      JSON.stringify({
        event: {
          actorId: 'actor-9',
          classification: 'scanner',
          id: 'capture-remote',
          method: 'GET',
          nodeId: 'node-9',
          path: '/v1/models',
          responseCode: 200,
          service: 'openai',
          sourceIp: '203.0.113.99',
          strategy: 'template',
          timestamp: '2026-04-14T12:00:00.000Z',
          userAgent: 'scanner/1.0',
        },
        origin: 'remote-instance',
      }),
    );

    expect(received).toEqual([
      expect.objectContaining({
        id: 'capture-remote',
        sourceIp: '203.0.113.99',
      }),
    ]);

    subscription.unsubscribe();
    await service.onModuleDestroy();
  });
});