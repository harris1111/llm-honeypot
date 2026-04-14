export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function logStep(message) {
  console.log(`[smoke] ${message}`);
}

export function readSmokeConfig() {
  const apiBaseUrl = process.env.LLMTRAP_SMOKE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

  return {
    apiBaseUrl,
    loginEmail: process.env.LLMTRAP_SMOKE_EMAIL ?? 'admin@llmtrap.local',
    loginPassword: process.env.LLMTRAP_SMOKE_PASSWORD ?? 'ChangeMe123456!',
    openAiBaseUrl: process.env.LLMTRAP_SMOKE_OPENAI_BASE_URL ?? 'http://localhost:8080',
    pollIntervalMs: Number(process.env.LLMTRAP_SMOKE_POLL_INTERVAL_MS ?? 2000),
    socketNamespaceUrl: new URL('/live-feed', apiBaseUrl).toString(),
    timeoutMs: Number(process.env.LLMTRAP_SMOKE_TIMEOUT_MS ?? 90000),
    webhookPort: Number(process.env.LLMTRAP_SMOKE_WEBHOOK_PORT ?? 7780),
  };
}

export async function apiRequest(path, token, init = {}) {
  const headers = new Headers(init.headers ?? {});

  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(`${readSmokeConfig().apiBaseUrl}${path}`, {
    ...init,
    headers,
  });
  const payload = await response.json();

  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? `Request to ${path} failed with status ${response.status}`);
  }

  return payload.data;
}

export async function login(config = readSmokeConfig()) {
  logStep(`Logging in to ${config.apiBaseUrl}`);

  const response = await fetch(`${config.apiBaseUrl}/auth/login`, {
    body: JSON.stringify({
      email: config.loginEmail,
      password: config.loginPassword,
    }),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
  });
  const payload = await response.json();

  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? 'Smoke login failed');
  }

  return payload.data.tokens.accessToken;
}

export async function triggerOpenAiProbe(config = readSmokeConfig(), prompt = `smoke-${Date.now()}`) {
  logStep(`Triggering OpenAI honeypot probe: ${prompt}`);

  const response = await fetch(`${config.openAiBaseUrl}/v1/chat/completions`, {
    body: JSON.stringify({
      messages: [{ content: prompt, role: 'user' }],
      model: 'gpt-4o-mini',
      stream: false,
    }),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Probe request failed with status ${response.status}`);
  }

  return prompt;
}

export async function waitFor(label, callback, config = readSmokeConfig()) {
  const deadline = Date.now() + config.timeoutMs;

  while (Date.now() < deadline) {
    const result = await callback();
    if (result !== null && result !== undefined && result !== false) {
      return result;
    }

    await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
  }

  throw new Error(`Timed out while waiting for ${label}`);
}