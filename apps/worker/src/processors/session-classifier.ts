import type { AttackClassification } from '@llmtrap/shared';

const attackerPatterns = [/\.\.\//i, /\b(wget|curl|bash|chmod|powershell|cmd\.exe|nc|ncat)\b/i, /\/(exec|shell|debug)\b/i];
const configHunterPatterns = [/\.env/i, /terraform/i, /credential/i, /secret/i, /\.aws/i, /\.claude/i, /\.cursor/i, /mcp\.json/i];
const mcpPatterns = [/\/mcp\b/i, /agent\.json/i, /ai-plugin\.json/i, /\/messages\b/i, /\/sse\b/i];
const scannerPatterns = [/\/v1\/models\b/i, /\/api\/tags\b/i, /\/health\b/i, /\/metrics\b/i, /\/version\b/i, /\.well-known\//i];
const validatorPatterns = [/what model are you/i, /2\s*\+\s*2/i, /capital of france/i, /who are you/i, /repeat this exactly/i];

export interface SessionClassificationInput {
  methods: string[];
  paths: string[];
  requestBodies: unknown[];
  requestCount: number;
  service: string;
}

function extractBodyText(body: unknown): string {
  if (typeof body === 'string') {
    return body;
  }

  if (Array.isArray(body)) {
    return body.map((item) => extractBodyText(item)).join(' ');
  }

  if (!body || typeof body !== 'object') {
    return '';
  }

  return Object.entries(body as Record<string, unknown>)
    .filter(([key]) => ['content', 'input', 'messages', 'prompt', 'query', 'text'].includes(key))
    .map(([, value]) => extractBodyText(value))
    .join(' ');
}

function matchesAny(values: string[], patterns: RegExp[]): boolean {
  return values.some((value) => patterns.some((pattern) => pattern.test(value)));
}

export function classifySession(input: SessionClassificationInput): AttackClassification {
  const bodyText = input.requestBodies.map((body) => extractBodyText(body)).join(' ').trim();
  const combined = [...input.paths, bodyText, input.service].filter(Boolean);
  const llmWriteCount = input.methods.filter((method) => method !== 'GET').length;
  const averagePromptLength = bodyText.length / Math.max(input.requestBodies.length, 1);

  if (matchesAny(combined, attackerPatterns)) {
    return 'attacker';
  }

  if (matchesAny(combined, configHunterPatterns)) {
    return 'config_hunter';
  }

  if (matchesAny(combined, mcpPatterns) || input.service === 'mcp') {
    return 'mcp_prober';
  }

  if (matchesAny(combined, validatorPatterns)) {
    return 'validator';
  }

  if (llmWriteCount >= 3 && averagePromptLength >= 80) {
    return 'free_rider';
  }

  if (matchesAny(input.paths, scannerPatterns) || (input.requestCount >= 4 && input.methods.every((method) => method === 'GET'))) {
    return 'scanner';
  }

  return 'unknown';
}