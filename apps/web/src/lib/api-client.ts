import type {
  ApiEnvelope,
  AuthenticatedUser,
  CreateNodeRequest,
  EnableTotpRequest,
  LoginRequest,
  LoginResponse,
  NodeRecord,
  RefreshSessionRequest,
  RegisterRequest,
  SetupTotpResponse,
  TokenPair,
  UpdateNodeRequest,
  VerifyTotpRequest,
} from '@llmtrap/shared';

import { useAuthStore } from './auth-store';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
let refreshPromise: Promise<string | null> | null = null;

async function parseEnvelope<TData>(response: Response): Promise<TData> {
  const payload = (await response.json()) as ApiEnvelope<TData>;
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? `Request failed with status ${response.status}`);
  }

  return payload.data;
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const { clearSession, refreshToken, setSession } = useAuthStore.getState();
    if (!refreshToken) {
      clearSession();
      return null;
    }

    const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
      body: JSON.stringify({ refreshToken } satisfies RefreshSessionRequest),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      clearSession();
      return null;
    }

    const data = await parseEnvelope<{ tokens: TokenPair; user: AuthenticatedUser }>(response);
    setSession(data.tokens, data.user);
    return data.tokens.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function apiRequest<TData>(path: string, init: RequestInit = {}, requiresAuth = true, retry = true): Promise<TData> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (requiresAuth) {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && requiresAuth && retry) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      headers.set('Authorization', `Bearer ${nextToken}`);
      return apiRequest<TData>(path, { ...init, headers }, requiresAuth, false);
    }
  }

  return parseEnvelope<TData>(response);
}

export interface CreateNodeResult {
  node: NodeRecord;
  nodeKey: string;
}

export interface AnalyticsOverview {
  captures: { total: number };
  nodes: {
    online: number;
    pending: number;
    total: number;
  };
  sessions: { total: number };
  topServices: Array<{ count: number; service: string }>;
}

export interface PersonaRecord {
  configFiles: Record<string, boolean>;
  createdAt: string;
  credentials: Record<string, string>;
  hardware: unknown;
  id: string;
  identity: unknown;
  models: unknown;
  name: string;
  preset: string | null;
  services: Record<string, boolean>;
  timing: unknown;
  updatedAt: string;
}

export interface ResponseConfigRecord {
  backfeed: {
    autoApprove: boolean;
    budgetLimitUsd: number;
    enabled: boolean;
    maxPerDay: number;
  };
  budget: {
    alertAt: number[];
    monthlyLimitUsd: number;
  };
  fixedN: {
    n: number;
    resetPeriod: 'daily' | 'never' | 'weekly';
  };
  proxy: {
    apiKey: string;
    baseUrl: string;
    maxRetries: number;
    model: string;
    systemPrompt: string;
    timeoutMs: number;
  };
  smart: {
    confidenceThreshold: number;
    validationPatterns: string[];
  };
  strategyChain: Array<'budget' | 'fixed_n' | 'smart'>;
}

export interface SessionDetail {
  actorId: string | null;
  classification: string | null;
  endedAt: string | null;
  id: string;
  nodeId: string;
  requestCount: number;
  requests: Array<{
    classification: string | null;
    id: string;
    method: string;
    path: string | null;
    responseCode: number | null;
    service: string;
    timestamp: string;
  }>;
  service: string;
  sourceIp: string;
  startedAt: string;
  userAgent: string | null;
}

export interface SessionSummary {
  actorId: string | null;
  classification: string | null;
  endedAt: string | null;
  id: string;
  nodeId: string;
  requestCount: number;
  service: string;
  sourceIp: string;
  startedAt: string;
  userAgent: string | null;
}

export interface AlertLogRecord {
  channel: string;
  id: string;
  payload: unknown;
  ruleId: string;
  sentAt: string;
  success: boolean;
}

export interface AlertRuleRecord {
  channels: string[];
  conditions: unknown;
  cooldownMin: number;
  createdAt: string;
  enabled: boolean;
  id: string;
  name: string;
  severity: string;
  updatedAt: string;
}

export interface ActorSessionRecord {
  classification: string | null;
  endedAt: string | null;
  id: string;
  nodeId: string;
  requestCount: number;
  service: string;
  sourceIp: string;
  startedAt: string;
  userAgent: string | null;
}

export interface ActorRecord {
  firstSeen: string;
  headerFingerprint: string | null;
  id: string;
  label: string | null;
  lastSeen: string;
  mergedFrom: string[];
  recentServices: string[];
  sessionCount: number;
  sourceIps: string[];
  tlsFingerprints: string[];
  userAgents: string[];
}

export interface ActorDetailRecord extends ActorRecord {
  sessions: ActorSessionRecord[];
}

