import type { ResponseConfigRecord } from '@llmtrap/shared';

export type ProxiedTextResponse = {
  completionTokens: number;
  content: string;
  estimatedCost: number;
  modelName: string;
  promptTokens: number;
};

export async function proxyPromptWithRealModel(input: {
  prompt: string;
  responseConfig: ResponseConfigRecord;
}): Promise<ProxiedTextResponse> {
  const baseUrl = input.responseConfig.proxy.baseUrl.trim().replace(/\/$/, '');
  const modelName = input.responseConfig.proxy.model.trim();

  if (!baseUrl || !modelName) {
    throw new Error('Real model proxy is not configured');
  }

  const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const apiKey = input.responseConfig.proxy.apiKey.trim();

  if (apiKey) {
    headers.authorization = apiKey.toLowerCase().startsWith('bearer ') ? apiKey : `Bearer ${apiKey}`;
  }

  const messages: Array<{ content: string; role: 'system' | 'user' }> = [];
  const systemPrompt = input.responseConfig.proxy.systemPrompt.trim();

  if (systemPrompt) {
    messages.push({ content: systemPrompt, role: 'system' });
  }

  messages.push({ content: input.prompt, role: 'user' });

  const attempts = Math.max(1, input.responseConfig.proxy.maxRetries + 1);
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), input.responseConfig.proxy.timeoutMs);

    try {
      const response = await globalThis.fetch(endpoint, {
        body: JSON.stringify({ messages, model: modelName, stream: false }),
        headers,
        method: 'POST',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Proxy request failed with ${response.status}: ${await response.text()}`);
      }

      const payload = (await response.json()) as unknown;
      const content = readProxyContent(payload);

      if (!content) {
        throw new Error('Proxy returned an empty response');
      }

      const promptTokens = readUsageMetric(payload, 'prompt_tokens', estimateTokenCount(input.prompt));
      const completionTokens = readUsageMetric(payload, 'completion_tokens', estimateTokenCount(content));

      return {
        completionTokens,
        content,
        estimatedCost: estimateUsd(promptTokens, completionTokens),
        modelName: readString(payload, 'model') ?? modelName,
        promptTokens,
      };
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Real model proxy request failed');
}

function readProxyContent(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const outputText = readString(payload, 'output_text');
  if (outputText) {
    return outputText;
  }

  const choices = (payload as { choices?: unknown }).choices;
  if (Array.isArray(choices) && choices.length > 0 && choices[0] && typeof choices[0] === 'object') {
    const choice = choices[0] as { message?: { content?: unknown }; text?: unknown };
    const messageContent = normalizeContent(choice.message?.content);

    if (messageContent) {
      return messageContent;
    }

    if (typeof choice.text === 'string' && choice.text.trim()) {
      return choice.text.trim();
    }
  }

  return normalizeContent((payload as { content?: unknown }).content);
}

function normalizeContent(content: unknown): string {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry.trim();
      }

      if (entry && typeof entry === 'object' && typeof (entry as { text?: unknown }).text === 'string') {
        return ((entry as { text: string }).text).trim();
      }

      return '';
    })
    .filter((entry) => entry.length > 0)
    .join(' ');
}

function readString(payload: unknown, key: string): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const value = (payload as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readUsageMetric(payload: unknown, key: 'prompt_tokens' | 'completion_tokens', fallback: number): number {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const usage = (payload as { usage?: unknown }).usage;
  if (!usage || typeof usage !== 'object') {
    return fallback;
  }

  const value = (usage as Record<string, unknown>)[key];
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(1, Math.round(value)) : fallback;
}

function estimateTokenCount(value: string): number {
  return Math.max(1, Math.ceil(value.trim().length / 4));
}

function estimateUsd(promptTokens: number, completionTokens: number): number {
  return Number((((promptTokens + completionTokens) / 1000) * 0.002).toFixed(6));
}