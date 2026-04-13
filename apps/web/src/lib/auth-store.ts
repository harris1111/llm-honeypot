import type { AuthenticatedUser, TokenPair } from '@llmtrap/shared';
import { create } from 'zustand';

const storageKey = 'llmtrap-auth-session';

interface StoredAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthenticatedUser | null;
}

interface AuthState extends StoredAuthState {
  clearSession: () => void;
  hydrate: () => void;
  setSession: (tokens: TokenPair, user: AuthenticatedUser) => void;
  setTotpChallenge: (tempToken: string | null) => void;
  setUser: (user: AuthenticatedUser | null) => void;
  tempToken: string | null;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function persistSession(state: StoredAuthState): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

function readStoredSession(): StoredAuthState {
  if (!canUseStorage()) {
    return {
      accessToken: null,
      refreshToken: null,
      user: null,
    };
  }

  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) {
    return {
      accessToken: null,
      refreshToken: null,
      user: null,
    };
  }

  try {
    return JSON.parse(rawValue) as StoredAuthState;
  } catch {
    return {
      accessToken: null,
      refreshToken: null,
      user: null,
    };
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  clearSession: () => {
    if (canUseStorage()) {
      window.localStorage.removeItem(storageKey);
    }

    set({
      accessToken: null,
      refreshToken: null,
      tempToken: null,
      user: null,
    });
  },
  hydrate: () => {
    const stored = readStoredSession();
    set({ ...stored });
  },
  refreshToken: null,
  setSession: (tokens, user) => {
    const nextState = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    } satisfies StoredAuthState;

    persistSession(nextState);
    set({
      ...nextState,
      tempToken: null,
    });
  },
  setTotpChallenge: (tempToken) => {
    set({ tempToken });
  },
  setUser: (user) => {
    const current = readStoredSession();
    const nextState = { ...current, user } satisfies StoredAuthState;
    persistSession(nextState);
    set({ user });
  },
  tempToken: null,
  user: null,
}));