import { parseApiEnv } from '@llmtrap/shared';

const env = parseApiEnv(process.env);

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export const apiConfig = {
  auth: {
    accessTokenTtlMinutes: parsePositiveInteger(process.env.JWT_ACCESS_TOKEN_TTL_MINUTES, 15),
    refreshTokenTtlDays: parsePositiveInteger(process.env.JWT_REFRESH_TOKEN_TTL_DAYS, 7),
  },
  env,
  nodes: {
    autoApprove: parseBoolean(process.env.AUTO_APPROVE_NODES, false),
    heartbeatGraceSeconds: parsePositiveInteger(process.env.HEARTBEAT_GRACE_SECONDS, 300),
  },
} as const;