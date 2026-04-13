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
  getNode: (nodeId: string) => apiRequest<NodeRecord>(`/nodes/${nodeId}`),
  getNodes: () => apiRequest<NodeRecord[]>('/nodes'),
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