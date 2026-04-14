import type { AuthenticatedUser, UserRole } from '@llmtrap/shared';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Subscription } from 'rxjs';
import type { Namespace, Socket } from 'socket.io';

import type { LiveFeedEventRecord, LiveFeedFilters } from './live-feed.service';
import { LiveFeedService } from './live-feed.service';

type AccessTokenPayload = {
  email: string;
  role: UserRole;
  sub: string;
  totpEnabled?: boolean;
};

type SubscribePayload = {
  filters?: LiveFeedFilters;
};

type SocketWithLiveFeedState = Socket & {
  data: {
    liveFeedRoomKey?: string;
    user?: AuthenticatedUser;
  };
};

const liveFeedAllRoom = 'live-feed:all';
const supportedFilterKeys: Array<keyof LiveFeedFilters> = ['classification', 'nodeId', 'service', 'sourceIp'];

export function normalizeLiveFeedFilters(filters?: LiveFeedFilters | null): LiveFeedFilters {
  if (!filters) {
    return {};
  }

  const nextFilters: LiveFeedFilters = {};

  for (const key of supportedFilterKeys) {
    const value = filters[key];

    if (typeof value !== 'string') {
      continue;
    }

    const normalized = value.trim();
    if (!normalized) {
      continue;
    }

    nextFilters[key] = normalized;
  }

  return nextFilters;
}

export function createLiveFeedRoomKey(filters: LiveFeedFilters): string {
  const entries = Object.entries(normalizeLiveFeedFilters(filters)).sort(([left], [right]) => left.localeCompare(right));

  if (entries.length === 0) {
    return liveFeedAllRoom;
  }

  return `live-feed:${entries.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')}`;
}

export function matchesLiveFeedFilters(event: LiveFeedEventRecord, filters: LiveFeedFilters): boolean {
  const normalized = normalizeLiveFeedFilters(filters);

  if (normalized.classification && event.classification !== normalized.classification) {
    return false;
  }

  if (normalized.nodeId && event.nodeId !== normalized.nodeId) {
    return false;
  }

  if (normalized.service && event.service !== normalized.service) {
    return false;
  }

  if (normalized.sourceIp && event.sourceIp !== normalized.sourceIp) {
    return false;
  }

  return true;
}

@Injectable()
@WebSocketGateway({
  cors: {
    credentials: true,
    origin: true,
  },
  namespace: '/live-feed',
  path: '/api/v1/socket.io',
})
export class LiveFeedGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  private server!: Namespace;

  private readonly roomFilters = new Map<string, LiveFeedFilters>();
  private subscription?: Subscription;

  constructor(
    private readonly jwtService: JwtService,
    private readonly liveFeedService: LiveFeedService,
  ) {}

  afterInit(): void {
    this.subscription = this.liveFeedService.events$.subscribe((event) => {
      for (const [roomKey, filters] of this.roomFilters) {
        if (matchesLiveFeedFilters(event, filters)) {
          this.server.to(roomKey).emit('live-feed:event', event);
        }
      }
    });
  }

  handleConnection(client: SocketWithLiveFeedState): void {
    const token = this.extractToken(client.handshake.auth?.token, client.handshake.headers.authorization);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<AccessTokenPayload>(token);
      client.data.user = {
        email: payload.email,
        id: payload.sub,
        role: payload.role,
        totpEnabled: payload.totpEnabled ?? false,
      };
      this.joinFilters(client, client.handshake.auth?.filters as LiveFeedFilters | undefined);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: SocketWithLiveFeedState): void {
    this.cleanupRoom(client.data.liveFeedRoomKey);
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
  }

  @SubscribeMessage('live-feed:subscribe')
  handleSubscribe(
    @ConnectedSocket() client: SocketWithLiveFeedState,
    @MessageBody() payload?: SubscribePayload,
  ) {
    const filters = this.joinFilters(client, payload?.filters);

    return {
      filters,
      roomKey: client.data.liveFeedRoomKey ?? liveFeedAllRoom,
    };
  }

  private cleanupRoom(roomKey?: string): void {
    if (!roomKey) {
      return;
    }

    queueMicrotask(() => {
      const room = this.server?.adapter.rooms.get(roomKey);
      if (!room || room.size === 0) {
        this.roomFilters.delete(roomKey);
      }
    });
  }

  private extractToken(rawToken: unknown, rawAuthorizationHeader: unknown): string | null {
    if (typeof rawToken === 'string' && rawToken.length > 0) {
      return rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;
    }

    if (typeof rawAuthorizationHeader !== 'string') {
      return null;
    }

    const [scheme, token] = rawAuthorizationHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  private joinFilters(client: SocketWithLiveFeedState, rawFilters?: LiveFeedFilters): LiveFeedFilters {
    const filters = normalizeLiveFeedFilters(rawFilters);
    const nextRoomKey = createLiveFeedRoomKey(filters);
    const previousRoomKey = client.data.liveFeedRoomKey;

    if (previousRoomKey && previousRoomKey !== nextRoomKey) {
      void client.leave(previousRoomKey);
      this.cleanupRoom(previousRoomKey);
    }

    void client.join(nextRoomKey);
    client.data.liveFeedRoomKey = nextRoomKey;
    this.roomFilters.set(nextRoomKey, filters);
    client.emit('live-feed:subscribed', {
      filters,
      roomKey: nextRoomKey,
    });

    return filters;
  }
}