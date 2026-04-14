import { JwtService } from '@nestjs/jwt';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';

import {
  createLiveFeedRoomKey,
  LiveFeedGateway,
  matchesLiveFeedFilters,
  normalizeLiveFeedFilters,
} from '../src/modules/live-feed/live-feed.gateway';
import { LiveFeedService } from '../src/modules/live-feed/live-feed.service';

describe('LiveFeedGateway helpers', () => {
  it('builds stable room keys from normalized filters', () => {
    expect(
      createLiveFeedRoomKey({
        classification: ' attacker ',
        service: 'openai',
      }),
    ).toBe('live-feed:classification=attacker&service=openai');
  });

  it('matches websocket events against filters', () => {
    const filters = normalizeLiveFeedFilters({
      classification: 'attacker',
      service: 'openai',
    });

    expect(
      matchesLiveFeedFilters(
        {
          actorId: 'actor-1',
          classification: 'attacker',
          id: 'capture-1',
          method: 'GET',
          nodeId: 'node-1',
          path: '/v1/models',
          responseCode: 200,
          service: 'openai',
          sourceIp: '203.0.113.10',
          strategy: 'template',
          timestamp: '2026-04-14T10:05:00.000Z',
          userAgent: 'scanner/1.0',
        },
        filters,
      ),
    ).toBe(true);

    expect(
      matchesLiveFeedFilters(
        {
          actorId: 'actor-1',
          classification: 'scanner',
          id: 'capture-1',
          method: 'GET',
          nodeId: 'node-1',
          path: '/v1/models',
          responseCode: 200,
          service: 'anthropic',
          sourceIp: '203.0.113.10',
          strategy: 'template',
          timestamp: '2026-04-14T10:05:00.000Z',
          userAgent: 'scanner/1.0',
        },
        filters,
      ),
    ).toBe(false);
  });

  it('removes empty rooms by checking the namespace adapter directly', async () => {
    const gateway = new LiveFeedGateway(
      { verify: () => ({}) } as unknown as JwtService,
      { events$: new Subject() } as unknown as LiveFeedService,
    );

    const roomKey = 'live-feed:service=openai';

    (gateway as unknown as { roomFilters: Map<string, Record<string, string>> }).roomFilters.set(roomKey, {
      service: 'openai',
    });
    (gateway as unknown as { server: { adapter: { rooms: Map<string, Set<string>> } } }).server = {
      adapter: {
        rooms: new Map(),
      },
    };

    gateway.handleDisconnect({
      data: {
        liveFeedRoomKey: roomKey,
      },
    } as never);

    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(
      (gateway as unknown as { roomFilters: Map<string, Record<string, never>> }).roomFilters.has(roomKey),
    ).toBe(false);
  });
});