export interface ExportRecord {
  content: string;
  filename: string;
  format: string;
  generatedAt: string;
  summary: {
    requests: number;
    sessions: number;
    uniqueSourceIps: number;
  };
}

export interface LiveFeedEventRecord {
  actorId: string | null;
  classification: string | null;
  id: string;
  method: string;
  nodeId: string;
  path: string | null;
  responseCode: number | null;
  service: string;
  sourceIp: string;
  strategy: string | null;
  timestamp: string;
  userAgent: string | null;
}

export interface MitreRecord {
  classification: string;
  count: number;
  tactic: string;
  techniqueId: string;
  techniqueName: string;
}

export interface IocRecord {
  classification: string | null;
  headerHash: string | null;
  path: string | null;
  service: string;
  sourceIp: string;
  tlsFingerprint: string | null;
  userAgent: string | null;
}

export interface StixBundle {
  id: string;
  objects: Array<{
    id: string;
    name: string;
    pattern: string;
    pattern_type: string;
    type: string;
  }>;
  type: string;
}

export const apiClient = {
  approveNode: (nodeId: string) => apiRequest<NodeRecord>(`/nodes/${nodeId}/approve`, { method: 'POST' }),
  createNode: (input: CreateNodeRequest) =>
    apiRequest<CreateNodeResult>('/nodes', {
      body: JSON.stringify(input),
      method: 'POST',
    }),
  enableTotp: (input: EnableTotpRequest) =>
    apiRequest<AuthenticatedUser>('/auth/enable-totp', {
      body: JSON.stringify(input),
      method: 'POST',
    }),
  getActor: (actorId: string) => apiRequest<ActorDetailRecord>(`/actors/${actorId}`),
  getActors: () => apiRequest<ActorRecord[]>('/actors'),
  getAlertLogs: () => apiRequest<AlertLogRecord[]>('/alerts/logs'),
  getAlertRules: () => apiRequest<AlertRuleRecord[]>('/alerts'),
  getAnalyticsOverview: () => apiRequest<AnalyticsOverview>('/analytics/overview'),
  getExportData: (format = 'json', days = 7) => apiRequest<ExportRecord>(`/export/data?format=${encodeURIComponent(format)}&days=${days}`),
  getExportReport: (format = 'markdown', days = 7) => apiRequest<ExportRecord>(`/export/report?format=${encodeURIComponent(format)}&days=${days}`),
  getLiveFeedEvents: () => apiRequest<LiveFeedEventRecord[]>('/live-feed/events'),
  getNode: (nodeId: string) => apiRequest<NodeRecord>(`/nodes/${nodeId}`),
  getNodes: () => apiRequest<NodeRecord[]>('/nodes'),
  getPersonas: () => apiRequest<PersonaRecord[]>('/personas'),
  getResponseConfig: (nodeId: string) => apiRequest<ResponseConfigRecord>(`/response-config/${nodeId}`),
  getThreatBlocklist: () => apiRequest<string[]>('/threat-intel/blocklist'),
  getThreatIocFeed: () => apiRequest<IocRecord[]>('/threat-intel/ioc'),
  getThreatMitre: () => apiRequest<MitreRecord[]>('/threat-intel/mitre'),
  getThreatStix: () => apiRequest<StixBundle>('/threat-intel/stix'),
  getSessions: () => apiRequest<SessionSummary[]>('/sessions'),
  getSession: (sessionId: string) => apiRequest<SessionDetail>(`/sessions/${sessionId}`),
  login: (input: LoginRequest) =>
    apiRequest<LoginResponse>('/auth/login', {
      body: JSON.stringify(input),
      method: 'POST',
    }, false),
  logout: (refreshToken: string) =>
    apiRequest<{ success: true }>('/auth/logout', {
      body: JSON.stringify({ refreshToken } satisfies RefreshSessionRequest),
      method: 'POST',
    }),
  me: () => apiRequest<AuthenticatedUser>('/auth/me'),
  register: (input: RegisterRequest) =>
    apiRequest<LoginResponse>('/auth/register', {
      body: JSON.stringify(input),
      method: 'POST',
    }, false),
  setupTotp: () => apiRequest<SetupTotpResponse>('/auth/setup-totp', { method: 'POST' }),
  updateNode: (nodeId: string, input: UpdateNodeRequest) =>
    apiRequest<NodeRecord>(`/nodes/${nodeId}`, {
      body: JSON.stringify(input),
      method: 'PATCH',
    }),
  verifyTotp: (input: VerifyTotpRequest) =>
    apiRequest<LoginResponse>('/auth/verify-totp', {
      body: JSON.stringify(input),
      method: 'POST',
    }, false),
};