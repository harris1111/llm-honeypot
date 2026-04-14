import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

import type { LiveFeedEventRecord, LiveFeedFilters } from '../lib/api-client';
import { apiClient } from '../lib/api-client';
import { useAuthStore } from '../lib/auth-store';

type UseLiveFeedOptions = {
  filters: LiveFeedFilters;
  pollingEnabled: boolean;
  websocketEnabled: boolean;
};

function normalizeFilters(filters: LiveFeedFilters): LiveFeedFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => typeof value === 'string' && value.trim().length > 0),
  ) as LiveFeedFilters;
}

function liveFeedQueryKey(filters: LiveFeedFilters) {
  return [
    'live-feed',
    filters.classification ?? '',
    filters.nodeId ?? '',
    filters.service ?? '',
    filters.sourceIp ?? '',
  ] as const;
}

function resolveSocketBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!configuredBaseUrl) {
    return window.location.origin;
  }

  try {
    return new URL(configuredBaseUrl, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

function resolveSocketNamespaceUrl(): string {
  return new URL('/live-feed', resolveSocketBaseUrl()).toString();
}

export function useLiveFeed({ filters, pollingEnabled, websocketEnabled }: UseLiveFeedOptions) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<'connected' | 'connecting' | 'disabled' | 'polling'>('disabled');
  const normalizedFilters = useMemo(() => normalizeFilters(filters), [filters]);
  const queryClient = useQueryClient();
  const queryKey = liveFeedQueryKey(normalizedFilters);

  useEffect(() => {
    if (!websocketEnabled || !accessToken) {
      setConnectionError(null);
      setConnectionState(pollingEnabled ? 'polling' : 'disabled');
      return;
    }

    setConnectionError(null);
    setConnectionState('connecting');

    const socket = io(resolveSocketNamespaceUrl(), {
      auth: {
        filters: normalizedFilters,
        token: accessToken,
      },
      path: '/api/v1/socket.io',
      transports: ['websocket'],
      withCredentials: true,
    });

    const handleEvent = (event: LiveFeedEventRecord) => {
      queryClient.setQueryData<LiveFeedEventRecord[]>(queryKey, (current) => {
        const next = [event, ...(current ?? []).filter((item) => item.id !== event.id)];
        return next.slice(0, 100);
      });
    };

    socket.on('connect', () => {
      setConnectionError(null);
      setConnectionState('connected');
      socket.emit('live-feed:subscribe', { filters: normalizedFilters });
    });
    socket.on('connect_error', (error) => {
      setConnectionError(error.message || 'WebSocket connection failed');
      setConnectionState(pollingEnabled ? 'polling' : 'disabled');
    });
    socket.on('disconnect', () => {
      setConnectionState(pollingEnabled ? 'polling' : 'disabled');
    });
    socket.on('live-feed:event', handleEvent);

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('live-feed:event', handleEvent);
      socket.disconnect();
    };
  }, [accessToken, normalizedFilters, pollingEnabled, queryClient, queryKey, websocketEnabled]);

  return useQuery({
    queryFn: () => apiClient.getLiveFeedEvents(normalizedFilters),
    queryKey,
    refetchInterval: websocketEnabled && connectionState === 'connected' ? false : pollingEnabled ? 15_000 : false,
    select: (events) => ({
      connectionError,
      connectionState,
      events,
    }),
  });
}