import { createServer } from 'node:http';

import { apiRequest, assert, logStep, login, readSmokeConfig, triggerOpenAiProbe, waitFor } from './smoke-helpers.mjs';

const config = readSmokeConfig();

async function main() {
  const token = await login(config);
  const deliveries = [];
  const server = createServer((request, response) => {
    if (request.method !== 'POST' || request.url !== '/smoke-alert') {
      response.statusCode = 404;
      response.end('not-found');
      return;
    }

    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      deliveries.push(JSON.parse(body));
      response.statusCode = 202;
      response.end('accepted');
    });
  });

  await new Promise((resolve, reject) => {
    server.listen(config.webhookPort, '0.0.0.0', () => resolve(undefined));
    server.on('error', reject);
  });

  const ruleName = `smoke-webhook-${Date.now()}`;
  logStep(`Creating alert rule ${ruleName}`);
  const createdRule = await apiRequest('/alerts', token, {
    body: JSON.stringify({
      channels: ['webhook'],
      conditions: {
        service: ['openai'],
      },
      cooldownMin: 1,
      enabled: true,
      name: ruleName,
      severity: 'warning',
    }),
    method: 'POST',
  });

  try {
    await triggerOpenAiProbe(config, `alert-smoke-${Date.now()}`);

    await waitFor(
      'a classified openai session',
      async () => {
        const sessions = await apiRequest('/sessions?service=openai', token);
        return sessions.find((session) => session.classification !== null) ?? null;
      },
      config,
    );

    const delivery = await waitFor('a webhook delivery', async () => deliveries[0] ?? null, config);
    assert(delivery.alert?.ruleId === createdRule.id, 'Expected the webhook payload to match the created rule');

    const alertLog = await waitFor(
      'a successful webhook alert log',
      async () => {
        const logs = await apiRequest('/alerts/logs', token);
        return logs.find((entry) => entry.ruleId === createdRule.id && entry.deliveryStatus === 'sent') ?? null;
      },
      config,
    );

    console.log(JSON.stringify({ channel: alertLog.channel, ok: true, ruleId: createdRule.id, success: alertLog.success }, null, 2));
  } finally {
    await apiRequest(`/alerts/${createdRule.id}`, token, { method: 'DELETE' });
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve(undefined))));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});