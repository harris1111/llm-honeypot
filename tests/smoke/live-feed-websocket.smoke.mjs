import { io } from 'socket.io-client';

import { assert, logStep, login, readSmokeConfig, triggerOpenAiProbe, waitFor } from './smoke-helpers.mjs';

const config = readSmokeConfig();

async function main() {
  const token = await login(config);
  const startedAt = Date.now();
  const events = [];
  const expectedRoomKey = 'live-feed:service=openai';

  logStep(`Connecting to Socket.IO namespace ${config.socketNamespaceUrl}`);
  const socket = io(config.socketNamespaceUrl, {
    auth: {
      token,
    },
    path: '/api/v1/socket.io',
    transports: ['websocket'],
    withCredentials: true,
  });

  try {
    const subscription = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WebSocket connection timed out')), config.timeoutMs);

      socket.on('connect', () => {
        socket.emit('live-feed:subscribe', { filters: { service: 'openai' } });
      });
      socket.on('live-feed:subscribed', (payload) => {
        if (payload?.roomKey !== expectedRoomKey) {
          return;
        }

        clearTimeout(timeout);
        resolve(payload);
      });
      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error instanceof Error ? error : new Error(String(error)));
      });
    });

    assert(subscription.roomKey === expectedRoomKey, 'Expected the explicit live-feed subscription to join the OpenAI room');
    assert(subscription.filters?.service === 'openai', 'Expected the live-feed subscription ack to echo the OpenAI filter');

    socket.on('live-feed:event', (event) => {
      events.push(event);
    });

    await triggerOpenAiProbe(config, `live-feed-smoke-${Date.now()}`);

    const event = await waitFor(
      'a live-feed websocket event',
      async () =>
        events.find(
          (candidate) => candidate.service === 'openai' && new Date(candidate.timestamp).getTime() >= startedAt - 1000,
        ) ?? null,
      config,
    );

    assert(typeof event.id === 'string' && event.id.length > 0, 'Expected the live-feed event to carry an id');
    assert(Object.hasOwn(event, 'classification'), 'Expected the live-feed event to include the classification field');
    console.log(JSON.stringify({ classification: event.classification, eventId: event.id, ok: true, service: event.service }, null, 2));
  } finally {
    socket.disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});